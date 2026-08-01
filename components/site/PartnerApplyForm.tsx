'use client'

import { useState } from 'react'

const field = 'mt-1.5 block w-full rounded-xl border border-cream/20 bg-green-deep/60 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-gold-brand'
const labelCls = 'block text-sm font-medium text-cream/80'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Phone must include a country code, e.g. +61 4XX XXX XXX (E.164-ish after stripping formatting).
const PHONE_RE = /^\+[1-9]\d{6,14}$/

export function PartnerApplyForm() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', city: '', company: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const phone = form.mobile.trim()
    if (!form.name.trim() || !form.email.trim() || !phone) {
      setError('Please add your name, email and phone number.')
      return
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (!PHONE_RE.test(phone.replace(/[\s()\-.]/g, ''))) {
      setError('Please enter your phone number with country code, e.g. +61 4XX XXX XXX.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not submit your application.')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-cream/15 bg-green-mid/40 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-brand/15 text-3xl">✅</div>
        <h2 className="font-display text-2xl text-cream">Partner request sent</h2>
        <p className="mt-3 text-sm leading-relaxed text-cream/70">
          Thanks {form.name.trim().split(' ')[0] || 'there'} — we&apos;ve received your application and the team
          will review it shortly. Once approved, you&apos;ll get an email with a sign-in link to your partner portal.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl rounded-3xl border border-cream/15 bg-green-mid/40 p-6 sm:p-8">
      {error && <div className="mb-5 rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Name <span className="text-gold-brand">*</span></label>
          <input value={form.name} onChange={set('name')} placeholder="Jane Smith" className={field} />
        </div>
        <div>
          <label className={labelCls}>Email <span className="text-gold-brand">*</span></label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="jane@studio.com" className={field} />
        </div>
        <div>
          <label className={labelCls}>Phone <span className="text-gold-brand">*</span> <span className="text-cream/40">(with country code)</span></label>
          <input type="tel" value={form.mobile} onChange={set('mobile')} placeholder="+61 4XX XXX XXX" className={field} />
        </div>
        <div>
          <label className={labelCls}>City</label>
          <input value={form.city} onChange={set('city')} placeholder="Melbourne" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Business / company <span className="text-cream/40">(optional)</span></label>
          <input value={form.company} onChange={set('company')} placeholder="Studio or business name" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Anything else? <span className="text-cream/40">(optional)</span></label>
          <textarea value={form.message} onChange={set('message')} rows={4} placeholder="Tell us about your business and how you'd like to partner." className={field} />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="mt-6 w-full rounded-full bg-gold-brand px-5 py-3.5 text-sm font-bold text-green-deep transition hover:bg-cream disabled:opacity-60">
        {loading ? 'Sending…' : 'Apply now →'}
      </button>
    </form>
  )
}
