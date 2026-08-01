import { NextRequest, NextResponse } from 'next/server'
import { getPartner } from '@/lib/partner'
import { extractFolderId, enumerateAlbum } from '@/lib/google-drive'
import { ALBUM_MAX_ITEMS } from '@/lib/album-config'

// Preview a shared Drive folder: list + validate the photo/video pairs. No transfer.
export async function POST(req: NextRequest) {
  try {
    const { partner } = await getPartner()
    if (!partner) return NextResponse.json({ error: 'Partner access required.' }, { status: 403 })

    const { folder } = await req.json()
    const folderId = extractFolderId(folder)
    const { items, validCount } = await enumerateAlbum(folderId)

    const overCap = validCount > ALBUM_MAX_ITEMS
    return NextResponse.json({
      folderId,
      maxItems: ALBUM_MAX_ITEMS,
      validCount,
      overCap,
      items: items.map((it) => ({
        name: it.name,
        photo: it.photo?.name ?? null,
        video: it.video?.name ?? null,
        ok: it.ok,
        issue: it.issue ?? null,
      })),
    })
  } catch (error) {
    console.error('Drive preview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to read that folder.' },
      { status: 400 },
    )
  }
}
