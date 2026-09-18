import { AlbumBuilder } from '@/components/album/AlbumBuilder'
import { ALBUM_MAX_ITEMS } from '@/lib/album-config'
import { getAdmin } from '@/lib/admin'

// Partner-gated album builder (the /partners layout enforces access). Posts to the
// partner API, which stamps partner_id + source='manual' from the session.
export default async function NewPartnerAlbumPage() {
  // Partners never see the QR — an admin releases it once payment clears. Admins
  // are super-partners and are the ones sending it, so they do.
  const { isAdmin } = await getAdmin()

  return (
    <AlbumBuilder
      endpoint="/api/partner/albums"
      maxItems={ALBUM_MAX_ITEMS}
      eyebrow="New album"
      title="Build an AR album"
      backHref="/partners"
      showQr={isAdmin}
      // Partners are capped at 200 MB per video so they don't sit through a
      // doomed upload. Admins upload masters, so no cap — R2 takes the PUT
      // directly and nothing server-side checks the size.
      maxVideoBytes={isAdmin ? null : undefined}
    />
  )
}
