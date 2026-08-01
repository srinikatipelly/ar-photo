import { supabaseAdmin } from '@/lib/supabase'
import { RequestActions } from '@/components/admin/RequestActions'

type Req = {
  id: string
  name: string
  email: string
  mobile: string | null
  city: string | null
  company: string | null
  message: string | null
  status: string
  created_at: string
  reviewed_at: string | null
}

export const dynamic = 'force-dynamic'

export default async function AdminPartnersPage() {
  const { data } = await supabaseAdmin
    .from('partner_requests')
    .select('id, name, email, mobile, city, company, message, status, created_at, reviewed_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const requests = (data ?? []) as Req[]
  const pending = requests.filter((r) => r.status === 'pending')
  const reviewed = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-cream sm:text-4xl">Partner applications</h1>
      <p className="mt-1 text-sm text-cream/60">{pending.length} pending · {reviewed.length} reviewed</p>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-widest text-gold-brand">Pending</h2>
      {pending.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-cream/20 bg-green-mid/30 p-8 text-center text-cream/60">No pending applications.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {pending.map((r) => (
            <div key={r.id} className="rounded-2xl border border-cream/15 bg-green-mid/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-lg text-cream">{r.name}</p>
                  <p className="text-sm text-cream/70">{r.email}{r.mobile ? ` · ${r.mobile}` : ''}</p>
                  <p className="mt-0.5 text-xs text-cream/50">
                    {[r.company, r.city].filter(Boolean).join(' · ') || '—'} · {new Date(r.created_at).toLocaleString()}
                  </p>
                  {r.message && <p className="mt-2 max-w-xl whitespace-pre-wrap text-sm text-cream/70">{r.message}</p>}
                </div>
                <RequestActions id={r.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-cream/50">Reviewed</h2>
          <div className="mt-4 space-y-2">
            {reviewed.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 rounded-xl border border-cream/10 bg-green-mid/20 px-4 py-3 text-sm">
                <span className="text-cream/80">{r.name} <span className="text-cream/50">· {r.email}</span></span>
                <span className={r.status === 'approved' ? 'text-gold-brand' : 'text-cream/40'}>{r.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
