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

function runFFmpeg(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', input,
      '-c:v', 'libx264',
      '-crf', '23',
      '-preset', 'fast',
      '-vf', 'scale=-2:1080',
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
        resolve()
      } else {
        reject(new Error(`FFmpeg exited ${code}: ${stderr.slice(-5).join('')}`))
      }
    })
    proc.on('error', reject)
  })
}

export const transcodeVideo = task({
  id: 'transcode-video',
  machine: { preset: 'medium-1x' }, // 1 vCPU, 2 GB RAM
  maxDuration: 600,

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
    await runFFmpeg(inputPath, outputPath)

    const { size: outSize } = await stat(outputPath)
    logger.info('Transcode complete', { outSizeMB: (outSize / 1024 / 1024).toFixed(1) })

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
