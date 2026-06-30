import type { Metadata } from 'next'
import { pricingTiers } from '@/lib/site-content'
import { Section, Eyebrow } from '@/components/site/Section'
import { PricingCard } from '@/components/site/PricingCard'
import { WhatsAppButton } from '@/components/site/WhatsAppButton'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, premium pricing for AR photo frames, digital AR experiences, and business volume orders.',
  alternates: { canonical: '/landing/pricing' },
}

const faqs = [
  {
    q: 'Do my customers need an app?',
    a: 'No. We use WebAR — it opens directly in the phone camera or browser on both iOS and Android.',
  },
  {
    q: 'How long can the video be?',
    a: 'Up to one minute, with sound. Longer or custom requirements? Talk to us about a tailored order.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Physical frames are handcrafted and dispatched within 2–3 business days. Digital QR codes are delivered by email.',
  },
  {
    q: 'Can I order in bulk for my business?',
    a: 'Yes — we offer volume pricing and branded delivery for real estate and business clients. Get in touch.',
  },
]

export default function PricingPage() {
  return (
    <>
      <Section tone="deep" className="pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">
            Simple, premium pricing
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Choose the living memory that suits you. No subscriptions, no hidden fees.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>
      </Section>

      <Section tone="mid">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
              Frequently asked
            </h2>
          </div>
          <div className="mt-10 space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-cream/15 bg-green-deep/40 p-6">
                <h3 className="font-display text-lg text-cream">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/70">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-sm text-cream/70">Still have a question?</p>
            <div className="mt-4 flex justify-center">
              <WhatsAppButton message="Hi! I have a question about The Golden Frame pricing." />
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
