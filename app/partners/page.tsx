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
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Your albums</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {partner?.company ? `${partner.company} · ` : ''}{albums.length} album{albums.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link href="/partners/albums/new"
          className="rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-300">
          + New album
        </Link>
      </div>

      {albums.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-zinc-500">No albums yet.</p>
          <Link href="/partners/albums/new" className="mt-4 inline-block font-semibold text-amber-600 hover:underline">
            Create your first album →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <div key={a.frame_id} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              {a.qr_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.qr_url} alt="Album QR" className="mx-auto h-32 w-32" />
              )}
              <p className="mt-3 truncate font-semibold text-zinc-900">{a.customer_name || 'Untitled album'}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {Array.isArray(a.items) ? a.items.length : 0} photos · {a.scan_count ?? 0} scans
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">{new Date(a.created_at).toLocaleDateString()}</p>
              <a href={`/ar?frame=${a.frame_id}`} target="_blank" rel="noopener noreferrer"
                className="mt-3 rounded-full border border-zinc-200 px-4 py-2 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                Open AR viewer
              </a>
              <p className="mt-2 text-center font-mono text-[11px] text-zinc-400">{a.frame_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
