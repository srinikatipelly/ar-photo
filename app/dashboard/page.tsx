import { supabaseAdmin } from '@/lib/supabase'

interface Frame {
  id: number
  frame_id: string
  customer_name: string
  customer_email: string
  status: string
  payment_status: string | null
  plan: string
  scan_count: number
  price_paid: number | null
  created_at: string
}

async function getOrders(): Promise<Frame[]> {
  const { data, error } = await supabaseAdmin
    .from('frames')
    .select('id, frame_id, customer_name, customer_email, status, payment_status, plan, scan_count, price_paid, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Dashboard query error:', error)
    return []
  }

  return data ?? []
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    inactive: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  const cls = map[status] ?? 'bg-zinc-100 text-zinc-500 border-zinc-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default async function DashboardPage() {
  const orders = await getOrders()

  const totalRevenue = orders.reduce((sum, o) => sum + (o.price_paid ?? 0), 0)
  const totalScans = orders.reduce((sum, o) => sum + o.scan_count, 0)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">Order Queue</h1>
        </div>
        <a href="/" className="text-sm text-zinc-500 hover:text-zinc-900">← Back to site</a>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total orders', value: orders.length },
          { label: 'Total scans', value: totalScans },
          { label: 'Revenue (AUD)', value: `$${(totalRevenue / 100).toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        {orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-400">
            No orders yet. Orders will appear here once customers complete checkout.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Frame ID</th>
                  <th className="px-5 py-3.5">Frame status</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5 text-right">Scans</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-900">{order.customer_name || '—'}</p>
                      <p className="text-xs text-zinc-400">{order.customer_email}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-zinc-500">{order.frame_id}</td>
                    <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-4"><StatusBadge status={order.payment_status ?? 'unknown'} /></td>
                    <td className="px-5 py-4 text-right text-zinc-600">{order.scan_count}</td>
                    <td className="px-5 py-4 text-right text-zinc-600">
                      {order.price_paid ? `$${(order.price_paid / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
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
