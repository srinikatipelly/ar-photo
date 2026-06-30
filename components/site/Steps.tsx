import { howItWorks } from '@/lib/site-content'

/** "Scan → Watch → Relive" three-step explainer. */
export function Steps() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {howItWorks.map(({ step, title, body }, i) => (
        <div key={step} className="relative rounded-3xl border border-cream/15 bg-green-mid/40 p-7">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-gold-brand">
            0{i + 1} · {step}
          </span>
          <h3 className="mt-4 font-display text-xl text-cream">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-cream/70">{body}</p>
        </div>
      ))}
    </div>
  )
}
