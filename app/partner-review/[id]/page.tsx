import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { ReviewActions } from '@/components/partner/ReviewActions'

export const metadata: Metadata = {
  title: 'Review partner application',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// Token-protected, login-free review of a single partner application. The admin
// email links here with ?token=; the token must match the row's secret. Approve/
// Reject POST that same token, so no sign-in is needed — but the mutation only
// happens on a real button click, so a prefetching email scanner can't auto-action.
export default async function PartnerReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams

  const { data: row } = await supabaseAdmin
    .from('partner_requests')
    .select('id, name, email, mobile, city, company, message, status, token')
    .eq('id', id)
    .single()

  const valid = !!row && !!token && row.token === token

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-green-deep px-4 py-16 text-cream">
      <div className="w-full max-w-lg">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="The Golden Frame" className="mx-auto h-14 w-auto" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-brand">Partner application</p>
        </div>

        {!valid ? (
          <div className="mt-8 rounded-3xl border border-cream/15 bg-green-mid/40 p-8 text-center">
            <div className="text-3xl">⚠️</div>
            <p className="mt-2 font-display text-xl text-cream">Invalid or expired link</p>
            <p className="mt-1.5 text-sm text-cream/70">
              This review link isn&apos;t valid. Open the latest application email, or manage applications from the admin portal.
            </p>
          </div>
        ) : row!.status !== 'pending' ? (
          <div className="mt-8 rounded-3xl border border-cream/15 bg-green-mid/40 p-8 text-center">
            <div className="text-3xl">{row!.status === 'approved' ? '✅' : '✕'}</div>
            <p className="mt-2 font-display text-xl text-cream">Already {row!.status}</p>
            <p className="mt-1.5 text-sm text-cream/70">This application ({row!.name}) has already been {row!.status}.</p>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-cream/15 bg-green-mid/40 p-6 sm:p-8">
            <div className="rounded-2xl border border-cream/10 bg-green-deep/40 p-5">
              <p className="font-display text-lg text-cream">{row!.name}</p>
              <p className="mt-1 text-sm text-cream/70">{row!.email}{row!.mobile ? ` · ${row!.mobile}` : ''}</p>
              <p className="mt-0.5 text-xs text-cream/50">{[row!.company, row!.city].filter(Boolean).join(' · ') || '—'}</p>
              {row!.message && <p className="mt-3 whitespace-pre-wrap text-sm text-cream/70">{row!.message}</p>}
            </div>
            <div className="mt-6">
              <ReviewActions id={row!.id} token={token!} name={row!.name} />
            </div>
            <p className="mt-4 text-center text-xs text-cream/40">Approving activates the partner and emails them a sign-in link.</p>
          </div>
        )}
      </div>
    </main>
  )
}
