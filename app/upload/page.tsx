'use client'

import { useState, useRef, useEffect } from 'react'
import { compileImageTarget } from './compile'

type Step = 'form' | 'compiling' | 'uploading' | 'error'

const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500 MB
const MAX_VIDEO_SECONDS = 60              // 1 minute

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

type Address = { line1: string; line2: string; suburb: string; state: string; postcode: string }
const emptyAddr = (): Address => ({ line1: '', line2: '', suburb: '', state: '', postcode: '' })

export default function UploadPage() {
  const [step, setStep]           = useState<Step>('form')
  const [progress, setProgress]   = useState('')
  const [uploadPct, setUploadPct] = useState(0)
  const [photo, setPhoto]         = useState<File | null>(null)
  const [video, setVideo]         = useState<File | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [error, setError]         = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [consentUpload, setConsentUpload] = useState(false)
  const [consentStore, setConsentStore]   = useState(false)

  // Addresses
  const [delivery, setDelivery]               = useState<Address>(emptyAddr())
  const [postalSameAsDelivery, setPostalSame] = useState(true)
  const [postal, setPostal]                   = useState<Address>(emptyAddr())

  const photoRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  // Show a banner if the user came back after cancelling Stripe checkout
  const cancelled = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('cancelled') === '1'

  // Native event listeners — React onChange can miss the OS file picker event
  // in some Chrome/Windows combinations.
  useEffect(() => {
    const photoEl = photoRef.current
    const videoEl = videoRef.current

    const onPhotoChange = () => setPhoto(photoEl?.files?.[0] ?? null)
    const onVideoChange = async () => {
      const file = videoEl?.files?.[0] ?? null
      if (!file) { setVideo(null); return }

      if (file.size > MAX_VIDEO_BYTES) {
        setFieldErrors(e => ({ ...e, video: 'Video must be under 500 MB.' }))
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
          setFieldErrors(e => ({ ...e, video: 'Video must be 1 minute or shorter.' }))
          setVideo(null)
          if (videoEl) videoEl.value = ''
        } else {
          setFieldErrors(e => { const n = { ...e }; delete n.video; return n })
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

  // ── Helpers ────────────────────────────────────────────────────────
  const updAddr = (
    setter: React.Dispatch<React.SetStateAction<Address>>,
    field: keyof Address,
    errKey: string,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(prev => ({ ...prev, [field]: e.target.value }))
    setFieldErrors(prev => { const n = { ...prev }; delete n[errKey]; return n })
  }

  function validateAddress(addr: Address, prefix: string, errs: Record<string, string>) {
    if (!addr.line1.trim())    errs[`${prefix}Line1`]    = 'Street address is required.'
    if (!addr.suburb.trim())   errs[`${prefix}Suburb`]   = 'Suburb is required.'
    if (!addr.state)           errs[`${prefix}State`]    = 'State is required.'
    if (!addr.postcode.trim()) errs[`${prefix}Postcode`] = 'Postcode is required.'
    else if (!/^\d{4}$/.test(addr.postcode)) errs[`${prefix}Postcode`] = 'Postcode must be 4 digits.'
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = 'First name is required.'
    if (!lastName.trim())  errs.lastName  = 'Last name is required.'
    if (!email.trim()) errs.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address.'
    if (!photo) errs.photo = 'Please upload a frame photo.'
    if (!video) errs.video = fieldErrors.video ?? 'Please upload a video.'
    validateAddress(delivery, 'delivery', errs)
    if (!postalSameAsDelivery) validateAddress(postal, 'postal', errs)
    if (!consentUpload) errs.consentUpload = 'You must consent to uploading your photo and video.'
    if (!consentStore)  errs.consentStore  = 'You must give permission to store your files.'
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setStep('compiling')
    setError('')
    setFieldErrors({})

    try {
      setProgress('Analysing your photo for AR tracking…')
      const targetBuffer = await compileImageTarget(photo!)
      const targetFile   = new File([targetBuffer], 'target.mind', { type: 'application/octet-stream' })

      setStep('uploading')
      setProgress('Uploading your files…')
      setUploadPct(0)

      const photoKey  = await uploadToR2WithProgress(photo!,      'photo',  0,  33)
      const videoKey  = await uploadToR2WithProgress(video!,      'video',  33, 66)
      const targetKey = await uploadToR2WithProgress(targetFile,  'target', 66, 95)

      setUploadPct(98)
      setProgress('Preparing your checkout…')

      const customerName    = `${firstName.trim()} ${lastName.trim()}`.trim()
      const deliveryAddress = { ...delivery, country: 'AU' }
      const postalAddress   = postalSameAsDelivery ? deliveryAddress : { ...postal, country: 'AU' }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoKey, videoKey, targetKey,
          customerEmail: email,
          customerName,
          deliveryAddress,
          postalAddress,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to start checkout.')
      }

      const { url } = await res.json()
      setUploadPct(100)
      window.location.href = url   // hand off to Stripe Checkout
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    }
  }

  async function uploadToR2WithProgress(
    file: File, type: string, startPct: number, endPct: number,
  ): Promise<string> {
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
        if (e.lengthComputable)
          setUploadPct(Math.round(startPct + (e.loaded / e.total) * (endPct - startPct)))
      }
      xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed. Please try again.')))
      xhr.onerror = () => reject(new Error('Upload failed. Please try again.'))
      xhr.send(file)
    })

    return key
  }

  // ── Loading screen ────────────────────────────────────────────────
  if (step === 'compiling' || step === 'uploading') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-lg font-semibold text-zinc-900">
            {step === 'compiling' ? 'Preparing your AR experience' : 'Uploading your files'}
          </p>
          <p className="mt-2 text-sm text-zinc-500">{progress}</p>

          {step === 'uploading' && (
            <div className="mt-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-400">{uploadPct}%</p>
            </div>
          )}

          <p className="mt-4 text-xs text-zinc-400">Please keep this tab open.</p>
        </div>
      </main>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────
  const inputCls = (field: string) =>
    `mt-1.5 w-full rounded-xl border px-3 py-2.5 text-zinc-900 outline-none focus:border-amber-400 bg-zinc-50 text-sm ${
      fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-zinc-200'
    }`

  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="mt-1 text-xs text-red-500">{fieldErrors[field]}</p> : null

  // Reusable address block
  const AddressBlock = ({
    prefix, values, onChange,
  }: {
    prefix: string
    values: Address
    onChange: (field: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  }) => (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-zinc-600">
          Street address <span className="text-red-500">*</span>
          <input value={values.line1} onChange={onChange('line1')} placeholder="123 Smith Street"
            className={inputCls(`${prefix}Line1`)} />
          <FieldError field={`${prefix}Line1`} />
        </label>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-600">
          Apartment / Unit / Suite
          <input value={values.line2} onChange={onChange('line2')} placeholder="Unit 4 (optional)"
            className={inputCls(`${prefix}Line2`)} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-zinc-600">
            Suburb <span className="text-red-500">*</span>
            <input value={values.suburb} onChange={onChange('suburb')} placeholder="Melbourne"
              className={inputCls(`${prefix}Suburb`)} />
            <FieldError field={`${prefix}Suburb`} />
          </label>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">
            State <span className="text-red-500">*</span>
            <select value={values.state} onChange={onChange('state')} className={inputCls(`${prefix}State`)}>
              <option value="">Select</option>
              {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FieldError field={`${prefix}State`} />
          </label>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">
            Postcode <span className="text-red-500">*</span>
            <input value={values.postcode} onChange={onChange('postcode')} placeholder="3000"
              maxLength={4} inputMode="numeric" className={inputCls(`${prefix}Postcode`)} />
            <FieldError field={`${prefix}Postcode`} />
          </label>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-600">
          Country
          <input value="Australia" readOnly
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-400 outline-none" />
        </label>
      </div>
    </div>
  )

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-16 sm:px-6 lg:px-8">
      <a href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
        ← Back
      </a>

      <div className="max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">Order</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">Create your AR experience</h1>
        <p className="mt-3 text-zinc-500">
          Upload your photo and video. We'll craft your personalised AR frame — dispatched in 2–3 business days.
        </p>
      </div>

      {/* Cancelled banner */}
      {cancelled && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your payment was cancelled. Your files have been saved — just click Submit Order again when you&apos;re ready to pay.
        </div>
      )}

      {/* Error banner */}
      {step === 'error' && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* ── Pricing summary ── */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800">
          🖼️ Standard Frame 8×10 — <span className="font-bold">$29.00</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-600">
          📦 + Standard delivery — <span className="font-medium">$9.95</span>
        </div>
      </div>

      <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

        {/* ── Personal details ── */}
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-zinc-700">
            First name <span className="text-red-500">*</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane"
              className={inputCls('firstName')} />
            <FieldError field="firstName" />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Last name <span className="text-red-500">*</span>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith"
              className={inputCls('lastName')} />
            <FieldError field="lastName" />
          </label>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-zinc-700">
            Email address <span className="text-red-500">*</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com" className={inputCls('email')} />
            <FieldError field="email" />
          </label>
        </div>

        <div className="my-6 border-t border-zinc-100" />

        {/* ── Files ── */}
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">Your photo &amp; video</h2>

        {/* Frame photo */}
        <div>
          <p className="text-sm font-medium text-zinc-700">
            Frame photo <span className="text-red-500">*</span>
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">High-contrast images work best for AR tracking. JPEG, PNG, or WebP.</p>
          <label className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 transition hover:bg-zinc-50 ${fieldErrors.photo ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`}>
            <span className="text-2xl">{photo ? '🖼️' : '📷'}</span>
            <span className="text-sm font-medium text-zinc-700">{photo ? photo.name : 'Click to choose a photo'}</span>
            {photo && <span className="text-xs text-zinc-400">{(photo.size / 1024 / 1024).toFixed(1)} MB</span>}
            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" />
          </label>
          <FieldError field="photo" />
        </div>

        {/* Video */}
        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-700">
            Video to play in AR <span className="text-red-500">*</span>
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">MP4 or MOV · max 1 minute · max 500 MB</p>
          <label className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 transition hover:bg-zinc-50 ${fieldErrors.video ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`}>
            <span className="text-2xl">{video ? '🎬' : '🎥'}</span>
            <span className="text-sm font-medium text-zinc-700">{video ? video.name : 'Click to choose a video'}</span>
            {video && <span className="text-xs text-zinc-400">{(video.size / 1024 / 1024).toFixed(1)} MB</span>}
            <input ref={videoRef} type="file" accept="video/mp4,video/quicktime" className="sr-only" />
          </label>
          <FieldError field="video" />
        </div>

        <div className="my-6 border-t border-zinc-100" />

        {/* ── Delivery address ── */}
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-zinc-400">Delivery address</h2>
        <p className="mb-4 text-xs text-zinc-400">Where should we send your frame? No PO Boxes — physical delivery only.</p>
        <AddressBlock
          prefix="delivery"
          values={delivery}
          onChange={(field) => updAddr(setDelivery, field, `delivery${field.charAt(0).toUpperCase() + field.slice(1)}`)}
        />

        <div className="my-6 border-t border-zinc-100" />

        {/* ── Postal address ── */}
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">Postal address</h2>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={postalSameAsDelivery}
            onChange={(e) => setPostalSame(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-amber-500"
          />
          <span className="text-sm text-zinc-700">Same as delivery address</span>
        </label>
        {!postalSameAsDelivery && (
          <div className="mt-4">
            <AddressBlock
              prefix="postal"
              values={postal}
              onChange={(field) => updAddr(setPostal, field, `postal${field.charAt(0).toUpperCase() + field.slice(1)}`)}
            />
          </div>
        )}

        <div className="my-6 border-t border-zinc-100" />

        {/* ── Consent checkboxes ── */}
        <div className="space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Consent required</p>

          <label className={`flex cursor-pointer items-start gap-3 ${fieldErrors.consentUpload ? 'text-red-700' : 'text-zinc-700'}`}>
            <input
              type="checkbox"
              checked={consentUpload}
              onChange={(e) => {
                setConsentUpload(e.target.checked)
                if (e.target.checked) setFieldErrors(prev => { const n = { ...prev }; delete n.consentUpload; return n })
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-amber-500"
            />
            <span className="text-sm leading-6">
              I consent to The Golden Frame collecting and processing my uploaded photo and video for the
              purpose of creating my personalised AR frame.{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer"
                className="font-medium text-amber-600 underline hover:text-amber-700">
                See Terms &amp; Privacy Policy
              </a>
              <span className="ml-1 text-red-500">*</span>
            </span>
          </label>
          {fieldErrors.consentUpload && <p className="ml-7 text-xs text-red-500">{fieldErrors.consentUpload}</p>}

          <label className={`flex cursor-pointer items-start gap-3 ${fieldErrors.consentStore ? 'text-red-700' : 'text-zinc-700'}`}>
            <input
              type="checkbox"
              checked={consentStore}
              onChange={(e) => {
                setConsentStore(e.target.checked)
                if (e.target.checked) setFieldErrors(prev => { const n = { ...prev }; delete n.consentStore; return n })
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-amber-500"
            />
            <span className="text-sm leading-6">
              I give permission for The Golden Frame to store my photo and video on secure servers until
              I request their deletion.{' '}
              <a href="/terms#6" target="_blank" rel="noopener noreferrer"
                className="font-medium text-amber-600 underline hover:text-amber-700">
                Learn more
              </a>
              <span className="ml-1 text-red-500">*</span>
            </span>
          </label>
          {fieldErrors.consentStore && <p className="ml-7 text-xs text-red-500">{fieldErrors.consentStore}</p>}
        </div>

        {/* ── Order summary + submit ── */}
        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">Standard Frame 8×10</span>
            <span className="font-medium text-zinc-900">$29.00</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-zinc-600">Standard delivery</span>
            <span className="font-medium text-zinc-900">$9.95</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-amber-200 pt-2 text-sm font-bold">
            <span className="text-zinc-800">Total</span>
            <span className="text-zinc-900">$38.95</span>
          </div>
          <p className="mt-1.5 text-xs text-amber-700">Payment is processed securely by Stripe. You&apos;ll be redirected to pay after clicking below.</p>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 w-full rounded-full bg-amber-400 px-5 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Submit Order &amp; Pay →
        </button>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-zinc-400">
        <span>🔒 Secure checkout via Stripe</span>
        <span>✉️ Confirmation sent to your email</span>
        <span>📦 Dispatched in 2–3 business days</span>
        <span>🎥 Video: max 1 min · 500 MB</span>
      </div>
    </main>
  )
}
