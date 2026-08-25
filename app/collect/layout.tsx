import { Montserrat, Cormorant_Garamond } from 'next/font/google'

// The collect pages sat directly on the root layout, which uses Inter and no
// brand background — so an upload link looked nothing like the rest of the site,
// which matters when the link arrives cold over WhatsApp and has to look
// trustworthy enough to upload family photos to.
//
// Same fonts and `site-shell` as the marketing and admin layouts. No Nav or
// Footer on purpose: this page is reached from a QR or a shared link, and site
// navigation would only invite the visitor away from the one thing they're here
// to do.

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

export default function CollectLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`site-shell ${montserrat.variable} ${cormorant.variable} flex min-h-screen flex-col`}>
      {children}
    </div>
  )
}
