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
      {!service.hideHero && (
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

          {/* 16:9 category hero video (only when a real clip is supplied) */}
          {service.heroVideo && (
            <div className="mx-auto mt-12 max-w-4xl">
              <VideoFrame
                src={service.heroVideo}
                poster={service.heroPoster}
                fallbackLabel={`${service.name} demo coming soon`}
              />
            </div>
          )}
        </Section>
      )}

      {/* Features */}
      {!service.hideFeatures && (
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
      )}

      {/* See it in motion - 9:16 vertical demo in a phone-style frame */}
      {service.verticalVideo && (
        <Section tone="deep" className={service.hideHero ? 'pt-28' : ''}>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* Copy */}
            <div className="order-2 text-center lg:order-1 lg:text-left">
              <Eyebrow>See it in motion</Eyebrow>
              <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
                A real memory, brought to life
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-cream/75">
                This is exactly how your frame comes alive when scanned - a still photo that plays
                back your video memory, filmed for mobile just like the keepsake in your hands. Press
                play to watch a sample.
              </p>
              {service.verticalVideoLabel && (
                <p className="mt-4 text-sm font-medium text-gold-brand">{service.verticalVideoLabel}</p>
              )}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <a
                  href={service.ctaHref}
                  className="rounded-full bg-gold-brand px-7 py-3.5 text-sm font-semibold text-green-deep transition hover:bg-cream"
                >
                  {service.cta} →
                </a>
              </div>
            </div>

            {/* Phone-framed vertical video */}
            <div className="order-1 flex justify-center lg:order-2">
              <div className="relative aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-[2.25rem] border-[6px] border-green-mid bg-green-deep shadow-[0_25px_70px_-25px_rgba(0,0,0,0.75)] ring-1 ring-gold-brand/30">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={service.verticalVideo}
                  poster={service.heroPoster}
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Occasions we cover (Special Events) */}
      {service.occasions && service.occasions.length > 0 && (
        <Section tone="mid">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Occasions we cover</Eyebrow>
            <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
              Be it any event, we can create your frame
            </h2>
            {service.occasionsIntro && (
              <p className="mt-4 text-sm leading-relaxed text-cream/70">{service.occasionsIntro}</p>
            )}
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {service.occasions.map((o) => (
              <div
                key={o}
                className="flex items-start gap-3 rounded-2xl border border-cream/15 bg-green-deep/40 px-4 py-3"
              >
                <span className="mt-0.5 text-gold-brand">✦</span>
                <span className="text-sm leading-relaxed text-cream/85">{o}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Contact note (B2B / bespoke categories) */}
      {service.contactNote && (
        <Section tone="mid">
          <div className="mx-auto max-w-3xl rounded-3xl border border-gold-brand/30 bg-green-deep/40 p-8 text-center sm:p-10">
            <Eyebrow>Let&apos;s talk</Eyebrow>
            <p className="mt-4 text-base leading-relaxed text-cream/80">{service.contactNote}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/landing/contact"
                className="rounded-full bg-gold-brand px-7 py-3.5 text-sm font-semibold text-green-deep transition hover:bg-cream"
              >
                Contact us for more information →
              </a>
              <WhatsAppButton message={`Hi! I'd like to talk about ${service.name} with The Golden Frame.`} />
            </div>
          </div>
        </Section>
      )}

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
