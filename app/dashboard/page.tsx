import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import LogoutButton from './logout-button'

const ADMIN_EMAILS = ['thegoldenframecreations@gmail.com', 'srini.k2608@gmail.com']

interface Frame {
  id: number
  frame_id: string
  customer_name: string
  customer_email: string
  status: string
  payment_status: string | null
  scan_count: number
  price_paid: number | null
  created_at: string
  qr_url: string | null
}

async function getFrames(userId: string, isAdmin: boolean): Promise<Frame[]> {
  let query = supabaseAdmin
    .from('frames')
    .select('id, frame_id, customer_name, customer_email, status, payment_status, scan_count, price_paid, created_at, qr_url')
    .order('created_at', { ascending: false })
    .limit(200)

  // B2B users only see their own frames
  if (!isAdmin) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) { console.error('Dashboard query error:', error); return [] }
  return data ?? []
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:          'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending:         'bg-amber-50 text-amber-700 border-amber-200',
    inactive:        'bg-zinc-100 text-zinc-500 border-zinc-200',
    paid:            'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isAdmin  = ADMIN_EMAILS.includes(user.email ?? '')
  const frames   = await getFrames(user.id, isAdmin)
  const totalScans   = frames.reduce((s, f) => s + f.scan_count, 0)
  const totalRevenue = frames.reduce((s, f) => s + (f.price_paid ?? 0), 0)
  const businessName = user.user_metadata?.business_name as string | undefined

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-12 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">
            {isAdmin ? 'Admin' : 'B2B Dashboard'}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
            {isAdmin ? 'All Orders' : (businessName ?? 'My Frames')}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-400">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/upload"
            className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            + New Frame
          </a>
          <LogoutButton />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total frames',   value: frames.length },
          { label: 'Total scans',    value: totalScans },
          { label: 'Revenue (AUD)',  value: `$${(totalRevenue / 100).toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        {frames.length === 0 ? (
          <div className="flex flex-col items-center gap-4 p-16 text-center">
            <p className="text-sm text-zinc-400">No frames yet.</p>
            <a
              href="/upload"
              className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              Create your first frame →
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Frame ID</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5 text-right">Scans</th>
                  {isAdmin && <th className="px-5 py-3.5 text-right">Amount</th>}
                  <th className="px-5 py-3.5 text-right">QR</th>
                  <th className="px-5 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {frames.map(frame => (
                  <tr key={frame.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-900">{frame.customer_name || '—'}</p>
                      <p className="text-xs text-zinc-400">{frame.customer_email}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-zinc-500">{frame.frame_id}</td>
                    <td className="px-5 py-4"><StatusBadge status={frame.status} /></td>
                    <td className="px-5 py-4"><StatusBadge status={frame.payment_status ?? 'unknown'} /></td>
                    <td className="px-5 py-4 text-right text-zinc-600">{frame.scan_count}</td>
                    {isAdmin && (
                      <td className="px-5 py-4 text-right text-zinc-600">
                        {frame.price_paid ? `$${(frame.price_paid / 100).toFixed(2)}` : '—'}
                      </td>
                    )}
                    <td className="px-5 py-4 text-right">
                      {frame.qr_url ? (
                        <a
                          href={frame.qr_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          Download QR
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-zinc-400">
                      {new Date(frame.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric', month: 'short', year: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
