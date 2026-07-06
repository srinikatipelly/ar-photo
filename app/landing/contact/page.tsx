import type { Metadata } from 'next'
import { brand } from '@/lib/site-content'
import { Section, Eyebrow } from '@/components/site/Section'
import { ContactForm } from '@/components/site/ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with The Golden Frame - talk to us about AR photo frames, real estate & corporate marketing, or a custom idea.',
  alternates: { canonical: '/landing/contact' },
}

const channels = [
  {
    icon: '📞',
    label: 'Call us',
    value: brand.phone,
    href: `tel:${brand.phoneIntl}`,
    note: 'Mon-Fri, business hours (AEST)',
  },
  {
    icon: '✉️',
    label: 'Email us',
    value: brand.email,
    href: `mailto:${brand.email}`,
    note: 'We usually reply within one business day',
  },
  {
    icon: '💬',
    label: 'WhatsApp',
    value: 'Chat with us instantly',
    href: brand.whatsapp,
    note: 'The quickest way to reach us',
  },
]

export default function ContactPage() {
  return (
    <Section tone="deep" className="pt-28">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Contact us</Eyebrow>
        <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">Let&apos;s talk</h1>
        <p className="mt-4 text-sm leading-relaxed text-cream/70">
          Whether it&apos;s a wedding or event frame, real estate and corporate marketing, or a
          custom idea you have in mind - we&apos;d love to hear from you. Reach out any way that
          suits you and we&apos;ll help bring your moment to life.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target={c.href.startsWith('http') ? '_blank' : undefined}
            rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="group flex flex-col items-center rounded-3xl border border-cream/15 bg-green-mid/40 p-7 text-center transition hover:border-gold-brand/60 hover:bg-green-mid/70"
          >
            <span className="text-3xl" aria-hidden="true">{c.icon}</span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-gold-brand">{c.label}</p>
            <p className="mt-2 break-all font-display text-lg text-cream">{c.value}</p>
            <p className="mt-2 text-xs leading-relaxed text-cream/60">{c.note}</p>
          </a>
        ))}
      </div>

      <div className="mt-12">
        <ContactForm />
      </div>

      <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-sm text-cream/60">
        <a href={brand.instagram} target="_blank" rel="noopener noreferrer" className="transition hover:text-gold-brand">
          Instagram @{brand.instagramHandle}
        </a>
        <span aria-hidden="true" className="text-cream/25">·</span>
        <a href={brand.facebook} target="_blank" rel="noopener noreferrer" className="transition hover:text-gold-brand">
          Facebook
        </a>
      </div>
    </Section>
  )
}
