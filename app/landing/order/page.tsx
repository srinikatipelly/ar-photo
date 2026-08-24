import { getRegion } from '@/lib/region-server'
import { getBrand, REGIONS } from '@/lib/regions'
import { WhatsAppButton } from '@/components/site/WhatsAppButton'
import OrderForm from './OrderForm'

// ─────────────────────────────────────────────────────────────────────────────
// Order page — routes the buyer by region.
//
// Self-serve checkout is Stripe, which charges AUD only, so it's offered in
// Australia alone. India sells the digital product at ₹499 (see TIER_VISIBILITY
// in lib/regions.ts) and is WhatsApp-first anyway, so Indian visitors get a
// concierge path instead of a checkout that would quote ₹499 and then charge
// their card in Australian dollars.
//
// Every "Order" CTA on the site points here (brand.orderUrl), so this one branch
// covers the nav, the landing hero, and the pricing page without touching them.
//
// When India gets its own payment path, delete the branch and this page becomes
// a thin wrapper again.
// ─────────────────────────────────────────────────────────────────────────────

export default async function OrderPage() {
  const region = await getRegion()

  if (region === 'in') return <IndiaConcierge />

  return <OrderForm />
}

function IndiaConcierge() {
  const { digital } = REGIONS.in.prices
  const { email } = getBrand('in')

  const steps = [
    {
      icon: '💬',
      label: 'Message us on WhatsApp',
      body: 'Tell us what you need and send through your photo and video — up to 1 minute long.',
    },
    {
      icon: '🪄',
      label: 'We build your AR experience',
      body: 'We bring your photo to life with your video and send back a QR code to print or share.',
    },
    {
      icon: '✨',
      label: 'Scan and relive it',
      body: 'Point any phone camera at the QR code and watch the moment play — as often as you like.',
    },
  ]

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <a href="/landing" className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="The Golden Frame" className="h-14 w-auto" />
      </a>

      <span className="inline-flex rounded-full bg-gold-brand/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gold-brand">
        🇮🇳 India · Digital AR
      </span>

      <h1 className="mt-6 font-display text-4xl text-cream sm:text-5xl">Order on WhatsApp</h1>

      <p className="mt-4 text-base leading-relaxed text-cream/75">
        We take India orders personally over WhatsApp — send us your photo and video and we&apos;ll
        handle the rest. Digital AR experiences start at{' '}
        <span className="font-semibold text-cream">{digital.price}</span>.
      </p>

      <div className="mt-8">
        <WhatsAppButton
          region="in"
          message="Hi! I'd like to order a Digital AR experience."
        >
          Start my order on WhatsApp
        </WhatsAppButton>
      </div>

      <div className="mt-10 w-full rounded-3xl border border-cream/15 bg-green-mid/40 p-7 text-left">
        <h2 className="font-display text-xl text-cream">How it works</h2>
        <ol className="mt-5 space-y-5">
          {steps.map(({ icon, label, body }) => (
            <li key={label} className="flex gap-4">
              <span
                className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold-brand text-sm"
                aria-hidden="true"
              >
                {icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-cream">{label}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-cream/70">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-8 text-xs text-cream/50">
        Prefer email? Write to{' '}
        <a href={`mailto:${email}`} className="underline underline-offset-2 hover:text-gold-brand">
          {email}
        </a>
        .
      </p>
    </main>
  )
}
