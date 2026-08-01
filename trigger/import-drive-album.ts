import ws from 'ws'
// Node has no native WebSocket in some runtimes — polyfill before Supabase loads.
if (!globalThis.WebSocket) {
  ;(globalThis as unknown as { WebSocket: unknown }).WebSocket = ws
}

import { task, logger } from '@trigger.dev/sdk/v3'
import { createWriteStream, createReadStream } from 'node:fs'
import { unlink, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { nanoid } from 'nanoid'
import { enumerateAlbum, downloadFile } from '../lib/google-drive'
import { ALBUM_MAX_ITEMS } from '../lib/album-config'

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

function extOf(name: string, fallback: string) {
  const e = name.includes('.') ? name.split('.').pop()! : ''
  return e || fallback
}

async function mirrorFile(fileId: string, name: string, mimeType: string, type: 'photo' | 'video'): Promise<string> {
  const tmp = join(tmpdir(), `${nanoid()}-${type}`)
  try {
    const stream = await downloadFile(fileId)
    await pipeline(stream, createWriteStream(tmp))
    const { size } = await stat(tmp)
    const key = `${type}s/${nanoid()}.${extOf(name, type === 'photo' ? 'jpg' : 'mp4')}`
    await r2Client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME ?? 'ar-frames',
        Key: key,
        Body: createReadStream(tmp),
        ContentType: mimeType || (type === 'photo' ? 'image/jpeg' : 'video/mp4'),
        ContentLength: size,
      }),
    )
    return key
  } finally {
    await unlink(tmp).catch(() => {})
  }
}

type Payload = { jobId: string; folderId: string; partnerId: string; albumName?: string }

/**
 * Mirror a shared Google Drive event folder into R2. Heavy transfer runs here (not
 * in a Vercel function). Writes the resulting R2 keys + photo URLs onto the
 * import_jobs row; the browser then compiles the .mind and creates the album.
 */
export const importDriveAlbum = task({
  id: 'import-drive-album',
  machine: { preset: 'medium-1x' },
  maxDuration: 1800,

  run: async ({ jobId, folderId }: Payload) => {
    const db = supabase()
    await db.from('import_jobs').update({ status: 'mirroring', updated_at: new Date().toISOString() }).eq('id', jobId)

    const { items } = await enumerateAlbum(folderId)
    const valid = items.filter((i) => i.ok && i.photo && i.video).slice(0, ALBUM_MAX_ITEMS)
    if (valid.length === 0) throw new Error('No valid photo+video subfolders found to import.')

    logger.info('Mirroring Drive album', { jobId, folderId, count: valid.length })

    const mirrored: { photoKey: string; videoKey: string; photoUrl: string; name: string }[] = []
    for (let i = 0; i < valid.length; i++) {
      const it = valid[i]
      logger.info(`Mirroring item ${i + 1}/${valid.length}`, { name: it.name })
      const photoKey = await mirrorFile(it.photo!.id, it.photo!.name, it.photo!.mimeType, 'photo')
      const videoKey = await mirrorFile(it.video!.id, it.video!.name, it.video!.mimeType, 'video')
      mirrored.push({ photoKey, videoKey, photoUrl: getPublicUrl(photoKey), name: it.name })
      // Progress ping so the UI can show movement.
      await db.from('import_jobs').update({ items: mirrored, updated_at: new Date().toISOString() }).eq('id', jobId)
    }

    await db
      .from('import_jobs')
      .update({ status: 'ready', items: mirrored, updated_at: new Date().toISOString() })
      .eq('id', jobId)

    logger.info('Mirror complete', { jobId, count: mirrored.length })
    return { jobId, count: mirrored.length }
  },

  onFailure: async ({ payload, error }) => {
    logger.error('Drive import failed', { jobId: payload.jobId, error: String(error) })
    await supabase()
      .from('import_jobs')
      .update({ status: 'error', error: String(error instanceof Error ? error.message : error), updated_at: new Date().toISOString() })
      .eq('id', payload.jobId)
  },
})
