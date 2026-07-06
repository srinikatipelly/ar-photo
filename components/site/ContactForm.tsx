'use client'

import { useRef, useState } from 'react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FIELD_LABELS: Record<string, string> = {
  name: 'Your name',
  email: 'Email address',
  message: 'Message',
}

const inputBase =
  'mt-1.5 block w-full rounded-xl border bg-green-deep/60 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-gold-brand'

type Values = { name: string; email: string; phone: string; message: string }

export function ContactForm() {
  const [values, setValues] = useState<Values>({ name: '', email: '', phone: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const set = (field: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    if (fieldErrors[field]) setFieldErrors((e) => ({ ...e, [field]: '' }))
  }

  const cls = (key: string) =>
    `${inputBase} ${fieldErrors[key] ? 'border-red-400/70 bg-red-500/10' : 'border-cream/20'}`

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!values.name.trim()) errs.name = 'required'
    if (!values.email.trim()) errs.email = 'required'
    else if (!EMAIL_RE.test(values.email.trim())) errs.email = 'invalid'
    if (!values.message.trim()) errs.message = 'required'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const errs = validate()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Unable to send your message right now.')
      setSent(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to send your message right now.')
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-gold-brand/30 bg-green-mid/40 p-8 text-center sm:p-10">
        <span className="text-3xl" aria-hidden="true">✨</span>
        <h2 className="mt-4 font-display text-2xl text-cream sm:text-3xl">Thank you - your message is on its way</h2>
        <p className="mt-3 text-sm leading-relaxed text-cream/70">
          We&apos;ve received your enquiry and will get back to you within one business day.
        </p>
      </div>
    )
  }

  const errorList = Object.keys(fieldErrors)
    .filter((k) => fieldErrors[k])
    .map((k) => FIELD_LABELS[k] ?? k)

  return (
    <div ref={panelRef} className="mx-auto max-w-2xl rounded-3xl border border-gold-brand/30 bg-green-mid/40 p-8 text-left sm:p-10">
      <div className="text-center">
        <h2 className="font-display text-2xl text-cream sm:text-3xl">Send us a message</h2>
        <p className="mt-3 text-sm leading-relaxed text-cream/70">
          Tell us a little about your occasion or business and we&apos;ll come back with ideas,
          pricing and next steps.
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-red-500 bg-red-500/20 p-4 text-sm font-semibold text-red-100"
        >
          <span aria-hidden="true" className="text-lg leading-none">⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      {errorList.length > 0 && (
        <div role="alert" className="mt-6 rounded-2xl border-2 border-red-500 bg-red-500/20 p-4 text-red-50">
          <p className="flex items-center gap-2 text-sm font-bold">
            <span aria-hidden="true" className="text-lg leading-none">⚠️</span>
            Please check {errorList.length} {errorList.length === 1 ? 'field' : 'fields'} before sending:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-9 text-sm font-medium text-red-100">
            {errorList.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-cream/80">Your name <span className="text-gold-brand">*</span></span>
            <input
              type="text"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              className={cls('name')}
              placeholder="Jane Smith"
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-cream/80">Email address <span className="text-gold-brand">*</span></span>
            <input
              type="email"
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              className={cls('email')}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-cream/80">Phone <span className="text-cream/40">(optional)</span></span>
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={cls('phone')}
            placeholder="0400 000 000"
            autoComplete="tel"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-cream/80">Message <span className="text-gold-brand">*</span></span>
          <textarea
            value={values.message}
            onChange={(e) => set('message', e.target.value)}
            className={`${cls('message')} min-h-[120px] resize-y`}
            placeholder="Tell us about your occasion, event or business idea…"
          />
        </label>

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-full bg-gold-brand px-7 py-3.5 text-sm font-semibold text-green-deep transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  )
}
