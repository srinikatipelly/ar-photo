import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getUploadUrl } from '@/lib/r2'
import { getUsableCollection, uploadPrefix } from '@/lib/collections'

// Presigned upload URLs for a collection link.
//
// Deliberately not reusing /api/upload-url: that route takes the key prefix from
// the request body, so a caller picks where the object lands. Here the key is
// derived entirely from the validated token, which is what lets the submit
// handler trust that a key belongs to this collection.

/** Only what we actually display or compile. Keeps the bucket free of arbitrary uploads. */
const ALLOWED = {
  photo: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
} as const

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params

  // Re-checked on every request, not just on page load: a link can expire or be
  // submitted while someone has the upload page open.
  const result = await getUsableCollection(token)
  if ('rejection' in result) {
    return NextResponse.json({ error: 'This upload link is no longer active.' }, { status: 404 })
  }

  let body: { kind?: string; contentType?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const kind = body.kind === 'video' ? 'video' : 'photo'
  const contentType = String(body.contentType ?? '')

  if (!(ALLOWED[kind] as readonly string[]).includes(contentType)) {
    return NextResponse.json(
      { error: `Unsupported ${kind} format. Use ${ALLOWED[kind].join(', ')}.` },
      { status: 400 },
    )
  }

  // The client never gets to influence the key beyond photo-vs-video. The
  // extension comes from the content type we just validated, not the filename.
  const key = `${uploadPrefix(token)}${kind}-${nanoid()}.${EXTENSIONS[contentType]}`

  try {
    const uploadUrl = await getUploadUrl(key, contentType)
    return NextResponse.json({ uploadUrl, key })
  } catch (error) {
    console.error('Collection upload URL failed:', error)
    return NextResponse.json({ error: 'Unable to start the upload.' }, { status: 500 })
  }
}
