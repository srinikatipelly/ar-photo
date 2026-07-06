import type { Metadata } from 'next'
import { Montserrat, Cormorant_Garamond } from 'next/font/google'
import { brand } from '@/lib/site-content'
import { Nav } from '@/components/site/Nav'
import { Footer } from '@/components/site/Footer'

// Body / UI font - matches the brand's thin, wide-tracked logo wordmark.
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

// Display serif for luxe headings - high-contrast, classic luxury/wedding feel.
const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const description =
  'Premium AR photo frames that bring your memories to life. Scan the frame and watch your video play in augmented reality - weddings, birthdays, real estate and business.'

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: {
    default: 'The Golden Frame - Living Memories in Augmented Reality',
    template: '%s - The Golden Frame',
  },
  description,
  applicationName: brand.name,
  alternates: { canonical: '/landing' },
  openGraph: {
    type: 'website',
    siteName: brand.name,
    title: 'The Golden Frame - Living Memories in Augmented Reality',
    description,
    url: '/landing',
    locale: 'en_AU',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: brand.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Golden Frame - Living Memories in Augmented Reality',
    description,
    images: ['/og.png'],
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`site-shell ${montserrat.variable} ${cormorant.variable} flex min-h-screen flex-col`}>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
