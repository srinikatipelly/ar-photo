/**
 * Applies a CORS policy to the R2 bucket so the browser can upload files
 * directly via presigned PUT URLs.
 *
 * Without this, the browser's preflight OPTIONS request to
 * <bucket>.r2.cloudflarestorage.com returns 403 and the upload never starts.
 *
 * Run once (re-run any time you add a new origin):
 *   npx tsx --env-file=.env.local scripts/setup-r2-cors.ts
 */

import 'dotenv/config'
import { PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3'
import { r2 } from '../lib/r2'

const Bucket = process.env.R2_BUCKET_NAME ?? 'ar-frames'

// Origins allowed to upload. Add every domain the upload page is served from.
const AllowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://thegoldenframe.com.au',
  'https://www.thegoldenframe.com.au',
  'https://thegoldenframe.co',
  'https://www.thegoldenframe.co',
]

async function main() {
  console.log(`Applying CORS to bucket "${Bucket}"…`)

  await r2.send(
    new PutBucketCorsCommand({
      Bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins,
            AllowedMethods: ['GET', 'PUT', 'HEAD'],
            AllowedHeaders: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  )

  const current = await r2.send(new GetBucketCorsCommand({ Bucket }))
  console.log('CORS applied. Current rules:')
  console.log(JSON.stringify(current.CORSRules, null, 2))
}

main().catch((err) => {
  console.error('Failed to apply CORS:', err)
  process.exit(1)
})
