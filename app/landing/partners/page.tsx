import type { Metadata } from 'next'
import { Section, Eyebrow } from '@/components/site/Section'
import { PartnerApplyForm } from '@/components/site/PartnerApplyForm'

export const metadata: Metadata = {
  title: 'Partners',
  description:
    'Partner with The Golden Frame — resell our AR photo albums and experiences. Talk to us or apply to become a partner.',
  alternates: { canonical: '/landing/partners' },
}

const benefits = [
  { icon: '🖼️', title: 'AR albums, one QR', body: 'Turn a set of printed photos into one scannable album — each photo plays its own video.' },
  { icon: '⚡', title: 'Bulk import', body: 'Upload pairs yourself, or send us a Google Drive folder / ZIP and we pull them in.' },
  { icon: '🏷️', title: 'Your customers, your brand', body: 'Create and manage albums for your clients from your own partner portal.' },
]

const steps = [
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
          <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">Become a partner</h1>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Photographers, studios, event planners and resellers — bring your customers&apos; memories to life
            with AR. Want to become a partner? Talk to us, or send a request below and we&apos;ll set you up.
          </p>
          <div className="mt-6 flex justify-center">
            <a href="#apply"
              className="inline-flex items-center gap-2 rounded-full bg-gold-brand px-7 py-3.5 text-sm font-bold text-green-deep transition hover:bg-cream">
              Apply now →
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

      <Section tone="mid" id="apply">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Apply</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Apply to become a partner</h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Fill in your details below and we&apos;ll review your application.
          </p>
        </div>

        {/* What happens next */}
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-cream/15 bg-green-deep/40 p-5 text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-gold-brand text-sm font-bold text-green-deep">{s.n}</div>
              <p className="mt-3 font-display text-lg text-cream">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-cream/70">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <PartnerApplyForm />
        </div>
      </Section>
    </>
  )
}
