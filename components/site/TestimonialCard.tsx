import type { Testimonial } from '@/lib/site-content'

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-cream/15 bg-green-mid/40 p-7">
      <span className="font-display text-4xl leading-none text-gold-brand">“</span>
      <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-cream/85">
        {testimonial.quote}
      </blockquote>
      <figcaption className="mt-5 border-t border-cream/10 pt-4">
        <p className="text-sm font-semibold text-cream">{testimonial.author}</p>
        <p className="text-xs text-cream/50">{testimonial.detail}</p>
      </figcaption>
    </figure>
  )
}
