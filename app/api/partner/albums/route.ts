import { NextRequest, NextResponse } from 'next/server'
import { getPartner } from '@/lib/partner'
import { isAdminEmail } from '@/lib/admin'
import { createAlbum, originFromRequest, AlbumValidationError } from '@/lib/create-album'
import { sendPartnerAlbumAdminEmail, sendPartnerAlbumPendingEmail } from '@/lib/resend'

// Partner album creation. Ownership (partner_id) and source are set from the
// verified session — never from the client. Body: { items, targetKey, customerName?,
// customerEmail? }, identical to /api/albums so the shared AlbumBuilder can post here.
export async function POST(req: NextRequest) {
  try {
    const { partner } = await getPartner()
    if (!partner) {
      return NextResponse.json({ error: 'Partner access required.' }, { status: 403 })
    }

    const { items, targetKey, customerName, customerEmail, source } = await req.json()

    // 'manual' unless the bulk importer says otherwise ('drive' | 'zip').
    const albumSource = source === 'drive' || source === 'zip' ? source : 'manual'

    const result = await createAlbum({
      items,
      targetKey,
      origin: originFromRequest(req),
      customerName,
      customerEmail,
      partnerId: partner.id,
      source: albumSource,
    })

    // Notify: the QR goes to admins only. The partner gets a payment-pending note
    // instead, and an admin forwards the QR once payment clears. Admins creating
    // their own albums skip the partner-facing mail — they're the recipient of the
    // admin one already.
    const partnerIsAdmin = isAdminEmail(partner.email)
    await Promise.allSettled([
      sendPartnerAlbumAdminEmail({
        frameId: result.frameId,
        arUrl: result.arUrl,
        qrDataUrl: result.qrDataUrl,
        count: result.count,
        albumName: customerName,
        partnerEmail: partner.email,
        partnerCompany: partner.company,
        source: albumSource,
      }),
      partnerIsAdmin
        ? Promise.resolve()
        : sendPartnerAlbumPendingEmail({
            to: partner.email,
            frameId: result.frameId,
            count: result.count,
            albumName: customerName,
            partnerCompany: partner.company,
          }),
    ]).then((results) => {
      // Email failures must never fail album creation — the album already exists.
      for (const r of results) {
        if (r.status === 'rejected') console.error('Partner album email failed:', r.reason)
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AlbumValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Partner albums API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create the album.' },
      { status: 500 },
    )
  }
}
