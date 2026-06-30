import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { brand, services, getService } from '@/lib/site-content'
import { Section, Eyebrow } from '@/components/site/Section'
import { Steps } from '@/components/site/Steps'
import { VideoFrame } from '@/components/site/VideoFrame'
import { WhatsAppButton } from '@/components/site/WhatsAppButton'

// Pre-render all four service pages at build time; 404 on unknown slugs.
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return { title: 'Services' }
  return {
    title: service.name,
    description: service.summary,
    alternates: { canonical: `/landing/services/${service.slug}` },
  }
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()

  return (
    <>
      {/* Hero */}
      <Section tone="deep" className="pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>{service.name}</Eyebrow>
          <h1 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-6xl">
            {service.headline}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-cream/75">{service.lead}</p>
          {service.showTagline && (
            <p className="tagline mt-4 text-2xl text-gold-brand">{brand.tagline}</p>
          )}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href={service.ctaHref}
              className="rounded-full bg-gold-brand px-7 py-3.5 text-sm font-semibold text-green-deep transition hover:bg-cream"
            >
              {service.cta} →
            </a>
            <WhatsAppButton message={`Hi! I'm interested in ${service.name} with The Golden Frame.`} />
          </div>
        </div>

        {/* 16:9 category hero video */}
        <div className="mx-auto mt-12 max-w-4xl">
          <VideoFrame src={service.heroVideo} fallbackLabel={`${service.name} demo coming soon`} />
        </div>
      </Section>

      {/* Features */}
      <Section tone="mid">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow>Why you&apos;ll love it</Eyebrow>
            <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
              What&apos;s included
            </h2>
          </div>
          <ul className="space-y-4">
            {service.features.map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-2xl border border-cream/15 bg-green-deep/40 p-4">
                <span className="mt-0.5 text-gold-brand">✓</span>
                <span className="text-sm leading-relaxed text-cream/85">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* How it works */}
      <Section tone="deep">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Scan. Watch. Relive.</h2>
        </div>
        <div className="mt-12">
          <Steps />
        </div>
      </Section>

      {/* CTA */}
      <Section tone="cream">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl text-green-deep sm:text-4xl">{service.cta}</h2>
          <p className="mt-4 text-sm leading-relaxed text-green-deep/70">
            Get started today, or message us with any questions.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={service.ctaHref}
              className="rounded-full bg-green-deep px-7 py-3.5 text-sm font-semibold text-cream transition hover:bg-green-mid"
            >
              {service.cta} →
            </a>
            <WhatsAppButton message={`Hi! I'm interested in ${service.name} with The Golden Frame.`} />
          </div>
        </div>
      </Section>
    </>
  )
}
