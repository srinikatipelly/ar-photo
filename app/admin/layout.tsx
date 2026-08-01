import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Montserrat, Cormorant_Garamond } from 'next/font/google'
import { brand } from '@/lib/site-content'
import { getAdmin } from '@/lib/admin'

const montserrat = Montserrat({ variable: '--font-montserrat', subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], display: 'swap' })
const cormorant = Cormorant_Garamond({ variable: '--font-display', subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Admin - The Golden Frame',
  robots: { index: false, follow: false },
}

// Gate: must be signed in AND an admin (ADMIN_EMAILS / ADMIN_EMAIL).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { email, isAdmin } = await getAdmin()
  if (!email) redirect('/account/login?next=/admin/partners')

  const shell = (inner: React.ReactNode) => (
    <div className={`site-shell ${montserrat.variable} ${cormorant.variable} flex min-h-screen flex-col`}>
      <header className="sticky top-0 z-50 border-b border-cream/10 bg-green-deep/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
          <a href="/admin/partners" className="flex shrink-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt={brand.name} className="h-11 w-auto" />
            <span className="text-sm font-semibold uppercase tracking-widest text-gold-brand">Admin</span>
          </a>
          <div className="flex items-center gap-4">
            {email && <span className="hidden text-sm text-cream/60 sm:inline">{email}</span>}
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="rounded-full border border-cream/25 px-4 py-2 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{inner}</main>
    </div>
  )

  if (!isAdmin) {
    return shell(
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-brand/15 text-3xl">🔒</div>
        <h1 className="font-display text-3xl text-cream">Admins only</h1>
        <p className="mt-3 text-cream/70">This account (<span className="text-cream">{email}</span>) isn&apos;t an admin.</p>
      </div>,
    )
  }

  return shell(children)
}
