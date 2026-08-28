import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { getPublicUrl } from '@/lib/r2'
import { isValidTokenFormat } from '@/lib/collections'
import BuildClient from './BuildClient'

// Build an album from a submitted collection. The compile has to happen in a
// browser (MindAR's compiler needs a DOM), so this page hands the uploaded
// photos to the admin's browser and lets it do the work.

export const dynamic = 'force-dynamic'

export default async function BuildAlbumPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const notice = (title: string, body: string) => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="font-display text-3xl text-cream">{title}</h1>
      <p className="mt-4 text-sm text-cream/70">{body}</p>
      <Link
        href="/admin/collections"
        className="mt-8 inline-block rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
      >
        ← Back to collections
      </Link>
    </div>
  )

  if (!isValidTokenFormat(token)) return notice('Unknown collection', 'That link doesn’t look right.')

  const { data, error } = await supabaseAdmin
    .from('collections')
    .select('token, kind, status, items, frame_id, contact_name, contact_email, label')
    .eq('token', token)
    .maybeSingle()

  if (error || !data) return notice('Unknown collection', 'No collection matches that token.')
  if (data.status !== 'submitted') {
    return notice('Nothing to build yet', 'This link hasn’t been submitted, so there are no uploads.')
  }
  if (data.frame_id) {
    return notice(
      'Album already built',
      `This collection is already linked to album ${data.frame_id}. The QR was emailed when it was created.`,
    )
  }

  const items = (Array.isArray(data.items) ? data.items : []) as {
    photoKey: string
    videoKey: string
  }[]

  if (items.length === 0) return notice('No uploads', 'This collection has no photo/video pairs.')

  // Public URLs so the browser can pull the photos back down to compile them.
  // Videos stay in R2 — only the photos are needed for tracking.
  const photos = items.map((it, i) => ({
    index: i,
    url: getPublicUrl(it.photoKey),
    name: it.photoKey.split('/').pop() ?? `photo-${i}.jpg`,
  }))

  return (
    <BuildClient
      token={data.token}
      label={data.label || data.contact_name || 'Collection'}
      kind={data.kind}
      contactName={data.contact_name ?? ''}
      contactEmail={data.contact_email ?? ''}
      photos={photos}
    />
  )
}
