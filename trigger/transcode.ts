import ws from 'ws'
// Node.js 21 has no native WebSocket — polyfill before Supabase client initialises
if (!globalThis.WebSocket) {
  // @ts-ignore
  globalThis.WebSocket = ws
}

import { task, logger } from '@trigger.dev/sdk/v3'
import { createWriteStream, createReadStream } from 'node:fs'
import { unlink, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  })
}

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  )
}

function getPublicUrl(key: string) {
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
  return `${base}/${key}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Encoder settings.
//
// This video becomes a WebGL texture on a plane roughly the size of a printed
// photo, and the phone downloads the whole file before AR can start. So the goal
// is not "maximum quality" — it is the best-looking texture that still loads
// quickly on mobile data. Every knob below is that trade-off.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cap on the LONGEST side, whichever orientation the source is.
 *
 * The previous filter was `scale=-2:1080`, which pins *height*. That quietly
 * penalised portrait video: a landscape source came out 1920x1080 (long side
 * 1920) but a 1080x1920 phone clip came out 608x1080 (long side 1080) — roughly
 * half the resolution, on what is by far the most common kind of upload.
 * It also upscaled small sources (640x480 became 1440x1080), which invents no
 * detail and just costs bytes.
 *
 * 1440 rather than 1920: the plane occupies a fraction of a phone screen, so the
 * extra pixels are mostly imperceptible while being very perceptible in download
 * time.
 */
const MAX_LONG_SIDE = 1440

/**
 * Single scale factor `min(1, MAX/iw, MAX/ih)` applied to both axes:
 *  - caps the long side regardless of orientation
 *  - the `min(1, …)` means it never upscales
 *  - `trunc(…/2)*2` keeps both dimensions even, required by yuv420p
 */
const SCALE_FILTER =
  `scale=w='trunc(iw*min(1,min(${MAX_LONG_SIDE}/iw,${MAX_LONG_SIDE}/ih))/2)*2'` +
  `:h='trunc(ih*min(1,min(${MAX_LONG_SIDE}/iw,${MAX_LONG_SIDE}/ih))/2)*2'`

/** 60fps doubles the bitrate for motion nobody perceives on a small AR plane. */
const MAX_FPS = 30

/**
 * 20 rather than 23 — visibly cleaner on the flat, evenly-lit footage people
 * shoot for these frames, at roughly 30% more bytes. Paired with the maxrate
 * ceiling below so a high-motion clip can't turn that into a 60 MB download.
 */
const CRF = '20'

/**
 * Hard bitrate ceiling. CRF alone is quality-targeted and unbounded, so a shaky
 * high-detail clip can balloon. At 3 Mbit/s the 60-second maximum upload lands
 * at ~22 MB worst case, and typical clips come in far under it.
 */
const MAX_BITRATE = '3M'
const BUF_SIZE = '6M'

type TranscodeDimensions = { input: string | null; output: string | null }

function runFFmpeg(input: string, output: string): Promise<TranscodeDimensions> {
  return new Promise<TranscodeDimensions>((resolve, reject) => {
    const args = [
      '-i', input,
      '-c:v', 'libx264',
      '-crf', CRF,
      // 'medium' over 'fast': ~10% better compression for the same CRF, i.e. the
      // quality bump above costs fewer bytes than it otherwise would. Not 'slow',
      // which risks the task timeout on this machine's single vCPU.
      '-preset', 'medium',
      '-vf', `${SCALE_FILTER},fps=${MAX_FPS}`,
      '-maxrate', MAX_BITRATE,
      '-bufsize', BUF_SIZE,
      '-pix_fmt', 'yuv420p',   // broadest device compatibility
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-y',                     // overwrite output without prompting
      output,
    ]

    const proc = spawn('ffmpeg', args)
    const stderr: string[] = []

    proc.stderr.on('data', (chunk: Buffer) => stderr.push(chunk.toString()))
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(parseDimensions(stderr.join('')))
      } else {
        reject(new Error(`FFmpeg exited ${code}: ${stderr.slice(-5).join('')}`))
      }
    })
    proc.on('error', reject)
  })
}

/**
 * Pull the input and output resolutions out of FFmpeg's stderr so the logs show
 * what the scale filter actually did — the only way to confirm on real uploads
 * that portrait clips stopped being halved. Best-effort: log-only, so a parse
 * miss must never fail the job.
 */
function parseDimensions(stderr: string): TranscodeDimensions {
  const outputIdx = stderr.indexOf('Output #0')
  const find = (haystack: string) => {
    // e.g. "Video: h264 (avc1 ...), yuv420p, 810x1440 [SAR 1:1 DAR 9:16]"
    const m = haystack.match(/Video:.*?, (\d+)x(\d+)/)
    return m ? `${m[1]}x${m[2]}` : null
  }

  try {
    return {
      input: find(outputIdx > 0 ? stderr.slice(0, outputIdx) : stderr),
      output: outputIdx > 0 ? find(stderr.slice(outputIdx)) : null,
    }
  } catch {
    return { input: null, output: null }
  }
}

export const transcodeVideo = task({
  id: 'transcode-video',
  machine: { preset: 'medium-1x' }, // 1 vCPU, 2 GB RAM
  // Raised from 600s: the 'medium' x264 preset is slower than 'fast', and this
  // budget also covers downloading a 200 MB upload and re-uploading the result.
  maxDuration: 900,

  run: async ({ frameId, videoUrl }: { frameId: string; videoUrl: string }) => {
    const tmp = tmpdir()
    const inputPath  = join(tmp, `${frameId}-raw`)
    const outputPath = join(tmp, `${frameId}-transcoded.mp4`)

    // ── 1. Download raw video ──────────────────────────────────────────────────
    logger.info('Downloading raw video', { frameId, videoUrl })
    const res = await fetch(videoUrl)
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${videoUrl}`)
    await pipeline(res.body as unknown as NodeJS.ReadableStream, createWriteStream(inputPath))

    const { size: rawSize } = await stat(inputPath)
    logger.info('Download complete', { rawSizeMB: (rawSize / 1024 / 1024).toFixed(1) })

    // ── 2. Transcode ───────────────────────────────────────────────────────────
    logger.info('Starting FFmpeg transcode')
    const dimensions = await runFFmpeg(inputPath, outputPath)

    const { size: outSize } = await stat(outputPath)
    logger.info('Transcode complete', {
      outSizeMB: (outSize / 1024 / 1024).toFixed(1),
      // Watch these: output should cap the LONG side at MAX_LONG_SIDE in either
      // orientation, and never exceed the input's dimensions.
      resolution: `${dimensions.input ?? '?'} -> ${dimensions.output ?? '?'}`,
      sizeReductionPct: rawSize > 0 ? (((rawSize - outSize) / rawSize) * 100).toFixed(0) : null,
    })

    // ── 3. Upload transcoded file to R2 ────────────────────────────────────────
    const transcodedKey = `video/${frameId}-transcoded.mp4`
    logger.info('Uploading to R2', { key: transcodedKey })

    await r2Client().send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME ?? 'ar-frames',
      Key: transcodedKey,
      Body: createReadStream(outputPath),
      ContentType: 'video/mp4',
      ContentLength: outSize,
    }))

    // ── 4. Update DB ───────────────────────────────────────────────────────────
    const newVideoUrl = getPublicUrl(transcodedKey)
    const { error } = await supabase()
      .from('frames')
      .update({ video_url: newVideoUrl, video_status: 'ready' })
      .eq('frame_id', frameId)

    if (error) throw new Error(`DB update failed: ${error.message}`)
    logger.info('Frame updated', { frameId, newVideoUrl })

    // ── 5. Cleanup temp files ──────────────────────────────────────────────────
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ])

    return { frameId, transcodedKey, outSizeMB: (outSize / 1024 / 1024).toFixed(1) }
  },

  onFailure: async ({ payload, error }) => {
    logger.error('Transcode failed', { frameId: payload.frameId, error: String(error) })
    await supabase()
      .from('frames')
      .update({ video_status: 'error' })
      .eq('frame_id', payload.frameId)
  },
})
