import { NextRequest, NextResponse } from 'next/server'
import { getPartner } from '@/lib/partner'
import { createAlbum, originFromRequest, AlbumValidationError } from '@/lib/create-album'

// Partner album creation. Ownership (partner_id) and source are set from the
// verified session — never from the client. Body: { items, targetKey, customerName?,
// customerEmail? }, identical to /api/albums so the shared AlbumBuilder can post here.
export async function POST(req: NextRequest) {
  try {
    const { partner } = await getPartner()
    if (!partner) {
      return NextResponse.json({ error: 'Partner access required.' }, { status: 403 })
    }

    const { items, targetKey, customerName, customerEmail } = await req.json()

    const result = await createAlbum({
      items,
      targetKey,
      origin: originFromRequest(req),
      customerName,
      customerEmail,
      partnerId: partner.id,
      source: 'manual',
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
