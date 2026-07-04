import type { Service } from '@/lib/site-content'

const icons: Record<string, string> = {
  weddings: '💍',
  'special-events': '🎉',
  'real-estate-corporates': '🏡',
  custom: '✨',
}

export function ServiceCard({ service }: { service: Service }) {
  return (
    <a
      href={`/landing/services/${service.slug}`}
      className="group flex flex-col rounded-3xl border border-cream/15 bg-green-mid/40 p-7 transition hover:border-gold-brand/60 hover:bg-green-mid/70"
    >
      <span className="text-3xl" aria-hidden="true">{icons[service.slug] ?? '✦'}</span>
      <h3 className="mt-4 font-display text-xl text-cream">{service.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-cream/70">{service.summary}</p>
      <span className="mt-5 text-sm font-semibold text-gold-brand transition group-hover:translate-x-0.5">
        Learn more →
      </span>
    </a>
  )
}
