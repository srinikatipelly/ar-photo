import type { Metadata } from 'next'
import { services } from '@/lib/site-content'
import { Section, Eyebrow } from '@/components/site/Section'
import { ServiceCard } from '@/components/site/ServiceCard'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'AR photo frames and AR-enabled print for weddings, birthdays & special events, real estate and business.',
}

export default function ServicesIndex() {
  return (
    <Section tone="deep" className="pt-28">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Our services</Eyebrow>
        <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">
          Memories for every occasion
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-cream/70">
          Whatever the moment, we bring it to life. Explore how augmented reality transforms
          your photos, frames and printed marketing.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <ServiceCard key={service.slug} service={service} />
        ))}
      </div>
    </Section>
  )
}
