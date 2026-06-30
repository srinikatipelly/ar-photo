import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'
import { OrderCard, type Order } from '@/components/account/OrderCard'

export default async function AccountPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) redirect('/account/login')

  // Match the signed-in user's email to their orders (case-insensitive).
  const { data } = await supabaseAdmin
    .from('frames')
    .select('frame_id, customer_name, status, scan_count, created_at, photo_url, qr_url')
    .ilike('customer_email', user.email)
    .order('created_at', { ascending: false })

  const orders = (data ?? []) as Order[]

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-10">
      <h1 className="font-display text-4xl text-cream">My orders</h1>
      <p className="mt-2 text-sm text-cream/70">
        Signed in as <span className="text-cream">{user.email}</span>
      </p>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-cream/15 bg-green-mid/40 p-10 text-center">
          <div className="text-4xl" aria-hidden="true">🖼️</div>
          <h2 className="mt-4 font-display text-2xl text-cream">No orders yet</h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">
            Orders placed with this email will appear here. Ready to create your first living memory?
          </p>
          <a
            href="/landing/order"
            className="mt-6 inline-block rounded-full bg-gold-brand px-7 py-3.5 text-sm font-semibold text-green-deep transition hover:bg-cream"
          >
            Create your AR experience →
          </a>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {orders.map((order) => (
            <OrderCard key={order.frame_id} order={order} />
          ))}
        </div>
      )}

      <p className="mt-10 text-xs leading-relaxed text-cream/45">
        Deleting an order permanently removes your photo and video from our servers. Once deleted,
        the AR experience will no longer work and the files cannot be recovered.
      </p>
    </div>
  )
}
