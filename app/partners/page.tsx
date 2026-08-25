import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { getPartner } from '@/lib/partner'
import { getAdmin } from '@/lib/admin'

type AlbumRow = {
  frame_id: string
  customer_name: string | null
  created_at: string
  scan_count: number | null
  qr_url: string | null
  items: unknown[] | null
}

// The three ways to build an album, shown when a partner has none yet.
const startOptions = [
  {
    href: '/partners/albums/import',
    icon: '📁',
    title: 'Bulk import from Google Drive',
    body: 'Share a folder with us — one subfolder per photo, each with its photo and video. Best for whole events.',
    cta: 'Import from Drive',
  },
  {
    href: '/partners/albums/import?mode=zip',
    icon: '🗂️',
    title: 'Upload a ZIP',
    body: 'Same folder structure, zipped up. Unpacked in your browser — no Google account needed.',
    cta: 'Upload a ZIP',
  },
  {
    href: '/partners/albums/new',
    icon: '🖼️',
    title: 'Add photos one by one',
    body: 'Pair each photo with its video by hand. Best for a handful of frames.',
    cta: 'Build manually',
  },
] as const

export default async function PartnerDashboard() {
  // The layout gates this — it redirects when signed out and renders a "request
  // access" screen for a non-partner. But the page body still runs alongside the
  // layout, so `partner!` threw a TypeError on every signed-out visit. The
  // redirect won the race, so the visitor saw the right thing, but each request
  // logged an error and the assertion was one layout change away from a 500.
  const { partner } = await getPartner()
  if (!partner) return null

  const { isAdmin } = await getAdmin()
  const supabase = await createServerSupabase()

  const { data } = await supabase
    .from('frames')
    .select('frame_id, customer_name, created_at, scan_count, qr_url, items')
    .eq('partner_id', partner.id)
    .eq('plan', 'album')
    .order('created_at', { ascending: false })

  const albums = (data ?? []) as AlbumRow[]

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-cream sm:text-4xl">Your albums</h1>
          <p className="mt-1 text-sm text-cream/60">
            {partner?.company ? `${partner.company} · ` : ''}{albums.length} album{albums.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <Link href="/admin/partners"
              className="rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand">
              Approvals
            </Link>
          )}
          <Link href="/partners/albums/import"
            className="rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand">
            Import (Drive / ZIP)
          </Link>
          <Link href="/partners/albums/new"
            className="rounded-full bg-gold-brand px-6 py-3 text-sm font-bold text-green-deep transition hover:bg-cream">
            + New album
          </Link>
        </div>
      </div>

      {albums.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-cream/20 bg-green-mid/30 p-8 sm:p-12">
          <div className="text-center">
            <p className="font-display text-2xl text-cream">No albums yet</p>
            <p className="mt-2 text-sm text-cream/60">Pick whichever way suits the job — all three end up as one QR per album.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {startOptions.map((o) => (
              <Link key={o.href} href={o.href}
                className="flex flex-col rounded-2xl border border-cream/15 bg-green-deep/40 p-5 text-left transition hover:border-gold-brand/60">
                <span className="text-2xl" aria-hidden="true">{o.icon}</span>
                <span className="mt-3 font-semibold text-cream">{o.title}</span>
                <span className="mt-1 text-xs leading-relaxed text-cream/55">{o.body}</span>
                <span className="mt-3 text-sm font-semibold text-gold-brand">{o.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <div key={a.frame_id} className="flex flex-col rounded-2xl border border-cream/15 bg-green-mid/40 p-5">
              {/* Partners don't get the QR here — it's released by us once payment
                  for the album is confirmed. Admins are the ones who send it, so
                  they still see it. */}
              {isAdmin && a.qr_url && (
                <div className="mx-auto w-fit rounded-xl bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.qr_url} alt="Album QR" className="h-28 w-28" />
                </div>
              )}
              <p className="mt-3 truncate font-display text-lg text-cream">{a.customer_name || 'Untitled album'}</p>
              <p className="mt-0.5 text-xs text-cream/50">
                {Array.isArray(a.items) ? a.items.length : 0} photos · {a.scan_count ?? 0} scans
              </p>
              <p className="mt-0.5 text-xs text-cream/40">{new Date(a.created_at).toLocaleDateString()}</p>
              <a href={`/ar?frame=${a.frame_id}`} target="_blank" rel="noopener noreferrer"
                className="mt-3 rounded-full border border-cream/25 px-4 py-2 text-center text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand">
                Open AR viewer
              </a>
              <p className="mt-2 text-center font-mono text-[11px] text-cream/40">{a.frame_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
