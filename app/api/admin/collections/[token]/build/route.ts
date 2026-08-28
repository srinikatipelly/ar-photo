import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createAlbum, originFromRequest, AlbumValidationError } from '@/lib/create-album'
import { sendPartnerAlbumAdminEmail } from '@/lib/resend'
import { supabaseAdmin } from '@/lib/supabase'
import { isValidTokenFormat, uploadPrefix } from '@/lib/collections'

// Turn a submitted collection into an album, and email admin the QR.
//
// This is the step that was missing: a collection is intake only, so until an
// album exists there is no frameId and therefore no QR to send. MindAR's
// compiler is browser-only (see app/upload/compile.ts — it drives
// window.MINDAR.IMAGE.Compiler over HTMLImageElements), so the .mind target is
// compiled in the admin's browser and posted here as an already-uploaded key.

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { isAdmin } = await getAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { token } = await ctx.params
  if (!isValidTokenFormat(token)) {
    return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 })
  }

  const { data: row, error: readError } = await supabaseAdmin
    .from('collections')
    .select('id, token, kind, status, items, frame_id, contact_name, contact_email')
    .eq('token', token)
    .maybeSingle()

  if (readError || !row) {
    return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 })
  }
  if (row.status !== 'submitted') {
    return NextResponse.json({ error: 'That collection has not been submitted.' }, { status: 400 })
  }
  if (row.frame_id) {
    return NextResponse.json(
      { error: `An album already exists for this collection (${row.frame_id}).` },
      { status: 409 },
    )
  }

  let body: { targetKey?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const targetKey = String(body.targetKey ?? '')
  if (!targetKey) {
    return NextResponse.json({ error: 'targetKey is required.' }, { status: 400 })
  }

  // Items come from the DB, never from the request — the browser only supplies
  // the compiled target. Nothing the client sends can change which files end up
  // in the album.
  const items = (Array.isArray(row.items) ? row.items : []) as {
    photoKey: string
    videoKey: string
  }[]
  if (items.length === 0) {
    return NextResponse.json({ error: 'This collection has no uploads.' }, { status: 400 })
  }

  const prefix = uploadPrefix(token)
  if (!items.every((it) => it.photoKey?.startsWith(prefix) && it.videoKey?.startsWith(prefix))) {
    // Should be impossible — submit already enforced this — but re-checking here
    // means a bad row can never be turned into a live album.
    return NextResponse.json({ error: 'Collection items failed validation.' }, { status: 400 })
  }

  try {
    const result = await createAlbum({
      items,
      targetKey,
      origin: originFromRequest(req),
      customerName: row.contact_name ?? '',
      customerEmail: row.contact_email ?? '',
      partnerId: null,
      source: 'collect',
    })

    // Link the album back, so the admin list stops offering "Build album" and
    // a double-click can't mint a second album for the same uploads.
    const { error: linkError } = await supabaseAdmin
      .from('collections')
      .update({ frame_id: result.frameId })
      .eq('id', row.id)

    if (linkError) {
      console.error('Album built but collection not linked:', token, linkError.message)
    }

    // The QR goes to admin only — same rule as partner albums. For a partner
    // collection the deliverable is withheld until payment; for a customer one,
    // admin decides when to send it.
    try {
      await sendPartnerAlbumAdminEmail({
        frameId: result.frameId,
        arUrl: result.arUrl,
        qrDataUrl: result.qrDataUrl,
        count: result.count,
        albumName: row.contact_name ?? '',
        partnerEmail: row.contact_email ?? '',
        partnerCompany: row.kind === 'partner' ? 'Partner (collection link)' : 'Customer (collection link)',
        source: 'collect',
      })
    } catch (mailError) {
      // The album exists and is linked; a failed email must not undo that.
      console.error('Album built but admin email failed:', token, mailError)
    }

    return NextResponse.json({
      frameId: result.frameId,
      arUrl: result.arUrl,
      qrDataUrl: result.qrDataUrl,
      count: result.count,
    })
  } catch (error) {
    if (error instanceof AlbumValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Build album from collection failed:', token, error)
    return NextResponse.json({ error: 'Could not build the album.' }, { status: 500 })
  }
}
