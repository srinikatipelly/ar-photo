import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Montserrat, Cormorant_Garamond } from 'next/font/google'
import { brand } from '@/lib/site-content'
import { getPartner } from '@/lib/partner'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})
const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Partner portal - The Golden Frame',
  robots: { index: false, follow: false },
}

// Gate: must be signed in AND have a `partners` row (added by an admin for v1).
export default async function PartnersLayout({ children }: { children: React.ReactNode }) {
  const { userId, email, partner } = await getPartner()

  if (!userId) redirect('/account/login?next=/partners')

  const shell = (inner: React.ReactNode) => (
    <div className={`site-shell ${montserrat.variable} ${cormorant.variable} flex min-h-screen flex-col`}>
      <header className="sticky top-0 z-50 border-b border-cream/10 bg-green-deep/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
          <a href="/partners" className="flex shrink-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt={brand.name} className="h-11 w-auto" />
            <span className="text-sm font-semibold uppercase tracking-widest text-gold-brand">Partner portal</span>
          </a>
          <div className="flex items-center gap-4">
            {email && <span className="hidden text-sm text-cream/60 sm:inline">{email}</span>}
            <form action="/api/auth/signout" method="post">
              <button type="submit"
                className="rounded-full border border-cream/25 px-4 py-2 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{inner}</main>
    </div>
  )

  // Signed in but not a partner → clear "request access" message (no data leaked).
  if (!partner) {
    return shell(
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-brand/15 text-3xl">🔒</div>
        <h1 className="font-display text-3xl text-cream">Partner access required</h1>
        <p className="mt-3 text-cream/70">
          You&apos;re signed in as <span className="font-medium text-cream">{email}</span>, but this account
          isn&apos;t set up as a partner yet. Contact us to be added.
        </p>
        <a href="mailto:hello@thegoldenframe.com.au"
          className="mt-6 inline-block rounded-full bg-gold-brand px-6 py-3 text-sm font-bold text-green-deep transition hover:bg-cream">
          Request partner access
        </a>
      </div>,
    )
  }

  return shell(children)
}
