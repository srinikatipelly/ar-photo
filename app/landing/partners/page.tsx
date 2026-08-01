import type { Metadata } from 'next'
import { getBrand } from '@/lib/regions'
import { getRegion } from '@/lib/region-server'
import { Section, Eyebrow } from '@/components/site/Section'
import { WhatsAppButton } from '@/components/site/WhatsAppButton'
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

export default async function PartnersLandingPage() {
  const region = await getRegion()
  const brand = getBrand(region)

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
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <WhatsAppButton message="Hi! I'd like to become a Golden Frame partner." region={region} />
            <a href={`mailto:${brand.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand">
              ✉️ Email us
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

      <Section tone="mid">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Apply</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Send a partner request</h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Fill in your details and we&apos;ll review your application. Approved partners get an email with a
            sign-in link to their portal.
          </p>
        </div>
        <div className="mt-10">
          <PartnerApplyForm />
        </div>
      </Section>
    </>
  )
}
