import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
  // AWS SDK v3 (>= ~3.729) defaults to "WHEN_SUPPORTED", which injects a
  // CRC32 checksum into presigned PUT URLs. R2 rejects that placeholder
  // checksum, breaking browser uploads. Only send checksums when required.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME ?? 'ar-frames',
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(r2, command, { expiresIn: 900 })
}

export function getPublicUrl(key: string) {
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
  return `${base}/${key}`
}

export async function getObjectUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME ?? 'ar-frames',
    Key: key,
  })

  return getSignedUrl(r2, command, { expiresIn: 900 })
}

// Derive the storage key from a public URL (reverse of getPublicUrl).
export function keyFromPublicUrl(url: string): string | null {
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
  if (base && url.startsWith(base + '/')) return url.slice(base.length + 1)
  // Fallback: take the path after the host (handles custom CDN domains).
  try {
    return new URL(url).pathname.replace(/^\//, '') || null
  } catch {
    return null
  }
}

export async function deleteObject(key: string) {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME ?? 'ar-frames',
      Key: key,
    }),
  )
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME ?? 'ar-frames',
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })
  await r2.send(command)
}
