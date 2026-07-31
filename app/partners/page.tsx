import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { getPartner } from '@/lib/partner'

type AlbumRow = {
  frame_id: string
  customer_name: string | null
  created_at: string
  scan_count: number | null
  qr_url: string | null
  items: unknown[] | null
}

export default async function PartnerDashboard() {
  // The layout already gated this; getPartner is cheap (cached request) and gives us the id.
  const { partner } = await getPartner()
  const supabase = await createServerSupabase()

  const { data } = await supabase
    .from('frames')
    .select('frame_id, customer_name, created_at, scan_count, qr_url, items')
    .eq('partner_id', partner!.id)
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
        <div className="mt-10 rounded-3xl border border-dashed border-cream/20 bg-green-mid/30 p-12 text-center">
          <p className="text-cream/60">No albums yet.</p>
          <Link href="/partners/albums/new" className="mt-4 inline-block font-semibold text-gold-brand hover:underline">
            Create your first album →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <div key={a.frame_id} className="flex flex-col rounded-2xl border border-cream/15 bg-green-mid/40 p-5">
              {a.qr_url && (
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
