import ImportClient from './ImportClient'
import { getAdmin } from '@/lib/admin'

// Server wrapper: the service-account address lives in a server-only env var, but
// partners need to read it to share their Drive folder. Pass it down rather than
// exposing it as a NEXT_PUBLIC_* var. `?mode=zip` preselects the ZIP tab so the
// dashboard can link straight to either source.
export default async function ImportAlbumPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const { isAdmin } = await getAdmin()

  return (
    <ImportClient
      serviceAccountEmail={process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null}
      initialMode={mode === 'zip' ? 'zip' : 'drive'}
      showQr={isAdmin}
    />
  )
}
