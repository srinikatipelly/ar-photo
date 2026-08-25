import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createCollection } from '@/lib/collections'
import { generateQRWithLogo } from '@/lib/qr'

// Mint a collection link (Phase 4 · W4). Admin only — a link is a credential
// that lets anyone holding it upload into our bucket.
//
// Returns the URL and a QR data URL for the same URL, so admin can either print
// the QR or paste the link straight into WhatsApp.

export async function POST(req: NextRequest) {
  const { email, isAdmin } = await getAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    /* an empty body is fine — every field has a default */
  }

  try {
    const collection = await createCollection({
      label: typeof body.label === 'string' ? body.label : '',
      kind: body.kind === 'partner' ? 'partner' : 'customer',
      maxItems: typeof body.maxItems === 'number' ? body.maxItems : undefined,
      expiresInDays: typeof body.expiresInDays === 'number' ? body.expiresInDays : 30,
      createdBy: email ?? '',
    })

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
    const url = `${origin.replace(/\/$/, '')}/collect/${collection.token}`
    const { dataUrl: qrDataUrl } = await generateQRWithLogo(url)

    return NextResponse.json({
      token: collection.token,
      url,
      qrDataUrl,
      kind: collection.kind,
      maxItems: collection.maxItems,
      expiresAt: collection.expiresAt,
    })
  } catch (error) {
    console.error('Create collection link failed:', error)
    return NextResponse.json({ error: 'Could not create the link.' }, { status: 500 })
  }
}
