import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
})

export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME ?? 'ar-frames',
    Key: key,
    ContentType: contentType,
    // Add CORS headers to allow browser uploads
    Metadata: {
      'Cache-Control': 'max-age=3600',
    },
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
