import { AlbumBuilder } from '@/components/album/AlbumBuilder'
import { ALBUM_MAX_ITEMS } from '@/lib/album-config'

// Partner-gated album builder (the /partners layout enforces access). Posts to the
// partner API, which stamps partner_id + source='manual' from the session.
export default function NewPartnerAlbumPage() {
  return (
    <AlbumBuilder
      endpoint="/api/partner/albums"
      maxItems={ALBUM_MAX_ITEMS}
      eyebrow="New album"
      title="Build an AR album"
      backHref="/partners"
    />
  )
}
