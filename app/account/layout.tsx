import type { Metadata } from 'next'
import { Montserrat, Cormorant_Garamond } from 'next/font/google'
import { brand } from '@/lib/site-content'
import { createServerSupabase } from '@/lib/supabase/server'

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
  title: 'My account — The Golden Frame',
  robots: { index: false, follow: false },
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className={`site-shell ${montserrat.variable} ${cormorant.variable} flex min-h-screen flex-col`}>
      <header className="sticky top-0 z-50 border-b border-cream/10 bg-green-deep/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3.5 sm:px-10">
          <a href="/landing" className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt={brand.name} className="h-11 w-auto sm:h-12" />
          </a>
          {user && (
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-cream/60 sm:inline">{user.email}</span>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-cream/25 px-4 py-2 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
