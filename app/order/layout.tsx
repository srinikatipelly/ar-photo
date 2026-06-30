import { Montserrat, Cormorant_Garamond } from 'next/font/google'

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

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`site-shell ${montserrat.variable} ${cormorant.variable} min-h-screen`}>{children}</div>
  )
}
