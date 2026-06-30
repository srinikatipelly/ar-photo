import type { ReactNode } from 'react'

type SectionProps = {
  id?: string
  /** Visual tone of the section background */
  tone?: 'deep' | 'mid' | 'cream'
  className?: string
  children: ReactNode
}

const toneClasses: Record<NonNullable<SectionProps['tone']>, string> = {
  deep: 'bg-green-deep text-cream',
  mid: 'bg-green-mid text-cream',
  cream: 'bg-cream text-green-deep',
}

/** Full-width section with a centred max-width container. */
export function Section({ id, tone = 'deep', className = '', children }: SectionProps) {
  return (
    <section id={id} className={`${toneClasses[tone]} px-6 py-20 sm:px-10 sm:py-24 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

/** Small uppercase eyebrow label above a heading (styling in globals .eyebrow). */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>
}
