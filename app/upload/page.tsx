'use client'

import { useState, useRef, useEffect } from 'react'
import { compileImageTarget } from './compile'
import { createClient } from '@/lib/supabase-browser'

type Step = 'form' | 'compiling' | 'uploading' | 'done' | 'error'

const PAYID = process.env.NEXT_PUBLIC_PAYID ?? ''
const BSB = process.env.NEXT_PUBLIC_BSB ?? ''
const ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_ACCOUNT_NUMBER ?? ''
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_ACCOUNT_NAME ?? ''

export default function UploadPage() {
  const [step, setStep] = useState<Step>('form')
  const [progress, setProgress] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [result, setResult] = useState<{ frameId: string } | null>(null)
  const [error, setError] = useState('')

  const photoRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  // Use native event listeners — React onChange can miss the OS file picker event
  // in some Chrome/Windows combinations.
  useEffect(() => {
    const photoEl = photoRef.current
    const videoEl = videoRef.current
    const onPhotoChange = () => setPhoto(photoEl?.files?.[0] ?? null)
    const onVideoChange = () => setVideo(videoEl?.files?.[0] ?? null)
    photoEl?.addEventListener('change', onPhotoChange)
    videoEl?.addEventListener('change', onVideoChange)
    return () => {
      photoEl?.removeEventListener('change', onPhotoChange)
      videoEl?.removeEventListener('change', onVideoChange)
    }
  }, [])

  async function handleSubmit() {
    if (!photo || !video || !email) return

    setStep('compiling')
    setError('')

    try {
      setProgress('Analysing your photo for AR tracking…')
      const targetBuffer = await compileImageTarget(photo)
      const targetFile = new File([targetBuffer], 'target.mind', { type: 'application/octet-stream' })

      setStep('uploading')
      setProgress('Uploading files to storage…')

      const [photoKey, videoKey, targetKey] = await Promise.all([
        uploadToR2(photo, 'photo'),
        uploadToR2(video, 'video'),
        uploadToR2(targetFile, 'target'),
      ])

      // Attach userId if a B2B user is logged in
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      setProgress('Creating your order…')
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoKey, videoKey, targetKey,
          customerEmail: email, customerName: name,
          userId: user?.id ?? null,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to create your order right now.')
      }

      const data = await res.json()
      setResult(data)
      setStep('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    }
  }

  async function uploadToR2(file: File, type: string): Promise<string> {
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

    // Upload directly from browser to R2 — bypasses Vercel's 4.5MB body limit
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    })

    if (!uploadRes.ok) {
      throw new Error('Upload failed. Please try again.')
    }

    return key
  }

  // ── Success screen ──────────────────────────────────────────────
  if (step === 'done' && result) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">
            ✅
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Order received!</h1>
          <p className="mt-2 text-zinc-500">
            Your AR frame has been set up. To complete your order, please transfer payment using the details below.
          </p>
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-2xl gap-6">
          {/* Payment details */}
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-base font-semibold text-amber-900">Complete your payment</h2>
            <p className="mt-1 text-sm text-amber-700">
              Please transfer the full amount using one of the options below. Reference your order ID so we can match your payment.
            </p>

            <div className="mt-4 space-y-4">
              {/* PayID */}
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">PayID (fastest)</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {PAYID || <span className="text-zinc-400 italic">PayID not yet configured</span>}
                </p>
              </div>

              {/* BSB / Account */}
              {(BSB || ACCOUNT_NUMBER) && (
                <div className="rounded-2xl border border-amber-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Bank transfer</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {ACCOUNT_NAME && (
                      <>
                        <span className="text-zinc-500">Account name</span>
                        <span className="font-medium text-zinc-900">{ACCOUNT_NAME}</span>
                      </>
                    )}
                    {BSB && (
                      <>
                        <span className="text-zinc-500">BSB</span>
                        <span className="font-medium text-zinc-900">{BSB}</span>
                      </>
                    )}
                    {ACCOUNT_NUMBER && (
                      <>
                        <span className="text-zinc-500">Account number</span>
                        <span className="font-medium text-zinc-900">{ACCOUNT_NUMBER}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Reference */}
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Payment reference</p>
                <p className="mt-1 font-mono text-lg font-semibold text-zinc-900">{result.frameId}</p>
                <p className="mt-0.5 text-xs text-zinc-400">Include this reference so we can match your payment.</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-amber-700">
              Once we confirm your payment, we'll dispatch your frame within 2–3 business days.
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

  // ── Loading screen ──────────────────────────────────────────────
  if (step === 'compiling' || step === 'uploading') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
          <p className="text-lg font-medium text-zinc-900">
            {step === 'compiling' ? 'Preparing your AR frame' : 'Uploading your files'}
          </p>
          <p className="mt-2 text-sm text-zinc-500">{progress}</p>
        </div>
      </main>
    )
  }

  // ── Form ────────────────────────────────────────────────────────
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-16 sm:px-6 lg:px-8">
      <a href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
        ← Back
      </a>

      <div className="max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">Order</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">Create your AR frame</h1>
        <p className="mt-3 text-zinc-500">
          Upload your photo and video. Payment details will be shown after submission.
        </p>
      </div>

      {step === 'error' && error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium text-zinc-700">
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-400"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Email address <span className="text-red-500">*</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-400"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700 md:col-span-2">
            Frame photo <span className="text-red-500">*</span>
            <p className="mb-1.5 mt-0.5 text-xs text-zinc-400">High-contrast images work best for AR tracking.</p>
            <input
              ref={photoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700 md:col-span-2">
            Video to play in AR <span className="text-red-500">*</span>
            <p className="mb-1.5 mt-0.5 text-xs text-zinc-400">MP4 or MOV. This plays when someone scans the frame.</p>
            <input
              ref={videoRef}
              type="file"
              accept="video/mp4,video/quicktime"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900"
            />
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!photo || !video || !email}
          className="mt-8 w-full rounded-full bg-zinc-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Submit Order →
        </button>
        {(!photo || !video || !email) && (
          <p className="mt-2 text-center text-xs text-zinc-400">
            {[!email && 'email', !photo && 'photo', !video && 'video'].filter(Boolean).join(', ')} required to continue
          </p>
        )}
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-zinc-400">
        <span>✉️ Order confirmation sent to your email</span>
        <span>📦 Delivered in 2–3 business days</span>
      </div>
    </main>
  )
}
