'use client'

import { useState, useRef, useEffect } from 'react'
import { compileImageTarget } from './compile'

type Step = 'form' | 'compiling' | 'uploading' | 'done' | 'error'

const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500 MB
const MAX_VIDEO_SECONDS = 60              // 1 minute

export default function UploadPage() {
  const [step, setStep] = useState<Step>('form')
  const [progress, setProgress] = useState('')
  const [uploadPct, setUploadPct] = useState(0)
  const [photo, setPhoto] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<{ frameId: string } | null>(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const photoRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

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

      // Check duration via a temporary object URL
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

  function validate() {
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = 'First name is required.'
    if (!lastName.trim()) errs.lastName = 'Last name is required.'
    if (!email.trim()) errs.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address.'
    if (!photo) errs.photo = 'Please upload a frame photo.'
    if (!video) errs.video = fieldErrors.video ?? 'Please upload a video.'
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
      const targetFile = new File([targetBuffer], 'target.mind', { type: 'application/octet-stream' })

      setStep('uploading')
      setProgress('Uploading your files…')
      setUploadPct(0)

      // Upload sequentially so we can show a combined percentage
      const photoKey = await uploadToR2WithProgress(photo!, 'photo', 0, 33)
      const videoKey = await uploadToR2WithProgress(video!, 'video', 33, 66)
      const targetKey = await uploadToR2WithProgress(targetFile, 'target', 66, 95)

      setUploadPct(98)
      setProgress('Creating your order…')
      const customerName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoKey, videoKey, targetKey, customerEmail: email, customerName }),
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
    file: File,
    type: string,
    startPct: number,
    endPct: number,
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
        if (e.lengthComputable) {
          const filePct = e.loaded / e.total
          setUploadPct(Math.round(startPct + filePct * (endPct - startPct)))
        }
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed. Please try again.')))
      xhr.onerror = () => reject(new Error('Upload failed. Please try again.'))
      xhr.send(file)
    })

    return key
  }

  // ── Success screen ──────────────────────────────────────────────
  if (step === 'done' && result) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl">
            ✅
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Upload received!</h1>
          <p className="mt-2 text-zinc-500">
            Your files are uploaded. Complete your payment below to lock in your order.
          </p>
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-2xl gap-6">
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-base font-semibold text-amber-900">Complete your payment</h2>
            <p className="mt-1 text-sm text-amber-700">
              Reference your order ID so we can match your payment.
            </p>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Order ID</p>
              <p className="mt-1 font-mono text-lg font-semibold text-zinc-900">{result.frameId}</p>
            </div>
            <p className="mt-4 text-xs text-amber-700">
              Once payment is confirmed, we'll dispatch your frame within 2–3 business days.
            </p>
          </section>

          <div className="flex justify-center">
            <a href="/" className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Back to home
            </a>
          </div>
        </div>
      </main>
    )
  }

  // ── Loading / uploading screen ────────────────────────────────────
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
              <p className="mt-2 text-xs text-zinc-400">{uploadPct}% uploaded</p>
            </div>
          )}

          <p className="mt-4 text-xs text-zinc-400">This may take a moment — please keep this tab open.</p>
        </div>
      </main>
    )
  }

  // ── Form ────────────────────────────────────────────────────────
  const inputCls = (field: string) =>
    `mt-1.5 w-full rounded-xl border px-3 py-3 text-zinc-900 outline-none focus:border-amber-400 bg-zinc-50 ${
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

      {step === 'error' && error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Name row */}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-zinc-700">
            First name <span className="text-red-500">*</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className={inputCls('firstName')}
            />
            {fieldErrors.firstName && <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>}
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Last name <span className="text-red-500">*</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
              className={inputCls('lastName')}
            />
            {fieldErrors.lastName && <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>}
          </label>
        </div>

        {/* Email */}
        <div className="mt-5">
          <label className="text-sm font-medium text-zinc-700">
            Email address <span className="text-red-500">*</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className={inputCls('email')}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
          </label>
        </div>

        {/* Frame photo */}
        <div className="mt-5">
          <p className="text-sm font-medium text-zinc-700">
            Frame photo <span className="text-red-500">*</span>
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">High-contrast images work best for AR tracking. JPEG, PNG, or WebP.</p>
          <label
            className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 transition hover:bg-zinc-50 ${
              fieldErrors.photo ? 'border-red-300 bg-red-50' : 'border-zinc-200'
            }`}
          >
            <span className="text-2xl">{photo ? '🖼️' : '📷'}</span>
            <span className="text-sm font-medium text-zinc-700">
              {photo ? photo.name : 'Click to choose a photo'}
            </span>
            {photo && (
              <span className="text-xs text-zinc-400">{(photo.size / 1024 / 1024).toFixed(1)} MB</span>
            )}
            <input
              ref={photoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
            />
          </label>
          {fieldErrors.photo && <p className="mt-1 text-xs text-red-500">{fieldErrors.photo}</p>}
        </div>

        {/* Video */}
        <div className="mt-5">
          <p className="text-sm font-medium text-zinc-700">
            Video to play in AR <span className="text-red-500">*</span>
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">MP4 or MOV · max 1 minute · max 500 MB</p>
          <label
            className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 transition hover:bg-zinc-50 ${
              fieldErrors.video ? 'border-red-300 bg-red-50' : 'border-zinc-200'
            }`}
          >
            <span className="text-2xl">{video ? '🎬' : '🎥'}</span>
            <span className="text-sm font-medium text-zinc-700">
              {video ? video.name : 'Click to choose a video'}
            </span>
            {video && (
              <span className="text-xs text-zinc-400">{(video.size / 1024 / 1024).toFixed(1)} MB</span>
            )}
            <input
              ref={videoRef}
              type="file"
              accept="video/mp4,video/quicktime"
              className="sr-only"
            />
          </label>
          {fieldErrors.video && <p className="mt-1 text-xs text-red-500">{fieldErrors.video}</p>}
        </div>

        <button
          onClick={handleSubmit}
          className="mt-8 w-full rounded-full bg-zinc-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Submit Order →
        </button>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-zinc-400">
        <span>✉️ Order confirmation sent to your email</span>
        <span>📦 Dispatched in 2–3 business days</span>
        <span>🎥 Video: max 1 min · 500 MB</span>
      </div>
    </main>
  )
}
