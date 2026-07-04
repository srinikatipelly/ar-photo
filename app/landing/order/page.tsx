'use client'

import { useState, useRef, useEffect } from 'react'
import { compileImageTarget } from '@/app/upload/compile'
import { createBrowserSupabase } from '@/lib/supabase/client'

type Step = 'form' | 'compiling' | 'uploading' | 'error'

const MAX_VIDEO_BYTES = 200 * 1024 * 1024
const MAX_VIDEO_SECONDS = 60

const FRAME_PRICE = 29.0
const FRAME_WAS = 79.0
const DELIVERY_PRICE = 9.95
const TOTAL = (FRAME_PRICE + DELIVERY_PRICE).toFixed(2)
const TOTAL_WAS = (FRAME_WAS + DELIVERY_PRICE).toFixed(2)
const DIGITAL_PRICE = 19.0

// Friendly labels for the error summary at the top of the form.
const FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email address',
  photo: 'Frame photo',
  video: 'Video',
  consentUpload: 'Consent to process your files',
  consentStore: 'Permission to store your files',
  deliveryLine1: 'Delivery — street address',
  deliverySuburb: 'Delivery — suburb',
  deliveryState: 'Delivery — state',
  deliveryPostcode: 'Delivery — postcode',
  postalLine1: 'Postal — street address',
  postalSuburb: 'Postal — suburb',
  postalState: 'Postal — state',
  postalPostcode: 'Postal — postcode',
}

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']
type Address = { line1: string; line2: string; suburb: string; state: string; postcode: string }
const emptyAddr = (): Address => ({ line1: '', line2: '', suburb: '', state: '', postcode: '' })

const inputBase =
  'mt-1.5 block w-full rounded-xl border bg-green-deep/60 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-gold-brand'

// AddressBlock defined OUTSIDE the page component so inputs aren't remounted each keystroke.
function AddressBlock({
  values,
  prefix,
  errors,
  onChange,
}: {
  values: Address
  prefix: string
  errors: Record<string, string>
  onChange: (field: keyof Address, value: string) => void
}) {
  const cls = (key: string) =>
    `${inputBase} ${errors[key] ? 'border-red-400/70 bg-red-500/10' : 'border-cream/20'}`

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-cream/80">
          Street address <span className="text-gold-brand">*</span>
        </label>
        <input
          type="text"
          value={values.line1}
          onChange={(e) => onChange('line1', e.target.value)}
          placeholder="123 Smith Street"
          autoComplete="address-line1"
          className={cls(`${prefix}Line1`)}
        />
        {errors[`${prefix}Line1`] && <p className="mt-1 text-xs text-red-300">{errors[`${prefix}Line1`]}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-cream/80">
          Apartment / Unit <span className="text-xs font-normal text-cream/40">(optional)</span>
        </label>
        <input
          type="text"
          value={values.line2}
          onChange={(e) => onChange('line2', e.target.value)}
          placeholder="Unit 4"
          autoComplete="address-line2"
          className={cls(`${prefix}Line2`)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-cream/80">
            Suburb <span className="text-gold-brand">*</span>
          </label>
          <input
            type="text"
            value={values.suburb}
            onChange={(e) => onChange('suburb', e.target.value)}
            placeholder="Melbourne"
            autoComplete="address-level2"
            className={cls(`${prefix}Suburb`)}
          />
          {errors[`${prefix}Suburb`] && <p className="mt-1 text-xs text-red-300">{errors[`${prefix}Suburb`]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-cream/80">
            State <span className="text-gold-brand">*</span>
          </label>
          <select
            value={values.state}
            onChange={(e) => onChange('state', e.target.value)}
            autoComplete="address-level1"
            className={cls(`${prefix}State`)}
          >
            <option value="">Select</option>
            {AU_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors[`${prefix}State`] && <p className="mt-1 text-xs text-red-300">{errors[`${prefix}State`]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-cream/80">
            Postcode <span className="text-gold-brand">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={values.postcode}
            onChange={(e) => onChange('postcode', e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="3000"
            maxLength={4}
            autoComplete="postal-code"
            className={cls(`${prefix}Postcode`)}
          />
          {errors[`${prefix}Postcode`] && <p className="mt-1 text-xs text-red-300">{errors[`${prefix}Postcode`]}</p>}
        </div>
      </div>
    </div>
  )
}

export default function OrderPage() {
  const [step, setStep] = useState<Step>('form')
  const [progress, setProgress] = useState('')
  const [uploadPct, setUploadPct] = useState(0)
  const [photo, setPhoto] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [consentUpload, setConsentUpload] = useState(false)
  const [consentStore, setConsentStore] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [isDigital, setIsDigital] = useState(false)

  const [delivery, setDelivery] = useState<Address>(emptyAddr())
  const [postalSameAsDelivery, setPostalSame] = useState(true)
  const [postal, setPostal] = useState<Address>(emptyAddr())

  const photoRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  // Prefill name + email from the signed-in account (Google / Supabase).
  useEffect(() => {
    const supabase = createBrowserSupabase()
    supabase.auth
      .getUser()
      .then(({ data }) => {
        const user = data.user
        if (!user) return
        setSignedIn(true)
        if (user.email) setEmail(user.email)
        const full =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          ''
        if (full) {
          const [first, ...rest] = full.trim().split(/\s+/)
          setFirstName((v) => v || first)
          setLastName((v) => v || rest.join(' '))
        }
      })
      .catch(() => {
        /* not signed in / network issue — leave fields blank */
      })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('cancelled') === '1') setCancelled(true)
    if (params.get('kind') === 'digital') setIsDigital(true)
  }, [])

  useEffect(() => {
    const photoEl = photoRef.current
    const videoEl = videoRef.current

    const onPhotoChange = () => setPhoto(photoEl?.files?.[0] ?? null)
    const onVideoChange = async () => {
      const file = videoEl?.files?.[0] ?? null
      if (!file) { setVideo(null); return }
      if (file.size > MAX_VIDEO_BYTES) {
        setFieldErrors((e) => ({ ...e, video: 'Video must be under 200 MB.' }))
        setVideo(null)
        if (videoEl) videoEl.value = ''
        return
      }
      const url = URL.createObjectURL(file)
      const vid = document.createElement('video')
      vid.preload = 'metadata'
      vid.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        if (vid.duration > MAX_VIDEO_SECONDS) {
          setFieldErrors((e) => ({ ...e, video: 'Video must be 1 minute or shorter.' }))
          setVideo(null)
          if (videoEl) videoEl.value = ''
        } else {
          setFieldErrors((e) => { const n = { ...e }; delete n.video; return n })
          setVideo(file)
        }
      }
      vid.src = url
    }

    photoEl?.addEventListener('change', onPhotoChange)
    videoEl?.addEventListener('change', onVideoChange)
    return () => {
      photoEl?.removeEventListener('change', onPhotoChange)
      videoEl?.removeEventListener('change', onVideoChange)
    }
  }, [])

  const onDeliveryChange = (field: keyof Address, value: string) => {
    setDelivery((prev) => ({ ...prev, [field]: value }))
    const key = `delivery${field.charAt(0).toUpperCase()}${field.slice(1)}`
    setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
  }
  const onPostalChange = (field: keyof Address, value: string) => {
    setPostal((prev) => ({ ...prev, [field]: value }))
    const key = `postal${field.charAt(0).toUpperCase()}${field.slice(1)}`
    setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
  }

  function validateAddress(addr: Address, prefix: string, errs: Record<string, string>) {
    if (!addr.line1.trim()) errs[`${prefix}Line1`] = 'Street address is required.'
    if (!addr.suburb.trim()) errs[`${prefix}Suburb`] = 'Suburb is required.'
    if (!addr.state) errs[`${prefix}State`] = 'State is required.'
    if (!addr.postcode.trim()) errs[`${prefix}Postcode`] = 'Postcode is required.'
    else if (!/^\d{4}$/.test(addr.postcode)) errs[`${prefix}Postcode`] = 'Must be 4 digits.'
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = 'First name is required.'
    if (!lastName.trim()) errs.lastName = 'Last name is required.'
    if (!email.trim()) errs.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address.'
    if (!photo) errs.photo = 'Please upload a frame photo.'
    if (!video) errs.video = fieldErrors.video ?? 'Please upload a video.'
    if (!isDigital) {
      validateAddress(delivery, 'delivery', errs)
      if (!postalSameAsDelivery) validateAddress(postal, 'postal', errs)
    }
    if (!consentUpload) errs.consentUpload = 'You must consent to uploading your photo and video.'
    if (!consentStore) errs.consentStore = 'You must give permission to store your files.'
    return errs
  }

  async function uploadToR2WithProgress(file: File, type: string, startPct: number, endPct: number): Promise<string> {
    const res = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type, type }),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      throw new Error(payload.error || 'Unable to get an upload URL.')
    }
    const { uploadUrl, key } = await res.json()

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadPct(Math.round(startPct + (e.loaded / e.total) * (endPct - startPct)))
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed. Please try again.')))
      xhr.onerror = () => reject(new Error('Upload failed. Please try again.'))
      xhr.send(file)
    })
    return key
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      // Scroll up so the error summary + highlighted fields are visible (they're
      // usually above the submit button the user just clicked at the bottom).
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setStep('compiling')
    // The loading screen replaces the form; jump to top so it isn't rendered
    // off-screen while the page is still scrolled to the submit button.
    window.scrollTo({ top: 0 })
    setError('')
    setFieldErrors({})

    try {
      setProgress('Analysing your photo for AR tracking…')
      const targetBuffer = await compileImageTarget(photo!)
      const targetFile = new File([targetBuffer], 'target.mind', { type: 'application/octet-stream' })

      setStep('uploading')
      setProgress('Uploading your files…')
      setUploadPct(0)

      const photoKey = await uploadToR2WithProgress(photo!, 'photo', 0, 33)
      const videoKey = await uploadToR2WithProgress(video!, 'video', 33, 66)
      const targetKey = await uploadToR2WithProgress(targetFile, 'target', 66, 95)

      setUploadPct(98)
      setProgress('Redirecting to secure checkout…')

      const customerName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const fmtAddress = (a: Address) =>
        [a.line1, a.line2, a.suburb, `${a.state} ${a.postcode}`, 'Australia'].filter(Boolean).join(', ')
      const deliveryAddress = isDigital ? '' : fmtAddress(delivery)
      const postalAddress = isDigital ? '' : postalSameAsDelivery ? deliveryAddress : fmtAddress(postal)

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoKey, videoKey, targetKey,
          customerEmail: email, customerName,
          mobile: mobile.trim(),
          deliveryAddress, postalAddress,
          kind: isDigital ? 'digital' : 'frame',
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to start checkout right now.')
      }
      const { url } = await res.json()
      if (!url) throw new Error('Could not start secure checkout. Please try again.')

      setUploadPct(100)
      window.location.href = url
      return
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
      // Bring the error banner (rendered at the top of the form) into view.
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (step === 'compiling' || step === 'uploading') {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-3xl items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-cream/15 bg-green-mid/40 p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gold-brand border-t-transparent" />
          <p className="font-display text-2xl text-cream">
            {step === 'compiling' ? 'Preparing your AR experience' : 'Uploading your files'}
          </p>
          <p className="mt-2 text-sm text-cream/70">{progress}</p>
          {step === 'uploading' && (
            <div className="mt-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-green-deep/60">
                <div className="h-2 rounded-full bg-gold-brand transition-all duration-300" style={{ width: `${uploadPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-cream/50">{uploadPct}%</p>
            </div>
          )}
          <p className="mt-4 text-xs text-cream/40">Please keep this tab open.</p>
        </div>
      </main>
    )
  }

  const inputCls = (field: string) =>
    `${inputBase} ${fieldErrors[field] ? 'border-red-400/70 bg-red-500/10' : 'border-cream/20'}`

  const errorList = Object.keys(fieldErrors)
    .filter((k) => fieldErrors[k])
    .map((k) => FIELD_LABELS[k] ?? fieldErrors[k])

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-10">
      <span className="eyebrow">{isDigital ? 'Digital AR Only' : 'Order'}</span>
      <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">AR Personalised Frames</h1>
      <p className="mt-3 font-display text-xl text-gold-brand">
        Your photo. Your video. Alive on the wall.
      </p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/70">
        Scan the QR code on your frame and watch your still photo transform into a moving video
        memory — relived, every single time.{' '}
        {isDigital
          ? 'This is a Digital AR Only order — no physical frame is sent. Within 1–2 business days we’ll email your photo with the QR code attached, ready to print and frame yourself.'
          : "We'll craft your personalised AR frame and dispatch it in 2–3 business days."}
      </p>

      {/* How it works — 3 simple steps */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { n: '1', title: 'Choose your moment', body: 'Pick the occasion — baby, couple, family or celebration.' },
          { n: '2', title: 'Send your photo + video', body: 'We embed your video memory behind the QR code.' },
          { n: '3', title: 'Scan & relive it', body: 'Point your phone at the QR — your memory plays instantly.' },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-cream/15 bg-green-mid/30 p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-brand text-sm font-bold text-green-deep">
              {s.n}
            </span>
            <p className="mt-3 text-sm font-semibold text-cream">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-cream/60">{s.body}</p>
          </div>
        ))}
      </div>

      {/* Pricing banner */}
      {isDigital ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-gold-brand/30 bg-green-mid/40 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-brand">Digital AR Only</p>
            <p className="mt-0.5 text-sm text-cream/80">
              <span className="text-lg font-bold text-cream">From ${DIGITAL_PRICE.toFixed(0)}</span>
            </p>
          </div>
          <div className="h-8 w-px bg-cream/15" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-brand">Delivery</p>
            <p className="mt-0.5 text-sm font-bold text-cream">QR by email — no physical frame</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-gold-brand/30 bg-green-mid/40 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-brand">AR Photo Frame 8×10</p>
            <p className="mt-0.5 text-sm text-cream/80">
              <span className="text-lg font-bold text-cream">${FRAME_PRICE.toFixed(0)}</span>{' '}
              <span className="text-sm text-cream/40 line-through">${FRAME_WAS.toFixed(0)}</span>
            </p>
          </div>
          <div className="h-8 w-px bg-cream/15" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-brand">Delivery</p>
            <p className="mt-0.5 text-sm font-bold text-cream">${DELIVERY_PRICE.toFixed(2)}</p>
          </div>
          <div className="h-8 w-px bg-cream/15" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-brand">Total</p>
            <p className="mt-0.5 text-sm font-bold text-cream">
              ${TOTAL} <span className="text-sm font-normal text-cream/40 line-through">${TOTAL_WAS}</span>
            </p>
          </div>
        </div>
      )}

      {cancelled && (
        <div className="mt-6 rounded-2xl border border-gold-brand/30 bg-gold-brand/10 p-4 text-sm text-cream/80">
          Your payment was cancelled and you have not been charged. Your details are below — complete
          checkout whenever you&apos;re ready.
        </div>
      )}

      {step === 'error' && error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-red-500 bg-red-500/20 p-4 text-sm font-semibold text-red-100"
        >
          <span aria-hidden="true" className="text-lg leading-none">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {step === 'form' && errorList.length > 0 && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border-2 border-red-500 bg-red-500/20 p-4 text-red-50"
        >
          <p className="flex items-center gap-2 text-sm font-bold">
            <span aria-hidden="true" className="text-lg leading-none">⚠️</span>
            Please fix {errorList.length} {errorList.length === 1 ? 'field' : 'fields'} before continuing:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-9 text-sm font-medium text-red-100">
            {errorList.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="mt-6 rounded-3xl border border-cream/15 bg-green-mid/30 p-6 sm:p-8">
        {/* Your details */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold-brand">Your details</h2>
          {!signedIn && (
            <a href="/account" className="text-xs font-medium text-cream/60 underline hover:text-gold-brand">
              Sign in to autofill
            </a>
          )}
        </div>
        {signedIn && (
          <p className="mt-2 text-xs text-cream/60">✓ Signed in — we&apos;ve filled in your details.</p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-cream/80">
              First name <span className="text-gold-brand">*</span>
            </label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" className={inputCls('firstName')} />
            {fieldErrors.firstName && <p className="mt-1 text-xs text-red-300">{fieldErrors.firstName}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-cream/80">
              Last name <span className="text-gold-brand">*</span>
            </label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" className={inputCls('lastName')} />
            {fieldErrors.lastName && <p className="mt-1 text-xs text-red-300">{fieldErrors.lastName}</p>}
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-cream/80">
            Email address <span className="text-gold-brand">*</span>
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" className={inputCls('email')} />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-300">{fieldErrors.email}</p>}
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-cream/80">Mobile number</label>
          <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="0412 345 678" className={inputCls('mobile')} />
        </div>

        <div className="my-6 border-t border-cream/10" />

        {/* Files */}
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold-brand">Your photo &amp; video</h2>
        <div>
          <p className="text-sm font-medium text-cream/80">Frame photo <span className="text-gold-brand">*</span></p>
          <p className="mt-0.5 text-xs text-cream/40">JPEG, PNG, or WebP. High-contrast images work best for AR tracking.</p>
          <label className={`mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 transition hover:bg-green-deep/40 ${fieldErrors.photo ? 'border-red-400/60 bg-red-500/10' : 'border-cream/20'}`}>
            <span className="text-2xl" aria-hidden="true">{photo ? '🖼️' : '📷'}</span>
            <span className="text-sm font-medium text-cream/80">{photo ? photo.name : 'Click to choose a photo'}</span>
            {photo && <span className="text-xs text-cream/40">{(photo.size / 1024 / 1024).toFixed(1)} MB</span>}
            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" />
          </label>
          {fieldErrors.photo && <p className="mt-1 text-xs text-red-300">{fieldErrors.photo}</p>}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-cream/80">Video to play in AR <span className="text-gold-brand">*</span></p>
          <p className="mt-0.5 text-xs text-cream/40">MP4 or MOV · max 1 minute · max 200 MB</p>
          <label className={`mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 transition hover:bg-green-deep/40 ${fieldErrors.video ? 'border-red-400/60 bg-red-500/10' : 'border-cream/20'}`}>
            <span className="text-2xl" aria-hidden="true">{video ? '🎬' : '🎥'}</span>
            <span className="text-sm font-medium text-cream/80">{video ? video.name : 'Click to choose a video'}</span>
            {video && <span className="text-xs text-cream/40">{(video.size / 1024 / 1024).toFixed(1)} MB</span>}
            <input ref={videoRef} type="file" accept="video/mp4,video/quicktime" className="sr-only" />
          </label>
          {fieldErrors.video && <p className="mt-1 text-xs text-red-300">{fieldErrors.video}</p>}
        </div>

        {isDigital ? (
          <>
            <div className="my-6 border-t border-cream/10" />
            <div className="rounded-2xl border border-gold-brand/25 bg-green-deep/40 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-brand">Digital delivery</p>
              <p className="mt-2 text-sm leading-relaxed text-cream/75">
                No physical frame will be sent. Within 1&ndash;2 business days we&apos;ll email your photo
                with the QR code attached, ready for you to print and frame yourself — so we don&apos;t
                need a delivery address.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="my-6 border-t border-cream/10" />

            {/* Delivery address */}
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-gold-brand">Delivery address</h2>
            <p className="mb-4 text-xs text-cream/40">Where should we send your frame? Physical address only — no PO Boxes.</p>
            <AddressBlock values={delivery} prefix="delivery" errors={fieldErrors} onChange={onDeliveryChange} />

            <div className="my-6 border-t border-cream/10" />

            {/* Postal address */}
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-brand">Postal address</h2>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={postalSameAsDelivery}
                onChange={(e) => setPostalSame(e.target.checked)}
                className="h-4 w-4 rounded border-cream/30 accent-gold-brand"
              />
              <span className="text-sm text-cream/80">Same as delivery address</span>
            </label>
            {!postalSameAsDelivery && (
              <div className="mt-4">
                <AddressBlock values={postal} prefix="postal" errors={fieldErrors} onChange={onPostalChange} />
              </div>
            )}
          </>
        )}

        <div className="my-6 border-t border-cream/10" />

        {/* Consent */}
        <div className="space-y-4 rounded-2xl border border-cream/10 bg-green-deep/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-brand">Consent required</p>

          <label className="flex cursor-pointer items-start gap-3 text-cream/80">
            <input
              type="checkbox"
              checked={consentUpload}
              onChange={(e) => {
                setConsentUpload(e.target.checked)
                if (e.target.checked) setFieldErrors((p) => { const n = { ...p }; delete n.consentUpload; return n })
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-cream/30 accent-gold-brand"
            />
            <span className="text-sm leading-6">
              I consent to The Golden Frame collecting and processing my uploaded photo and video to
              create my personalised AR frame.{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-gold-brand underline">See Terms &amp; Privacy</a>
              <span className="ml-1 text-gold-brand">*</span>
            </span>
          </label>
          {fieldErrors.consentUpload && <p className="ml-7 text-xs text-red-300">{fieldErrors.consentUpload}</p>}

          <label className="flex cursor-pointer items-start gap-3 text-cream/80">
            <input
              type="checkbox"
              checked={consentStore}
              onChange={(e) => {
                setConsentStore(e.target.checked)
                if (e.target.checked) setFieldErrors((p) => { const n = { ...p }; delete n.consentStore; return n })
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-cream/30 accent-gold-brand"
            />
            <span className="text-sm leading-6">
              I give permission for The Golden Frame to store my photo and video on secure servers until
              I request their deletion.{' '}
              <a href="/terms#6" target="_blank" rel="noopener noreferrer" className="font-medium text-gold-brand underline">Learn more</a>
              <span className="ml-1 text-gold-brand">*</span>
            </span>
          </label>
          {fieldErrors.consentStore && <p className="ml-7 text-xs text-red-300">{fieldErrors.consentStore}</p>}
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 w-full rounded-full bg-gold-brand px-5 py-3.5 text-sm font-bold text-green-deep transition hover:bg-cream"
        >
          Continue to secure payment →
        </button>
        <p className="mt-3 text-center text-xs text-cream/40">🔒 Payment is processed securely by Stripe.</p>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-cream/40">
        <span>✉️ Confirmation sent to your email</span>
        <span>{isDigital ? '📱 Photo + QR emailed in 1–2 business days' : '📦 Dispatched in 2–3 business days'}</span>
        <span>🎥 Video: max 1 min · 200 MB</span>
      </div>
    </main>
  )
}
