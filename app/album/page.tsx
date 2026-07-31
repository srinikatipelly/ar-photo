import { AlbumBuilder } from '@/components/album/AlbumBuilder'
import { ALBUM_MAX_ITEMS } from '@/lib/album-config'

// Internal album builder (ungated test tool). Posts to the public /api/albums.
// Partner-owned albums use /partners/albums/new instead.
export default function AlbumBuilderPage() {
  return <AlbumBuilder endpoint="/api/albums" maxItems={ALBUM_MAX_ITEMS} eyebrow="Album (test)" backHref="/" />
}
