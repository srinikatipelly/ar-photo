import 'server-only'
import { generateQRWithLogo } from '@/lib/qr'
import { supabaseAdmin } from '@/lib/supabase'
import { getPublicUrl, uploadBuffer } from '@/lib/r2'
import { generateFrameId } from '@/lib/utils'
import { ALBUM_MAX_ITEMS } from '@/lib/album-config'

// Shared album creation, used by both the public /api/albums (test tool) and the
// partner album API. An album is a single `frames` row: plan='album', one combined
// .mind target, and an `items` JSONB array whose order matches the target index
// order (anchor i ↔ items[i]). Single-photo frames are untouched.

export type AlbumItemKeys = { photoKey: string; videoKey: string }

export type CreateAlbumInput = {
  items: AlbumItemKeys[]
  targetKey: string
  /** `${protocol}://${host}` — used to build the AR URL + QR. */
  origin: string
  customerName?: string
  customerEmail?: string
  /** Set for partner albums; null for the public test tool. */
  partnerId?: string | null
  /** 'manual' | 'drive' | 'zip' | null */
  source?: string | null
}

export type CreateAlbumResult = { frameId: string; arUrl: string; qrDataUrl: string; count: number }

export class AlbumValidationError extends Error {}

export async function createAlbum(input: CreateAlbumInput): Promise<CreateAlbumResult> {
  const { items, targetKey, origin, customerName, customerEmail, partnerId, source } = input

  if (!Array.isArray(items) || items.length === 0) {
    throw new AlbumValidationError('items must be a non-empty array.')
  }
  if (items.length > ALBUM_MAX_ITEMS) {
    throw new AlbumValidationError(`An album can have at most ${ALBUM_MAX_ITEMS} photos.`)
  }
  if (!targetKey) {
    throw new AlbumValidationError('targetKey (the combined .mind target) is required.')
  }
  for (const it of items) {
    if (!it || !it.photoKey || !it.videoKey) {
      throw new AlbumValidationError('Every item needs both a photoKey and a videoKey.')
    }
  }

  const frameId = generateFrameId()

  // Public URLs, in the SAME ORDER as the compiled target images.
  const itemUrls = items.map((it) => ({
    photoUrl: getPublicUrl(it.photoKey),
    videoUrl: getPublicUrl(it.videoKey),
  }))

  const frame = {
    frame_id: frameId,
    customer_email: customerEmail ?? '',
    customer_name: customerName ?? '',
    // First item doubles as the row's headline photo/video (thumbnails / fallback).
    photo_url: itemUrls[0].photoUrl,
    video_url: itemUrls[0].videoUrl,
    target_url: getPublicUrl(targetKey),
    status: 'active',
    plan: 'album',
    items: itemUrls,
    partner_id: partnerId ?? null,
    source: source ?? null,
    // Albums aren't run through the single-video transcode job; keep a valid,
    // inert status (the viewer doesn't read this column).
    video_status: 'processing',
    scan_count: 0,
    created_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin.from('frames').insert(frame)
  if (error) {
    console.error('Supabase album insert error:', error)
    if (error.message?.includes('items') || error.message?.includes('partner_id') || error.message?.includes('source')) {
      throw new Error(
        "An album column is missing. Run the Phase 1 migration (partners table + frames.partner_id/source + items). See partner-module-plan.md.",
      )
    }
    throw new Error(error.message)
  }

  // One QR for the whole album.
  const arUrl = `${origin}/ar?frame=${frameId}`
  let qrDataUrl = ''
  try {
    const { dataUrl, buffer: qrBuffer } = await generateQRWithLogo(arUrl)
    qrDataUrl = dataUrl
    const qrKey = `qr/${frameId}.png`
    await uploadBuffer(qrKey, qrBuffer, 'image/png')
    await supabaseAdmin.from('frames').update({ qr_url: getPublicUrl(qrKey) }).eq('frame_id', frameId)
  } catch (qrError) {
    console.error('Album QR generation error:', qrError)
    // Non-fatal: the album still works via arUrl.
  }

  return { frameId, arUrl, qrDataUrl, count: itemUrls.length }
}

/** Build `${protocol}://${host}` from a request, honoring proxy headers. */
export function originFromRequest(req: Request): string {
  const host = req.headers.get('host') ?? 'localhost:3000'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const fallbackProtocol = appUrl.startsWith('https') ? 'https' : 'http'
  const protocol = req.headers.get('x-forwarded-proto') ?? fallbackProtocol
  return `${protocol}://${host}`
}
