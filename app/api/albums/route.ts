import { NextRequest, NextResponse } from 'next/server'
import { generateQRWithLogo } from '@/lib/qr'
import { supabaseAdmin } from '@/lib/supabase'
import { getPublicUrl, uploadBuffer } from '@/lib/r2'
import { generateFrameId } from '@/lib/utils'

// Album mode: one QR → many photo+video pairs. Stored as a single `frames` row
// with plan='album' and an `items` JSONB array (order matches the combined .mind
// target index order, so anchor i ↔ items[i]). Single-photo frames are unaffected.
//
// This is the album *creation* endpoint used by the /album builder. It deliberately
// skips the paid-order machinery (address, emails, transcode) — wiring albums into
// checkout is a later step (see album-mode-plan.md).

const MAX_ITEMS = 10

type ItemKeys = { photoKey: string; videoKey: string }

export async function POST(req: NextRequest) {
  try {
    const { items, targetKey, customerEmail, customerName } = await req.json()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items must be a non-empty array.' }, { status: 400 })
    }
    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: `An album can have at most ${MAX_ITEMS} photos.` }, { status: 400 })
    }
    if (!targetKey) {
      return NextResponse.json({ error: 'targetKey (the combined .mind target) is required.' }, { status: 400 })
    }
    for (const it of items as ItemKeys[]) {
      if (!it || !it.photoKey || !it.videoKey) {
        return NextResponse.json({ error: 'Every item needs both a photoKey and a videoKey.' }, { status: 400 })
      }
    }

    const frameId = generateFrameId()

    // Public URLs, in the SAME ORDER as the compiled target images.
    const itemUrls = (items as ItemKeys[]).map((it) => ({
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
      // Albums aren't run through the single-video transcode job; keep a valid,
      // inert status (the viewer doesn't read this column).
      video_status: 'processing',
      scan_count: 0,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabaseAdmin.from('frames').insert(frame)
    if (error) {
      console.error('Supabase album insert error:', error)
      if (error.message?.includes('items')) {
        return NextResponse.json(
          { error: "The 'items' column is missing. Run: ALTER TABLE public.frames ADD COLUMN IF NOT EXISTS items JSONB;" },
          { status: 500 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // One QR for the whole album.
    const host = req.headers.get('host') ?? 'localhost:3000'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const fallbackProtocol = appUrl.startsWith('https') ? 'https' : 'http'
    const protocol = req.headers.get('x-forwarded-proto') ?? fallbackProtocol
    const arUrl = `${protocol}://${host}/ar?frame=${frameId}`

    let qrDataUrl = ''
    try {
      const { dataUrl, buffer: qrBuffer } = await generateQRWithLogo(arUrl)
      qrDataUrl = dataUrl
      const qrKey = `qr/${frameId}.png`
      await uploadBuffer(qrKey, qrBuffer, 'image/png')
      await supabaseAdmin.from('frames').update({ qr_url: getPublicUrl(qrKey) }).eq('frame_id', frameId)
    } catch (qrError) {
      console.error('Album QR generation error:', qrError)
      // Non-fatal: the album still works via the arUrl below.
    }

    return NextResponse.json({ frameId, arUrl, qrDataUrl, count: itemUrls.length })
  } catch (error) {
    console.error('Albums API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create the album.' },
      { status: 500 },
    )
  }
}
