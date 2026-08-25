import type { Metadata } from 'next'
import { brand } from '@/lib/site-content'
import { REGIONS } from '@/lib/regions'
import { Section, Eyebrow } from '@/components/site/Section'
import { PartnerApplyForm } from '@/components/site/PartnerApplyForm'

export const metadata: Metadata = {
  title: 'Partners',
  description:
    'Become a Golden Frame partner — turn your customers’ photos into living AR albums and grow your business with a new revenue stream. Apply now.',
  alternates: { canonical: '/landing/partners' },
}

const benefits = [
  { icon: '💰', title: 'A new revenue stream', body: 'Add AR albums to what you already offer and earn more on every order.' },
  { icon: '🖼️', title: 'One QR, whole album', body: 'A single scan and every photo plays its own video — automatically.' },
  { icon: '🏷️', title: 'Your customers, your brand', body: 'Create and manage albums for your clients from your own partner portal.' },
]

const howItWorks = [
  { n: '1', title: 'Upload', body: 'Once activated, upload your customer’s photos and videos — a full album, or even just a single photo or video.' },
  { n: '2', title: 'Invoice', body: 'We email you an invoice for the order.' },
  { n: '3', title: 'Payment', body: 'As soon as payment is received, we prepare your album.' },
  { n: '4', title: 'QR code', body: 'We email you one QR code for the whole album.' },
  { n: '5', title: 'Print', body: 'Print the QR on the album — the cover, the back, or an insert.' },
  { n: '6', title: 'The magic ✨', body: 'Your customer scans once and every photo comes alive, playing automatically.' },
]

const applySteps = [
  { n: '1', title: 'You apply', body: 'Send us your details using the form below.' },
  { n: '2', title: 'We review', body: 'We check your application — usually within 1–2 business days.' },
  { n: '3', title: 'You’re activated', body: 'Once approved, we email you a secure sign-in link to your partner portal.' },
]

export default function PartnersLandingPage() {
  return (
    <>
      <Section tone="deep" className="pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Partners</Eyebrow>
          <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">Grow your business with living albums</h1>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Photographers, studios, event planners and resellers — turn your customers&apos; photos into living
            AR albums, and add a new, high-margin revenue stream to your business. Apply once, then create
            albums whenever you like.
          </p>
          {/* Two doors, not one. The page previously offered only "Apply now", so an
              existing partner arriving here had no route to their albums and could
              easily re-apply instead. */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#apply"
              className="inline-flex items-center gap-2 rounded-full bg-gold-brand px-7 py-3.5 text-sm font-bold text-green-deep transition hover:bg-cream">
              Apply now →
            </a>
            <a href="/partners"
              className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-7 py-3.5 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand">
              Already a partner? Log in
            </a>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-3xl border border-cream/15 bg-green-mid/40 p-6 text-center">
              <span className="text-3xl" aria-hidden="true">{b.icon}</span>
              <p className="mt-3 font-display text-lg text-cream">{b.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-cream/70">{b.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works once you're a partner */}
      <Section tone="mid">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">From photos to a living album</h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Simple for you, magic for your customers — and a great reason for them to come back.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {howItWorks.map((s) => (
            <div key={s.n} className="rounded-2xl border border-cream/15 bg-green-deep/40 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-brand text-sm font-bold text-green-deep">{s.n}</div>
              <p className="mt-3 font-display text-lg text-cream">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-cream/70">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="deep" id="apply">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Apply</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Apply to become a partner</h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Fill in your details below and we&apos;ll review your application.
          </p>
        </div>

        {/* What happens next */}
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          {applySteps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-cream/15 bg-green-mid/40 p-5 text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-gold-brand text-sm font-bold text-green-deep">{s.n}</div>
              <p className="mt-3 font-display text-lg text-cream">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-cream/70">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <PartnerApplyForm />
        </div>

        {/* Need help during the process */}
        <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-cream/15 bg-green-mid/40 p-6 text-center">
          <p className="font-display text-lg text-cream">Hit a snag? We&apos;re here to help</p>
          <p className="mt-1.5 text-sm leading-relaxed text-cream/70">
            Any issue during the process — reach out on any channel and our team responds almost instantly.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a href={`tel:${REGIONS.au.contact.phoneIntl}`} className="text-cream/80 transition hover:text-gold-brand">
              📞 Australia: {REGIONS.au.contact.phone}
            </a>
            <a href={`https://wa.me/${REGIONS.in.contact.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-cream/80 transition hover:text-gold-brand">
              💬 India: WhatsApp
            </a>
            <a href={`mailto:${brand.email}`} className="break-all text-cream/80 transition hover:text-gold-brand">
              ✉️ {brand.email}
            </a>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a href={brand.instagram} target="_blank" rel="noopener noreferrer" className="text-cream/70 transition hover:text-gold-brand">
              Instagram @{brand.instagramHandle}
            </a>
            <span aria-hidden="true" className="text-cream/25">·</span>
            <a href={brand.facebook} target="_blank" rel="noopener noreferrer" className="text-cream/70 transition hover:text-gold-brand">
              Facebook
            </a>
          </div>
        </div>
      </Section>
    </>
  )
}
