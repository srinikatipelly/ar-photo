import type { PricingTier } from '@/lib/site-content'

export function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <div
      className={`flex flex-col rounded-3xl border p-8 ${
        tier.featured
          ? 'border-gold-brand bg-green-mid/70 shadow-[0_0_0_1px_rgba(201,162,75,0.4)]'
          : 'border-cream/15 bg-green-mid/30'
      }`}
    >
      {tier.featured && (
        <span className="mb-4 inline-flex w-fit rounded-full bg-gold-brand px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-deep">
          Most popular
        </span>
      )}
      <h3 className="font-display text-xl text-cream">{tier.name}</h3>
      <div className="mt-3 flex items-end gap-2">
        <span className="font-display text-4xl text-gold-brand">{tier.price}</span>
        {tier.was && <span className="pb-1 text-sm text-cream/40 line-through">{tier.was}</span>}
      </div>
      <p className="mt-1 text-xs uppercase tracking-wide text-cream/50">{tier.unit}</p>
      <p className="mt-4 text-sm leading-relaxed text-cream/70">{tier.description}</p>

      <ul className="mt-6 flex-1 space-y-2.5 text-sm text-cream/80">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="mt-0.5 text-gold-brand">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <a
        href={tier.href}
        className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-semibold transition ${
          tier.featured
            ? 'bg-gold-brand text-green-deep hover:bg-cream'
            : 'border border-cream/30 text-cream hover:border-gold-brand hover:text-gold-brand'
        }`}
      >
        {tier.cta}
      </a>
    </div>
  )
}
