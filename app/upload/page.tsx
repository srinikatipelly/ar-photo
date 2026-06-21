'use client'

import { useState, useRef, useEffect } from 'react'
import { compileImageTarget } from './compile'

// ── Constants ────────────────────────────────────────────────────────────────
type Step = 'form' | 'compiling' | 'uploading' | 'done' | 'error'

const MAX_VIDEO_BYTES   = 200 * 1024 * 1024
const MAX_VIDEO_SECONDS = 60

const PAYID          = process.env.NEXT_PUBLIC_PAYID          ?? ''
const ACCOUNT_NAME   = process.env.NEXT_PUBLIC_ACCOUNT_NAME   ?? ''
const BSB            = process.env.NEXT_PUBLIC_BSB            ?? ''
const ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_ACCOUNT_NUMBER ?? ''

// Pricing
const FRAME_PRICE    = 29.00
const FRAME_WAS      = 79.00
const DELIVERY_PRICE = 9.95
const TOTAL          = (FRAME_PRICE + DELIVERY_PRICE).toFixed(2)   // 38.95
const TOTAL_WAS      = (FRAME_WAS  + DELIVERY_PRICE).toFixed(2)    // 88.95

// ── Address ───────────────────────────────────────────────────────────────────
const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']
type Address = { line1: string; line2: string; suburb: string; state: string; postcode: string }
const emptyAddr = (): Address => ({ line1: '', line2: '', suburb: '', state: '', postcode: '' })

// AddressBlock is defined OUTSIDE UploadPage intentionally.
// If defined inside, React treats it as a new component type on every render,
// unmounting and remounting the inputs on each keystroke — making them non-editable.
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
    `mt-1.5 block w-full rounded-xl border px-3 py-2.5 text-sm text-zinc-900 bg-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 ${
      errors[key] ? 'border-red-400 bg-red-50' : 'border-zinc-200'
    }`

  return (
    <div className="space-y-4">
      {/* Street address */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Street address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={values.line1}
          onChange={e => onChange('line1', e.target.value)}
          placeholder="123 Smith Street"
          autoComplete="address-line1"
          className={cls(`${prefix}Line1`)}
        />
        {errors[`${prefix}Line1`] && <p className="mt-1 text-xs text-red-500">{errors[`${prefix}Line1`]}</p>}
      </div>

      {/* Apt / Unit */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Apartment / Unit <span className="text-xs font-normal text-zinc-400">(optional)</span>
        </label>
        <input
          type="text"
          value={values.line2}
          onChange={e => onChange('line2', e.target.value)}
          placeholder="Unit 4"
          autoComplete="address-line2"
          className={cls(`${prefix}Line2`)}
        />
      </div>

      {/* Suburb + State + Postcode */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Suburb <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.suburb}
            onChange={e => onChange('suburb', e.target.value)}
            placeholder="Melbourne"
            autoComplete="address-level2"
            className={cls(`${prefix}Suburb`)}
          />
          {errors[`${prefix}Suburb`] && <p className="mt-1 text-xs text-red-500">{errors[`${prefix}Suburb`]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            State <span className="text-red-500">*</span>
          </label>
          <select
            value={values.state}
            onChange={e => onChange('state', e.target.value)}
            autoComplete="address-level1"
            className={cls(`${prefix}State`)}
          >
            <option value="">Select</option>
            {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors[`${prefix}State`] && <p className="mt-1 text-xs text-red-500">{errors[`${prefix}State`]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Postcode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={values.postcode}
            onChange={e => onChange('postcode', e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="3000"
            maxLength={4}
            autoComplete="postal-code"
            className={cls(`${prefix}Postcode`)}
          />
          {errors[`${prefix}Postcode`] && <p className="mt-1 text-xs text-red-500">{errors[`${prefix}Postcode`]}</p>}
        </div>
      </div>

      {/* Country — fixed */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Country</label>
        <input
          type="text"
          value="Australia"
          readOnly
          className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-400 outline-none"
        />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UploadPage() {
  const [step, setStep]           = useState<Step>('form')
  const [progress, setProgress]   = useState('')
  const [uploadPct, setUploadPct] = useState(0)
  const [photo, setPhoto]         = useState<File | null>(null)
  const [video, setVideo]         = useState<File | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [mobile, setMobile]       = useState('')
  const [result, setResult]       = useState<{ frameId: string } | null>(null)
  const [error, setError]         = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [consentUpload, setConsentUpload] = useState(false)
  const [consentStore, setConsentStore]   = useState(false)

  const [delivery, setDelivery]               = useState<Address>(emptyAddr())
  const [postalSameAsDelivery, setPostalSame] = useState(true)
  const [postal, setPostal]                   = useState<Address>(emptyAddr())

  const photoRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const photoEl = photoRef.current
    const videoEl = videoRef.current

    const onPhotoChange = () => setPhoto(photoEl?.files?.[0] ?? null)
    const onVideoChange = async () => {
      const file = videoEl?.files?.[0] ?? null
      if (!file) { setVideo(null); return }

      if (file.size > MAX_VIDEO_BYTES) {
        setFieldErrors(e => ({ ...e, video: 'Video must be under 200 MB.' }))
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

  // ── Address change handlers ───────────────────────────────────────────────
  const onDeliveryChange = (field: keyof Address, value: string) => {
    setDelivery(prev => ({ ...prev, [field]: value }))
    const key = `delivery${field.charAt(0).toUpperCase()}${field.slice(1)}`
    setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const onPostalChange = (field: keyof Address, value: string) => {
    setPostal(prev => ({ ...prev, [field]: value }))
    const key = `postal${field.charAt(0).toUpperCase()}${field.slice(1)}`
    setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  // ── Validation ───────────────────────────────────────────────────────────
  function validateAddress(addr: Address, prefix: string, errs: Record<string, string>) {
    if (!addr.line1.trim())    errs[`${prefix}Line1`]    = 'Street address is required.'
    if (!addr.suburb.trim())   errs[`${prefix}Suburb`]   = 'Suburb is required.'
    if (!addr.state)           errs[`${prefix}State`]    = 'State is required.'
    if (!addr.postcode.trim()) errs[`${prefix}Postcode`] = 'Postcode is required.'
    else if (!/^\d{4}$/.test(addr.postcode)) errs[`${prefix}Postcode`] = 'Must be 4 digits.'
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

  // ── Submit ───────────────────────────────────────────────────────────────
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

      const photoKey  = await uploadToR2WithProgress(photo!,     'photo',  0,  33)
      const videoKey  = await uploadToR2WithProgress(video!,     'video',  33, 66)
      const targetKey = await uploadToR2WithProgress(targetFile, 'target', 66, 95)

      setUploadPct(98)
      setProgress('Creating your order…')

      const customerName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const deliveryAddress = [
        delivery.line1,
        delivery.line2,
        delivery.suburb,
        `${delivery.state} ${delivery.postcode}`,
        'Australia',
      ].filter(Boolean).join(', ')
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoKey, videoKey, targetKey,
          customerEmail: email, customerName,
          mobile: mobile.trim(),
          deliveryAddress,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to create your order right now.')
      }

      setUploadPct(100)
      const data = await res.json()
      setResult(data)
      setStep('done')
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

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    const deliveryLine = [
      delivery.line1, delivery.line2, delivery.suburb, delivery.state, delivery.postcode,
    ].filter(Boolean).join(', ')

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-3xl">
            🎉
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Congratulations!</h1>
          <p className="mt-2 text-zinc-500">
            Your files have been received. Please transfer the payment below to confirm your order and we&apos;ll get started on your frame.
          </p>
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-2xl gap-5">

          {/* Amount to transfer */}
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-base font-semibold text-amber-900">Transfer the exact amount</h2>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">AR Photo Frame 8×10 <span className="text-xs text-amber-600 font-medium">(Promotional price)</span></span>
                <span className="font-medium text-zinc-900">
                  $29.00 <span className="ml-1 text-xs text-zinc-400 line-through">$79.00</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Standard delivery (Australia)</span>
                <span className="font-medium text-zinc-900">$9.95</span>
              </div>
              <div className="flex items-center justify-between border-t border-amber-200 pt-2 text-base font-bold">
                <span className="text-zinc-900">Total to transfer</span>
                <span className="text-zinc-900">
                  ${TOTAL} <span className="ml-1 text-sm font-normal text-zinc-400 line-through">${TOTAL_WAS}</span>
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-amber-700">
              Include your order ID as the reference so we can match your payment quickly.
            </p>
          </section>

          {/* Payment details */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-zinc-900">Payment details</h2>
            <div className="space-y-3">

              {/* Order reference */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Payment reference (required)</p>
                <p className="mt-1 font-mono text-lg font-bold text-zinc-900">{result.frameId}</p>
                <p className="mt-0.5 text-xs text-zinc-400">Include exactly as shown so we can match your payment.</p>
              </div>

              {/* PayID */}
              {PAYID && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">PayID (fastest)</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900">{PAYID}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Banking app → Pay Anyone → PayID → enter number above.</p>
                </div>
              )}

              {/* BSB / Account */}
              {(BSB || ACCOUNT_NUMBER) && (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Bank transfer</p>
                  <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-sm">
                    {ACCOUNT_NAME   && <><span className="text-zinc-500">Account name</span>  <span className="font-medium text-zinc-900">{ACCOUNT_NAME}</span></>}
                    {BSB            && <><span className="text-zinc-500">BSB</span>            <span className="font-medium text-zinc-900">{BSB}</span></>}
                    {ACCOUNT_NUMBER && <><span className="text-zinc-500">Account number</span> <span className="font-medium text-zinc-900">{ACCOUNT_NUMBER}</span></>}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              Questions?{' '}
              <a href="mailto:thegoldenframecreations@gmail.com" className="underline underline-offset-2 hover:text-zinc-600">
                thegoldenframecreations@gmail.com
              </a>
              {' '}· +61 468 320 987
            </p>
          </section>

          {/* Delivery address confirmation */}
          {deliveryLine && (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-4 text-sm">
              <span className="font-medium text-zinc-700">Delivering to: </span>
              <span className="text-zinc-500">{deliveryLine}, Australia</span>
            </div>
          )}

          <div className="flex justify-center">
            <a href="/" className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Back to home
            </a>
          </div>
        </div>
      </main>
    )
  }

  // ── Loading screen ────────────────────────────────────────────────────────
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
                <div className="h-2 rounded-full bg-amber-400 transition-all duration-300" style={{ width: `${uploadPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-zinc-400">{uploadPct}%</p>
            </div>
          )}
          <p className="mt-4 text-xs text-zinc-400">Please keep this tab open.</p>
        </div>
      </main>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  const inputCls = (field: string) =>
    `mt-1.5 block w-full rounded-xl border px-3 py-2.5 text-sm text-zinc-900 bg-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 ${
      fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-zinc-200'
    }`

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

      {/* Pricing banner */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Promotional price</p>
            <p className="mt-0.5 text-sm text-zinc-700">
              AR Photo Frame 8×10 —{' '}
              <span className="text-lg font-bold text-zinc-900">$29.00</span>{' '}
              <span className="text-sm text-zinc-400 line-through">$79.00</span>
            </p>
          </div>
          <div className="h-8 w-px bg-amber-200 hidden sm:block" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Standard delivery</p>
            <p className="mt-0.5 text-sm text-zinc-700">
              <span className="font-bold text-zinc-900">$9.95</span>{' '}
              <span className="text-xs text-zinc-500">· Free on orders over $100</span>
            </p>
          </div>
          <div className="h-8 w-px bg-amber-200 hidden sm:block" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Total</p>
            <p className="mt-0.5 text-sm font-bold text-zinc-900">
              ${TOTAL} <span className="text-sm font-normal text-zinc-400 line-through">${TOTAL_WAS}</span>
            </p>
          </div>
        </div>
      </div>

      {step === 'error' && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

        {/* ── Personal details ── */}
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              First name <span className="text-red-500">*</span>
            </label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)}
              placeholder="Jane" className={inputCls('firstName')} />
            {fieldErrors.firstName && <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Last name <span className="text-red-500">*</span>
            </label>
            <input value={lastName} onChange={e => setLastName(e.target.value)}
              placeholder="Smith" className={inputCls('lastName')} />
            {fieldErrors.lastName && <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>}
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Email address <span className="text-red-500">*</span>
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="jane@example.com" className={inputCls('email')} />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-zinc-700">Mobile number</label>
          <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)}
            placeholder="0412 345 678" className={inputCls('mobile')} />
        </div>

        <div className="my-6 border-t border-zinc-100" />

        {/* ── Files ── */}
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Your photo &amp; video</h2>

        <div>
          <p className="text-sm font-medium text-zinc-700">Frame photo <span className="text-red-500">*</span></p>
          <p className="mt-0.5 text-xs text-zinc-400">JPEG, PNG, or WebP. High-contrast images work best for AR tracking.</p>
          <label className={`mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 transition hover:bg-zinc-50 ${fieldErrors.photo ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`}>
            <span className="text-2xl">{photo ? '🖼️' : '📷'}</span>
            <span className="text-sm font-medium text-zinc-700">{photo ? photo.name : 'Click to choose a photo'}</span>
            {photo && <span className="text-xs text-zinc-400">{(photo.size / 1024 / 1024).toFixed(1)} MB</span>}
            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" />
          </label>
          {fieldErrors.photo && <p className="mt-1 text-xs text-red-500">{fieldErrors.photo}</p>}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-700">Video to play in AR <span className="text-red-500">*</span></p>
          <p className="mt-0.5 text-xs text-zinc-400">MP4 or MOV · max 1 minute · max 200 MB</p>
          <label className={`mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 transition hover:bg-zinc-50 ${fieldErrors.video ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`}>
            <span className="text-2xl">{video ? '🎬' : '🎥'}</span>
            <span className="text-sm font-medium text-zinc-700">{video ? video.name : 'Click to choose a video'}</span>
            {video && <span className="text-xs text-zinc-400">{(video.size / 1024 / 1024).toFixed(1)} MB</span>}
            <input ref={videoRef} type="file" accept="video/mp4,video/quicktime" className="sr-only" />
          </label>
          {fieldErrors.video && <p className="mt-1 text-xs text-red-500">{fieldErrors.video}</p>}
        </div>

        <div className="my-6 border-t border-zinc-100" />

        {/* ── Delivery address ── */}
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">Delivery address</h2>
        <p className="mb-4 text-xs text-zinc-400">Where should we send your frame? Physical address only — no PO Boxes.</p>
        <AddressBlock
          values={delivery}
          prefix="delivery"
          errors={fieldErrors}
          onChange={onDeliveryChange}
        />

        <div className="my-6 border-t border-zinc-100" />

        {/* ── Postal address ── */}
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Postal address</h2>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={postalSameAsDelivery}
            onChange={e => setPostalSame(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-amber-500"
          />
          <span className="text-sm text-zinc-700">Same as delivery address</span>
        </label>
        {!postalSameAsDelivery && (
          <div className="mt-4">
            <AddressBlock
              values={postal}
              prefix="postal"
              errors={fieldErrors}
              onChange={onPostalChange}
            />
          </div>
        )}

        <div className="my-6 border-t border-zinc-100" />

        {/* ── Consent ── */}
        <div className="space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Consent required</p>

          <label className={`flex cursor-pointer items-start gap-3 ${fieldErrors.consentUpload ? 'text-red-700' : 'text-zinc-700'}`}>
            <input type="checkbox" checked={consentUpload}
              onChange={e => {
                setConsentUpload(e.target.checked)
                if (e.target.checked) setFieldErrors(p => { const n = { ...p }; delete n.consentUpload; return n })
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
            <input type="checkbox" checked={consentStore}
              onChange={e => {
                setConsentStore(e.target.checked)
                if (e.target.checked) setFieldErrors(p => { const n = { ...p }; delete n.consentStore; return n })
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

        <button
          onClick={handleSubmit}
          className="mt-6 w-full rounded-full bg-amber-400 px-5 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-amber-300"
        >
          Submit Order →
        </button>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-zinc-400">
        <span>✉️ Confirmation sent to your email</span>
        <span>📦 Dispatched in 2–3 business days</span>
        <span>🎥 Video: max 1 min · 200 MB</span>
      </div>
    </main>
  )
}
