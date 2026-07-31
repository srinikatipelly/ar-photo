'use client'

import { useState } from 'react'
import Link from 'next/link'
import { compileImageTargets } from '@/app/upload/compile'

// Shared album builder: assemble N photo+video pairs → compile one MindAR .mind
// (browser-only) → upload assets → POST to `endpoint` → show the one QR.
// Used by the public /album test tool and the partner-gated builder; they differ
// only by `endpoint` (which sets ownership/source server-side).

type Pair = { id: number; photo: File | null; video: File | null }
type Step = 'form' | 'compiling' | 'uploading' | 'done' | 'error'

const MAX_VIDEO_BYTES = 200 * 1024 * 1024

let nextId = 1
const emptyPair = (): Pair => ({ id: nextId++, photo: null, video: null })

async function uploadToR2(file: File, type: 'photo' | 'video' | 'target'): Promise<string> {
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
    xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed. Please try again.')))
    xhr.onerror = () => reject(new Error('Upload failed. Please try again.'))
    xhr.send(file)
  })

  return key
}

export function AlbumBuilder({
  endpoint,
  maxItems,
  eyebrow = 'Album',
  title = 'Build an AR album',
  backHref = '/',
}: {
  endpoint: string
  maxItems: number
  eyebrow?: string
  title?: string
  backHref?: string
}) {
  const [pairs, setPairs]       = useState<Pair[]>([emptyPair(), emptyPair()])
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [step, setStep]         = useState<Step>('form')
  const [progress, setProgress] = useState('')
  const [error, setError]       = useState('')
  const [result, setResult]     = useState<{ frameId: string; arUrl: string; qrDataUrl: string; count: number } | null>(null)

  const completePairs = pairs.filter((p) => p.photo && p.video)

  function updatePair(id: number, field: 'photo' | 'video', file: File | null) {
    setError('')
    if (field === 'video' && file && file.size > MAX_VIDEO_BYTES) {
      setError('Each video must be under 200 MB.')
      return
    }
    setPairs((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: file } : p)))
  }

  function addPair() {
    setPairs((prev) => (prev.length >= maxItems ? prev : [...prev, emptyPair()]))
  }
  function removePair(id: number) {
    setPairs((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)))
  }

  async function handleCreate() {
    setError('')
    if (completePairs.length < 1) {
      setError('Add at least one photo + video pair.')
      return
    }
    const incomplete = pairs.some((p) => (p.photo && !p.video) || (!p.photo && p.video))
    if (incomplete) {
      setError('Every row needs BOTH a photo and a video (or remove the empty row).')
      return
    }

    try {
      // 1. Compile all photos into ONE .mind (order = anchor order = items order).
      setStep('compiling')
      setProgress('Analysing your photos for AR tracking…')
      const photos = completePairs.map((p) => p.photo!)
      const targetBuffer = await compileImageTargets(photos, (pct) =>
        setProgress(`Analysing photos for AR tracking… ${Math.round(pct * 100)}%`),
      )
      const targetFile = new File([targetBuffer], 'album.mind', { type: 'application/octet-stream' })

      // 2. Upload every photo + video (same order), then the combined target.
      setStep('uploading')
      const items: { photoKey: string; videoKey: string }[] = []
      for (let i = 0; i < completePairs.length; i++) {
        setProgress(`Uploading photo ${i + 1} of ${completePairs.length}…`)
        const photoKey = await uploadToR2(completePairs[i].photo!, 'photo')
        setProgress(`Uploading video ${i + 1} of ${completePairs.length}…`)
        const videoKey = await uploadToR2(completePairs[i].video!, 'video')
        items.push({ photoKey, videoKey })
      }
      setProgress('Uploading AR target…')
      const targetKey = await uploadToR2(targetFile, 'target')

      // 3. Create the album row + QR.
      setProgress('Creating your album…')
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, targetKey, customerName: name.trim(), customerEmail: email.trim() }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to create the album.')
      }
      setResult(await res.json())
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-16">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-3xl">🎉</div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Album created</h1>
        <p className="mt-2 text-zinc-500">
          One QR for all {result.count} photos. Print the photos, then scan this and pan from photo to photo.
        </p>

        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
          {result.qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.qrDataUrl} alt="Album QR code" className="mx-auto h-56 w-56" />
          )}
          <p className="mt-4 break-all font-mono text-sm text-zinc-500">{result.arUrl}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <a href={result.arUrl} target="_blank" rel="noopener noreferrer"
              className="rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-300">
              Open AR viewer
            </a>
            <Link href={backHref}
              className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Done
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-400">Reference: {result.frameId}</p>
        </div>
      </main>
    )
  }

  // ── Working ────────────────────────────────────────────────────────────────
  if (step === 'compiling' || step === 'uploading') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-lg font-semibold text-zinc-900">
            {step === 'compiling' ? 'Preparing your AR album' : 'Uploading your files'}
          </p>
          <p className="mt-2 text-sm text-zinc-500">{progress}</p>
          <p className="mt-4 text-xs text-zinc-400">Please keep this tab open.</p>
        </div>
      </main>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-16">
      <Link href={backHref} className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">← Back</Link>

      <span className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">{eyebrow}</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">{title}</h1>
      <p className="mt-3 text-zinc-500">
        Add up to {maxItems} photo + video pairs. They compile into <strong>one QR</strong> — scan once and pan
        from photo to photo. Matte, well-textured prints track best.
      </p>

      {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Name <span className="text-xs text-zinc-400">(optional)</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Album name"
              className="mt-1 block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Email <span className="text-xs text-zinc-400">(optional)</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="mt-1 block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
          </div>
        </div>

        <div className="my-6 border-t border-zinc-100" />

        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Photos &amp; videos · {completePairs.length} ready
        </h2>

        <div className="space-y-4">
          {pairs.map((pair, i) => (
            <div key={pair.id} className="rounded-2xl border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-700">Photo {i + 1}</span>
                {pairs.length > 1 && (
                  <button onClick={() => removePair(pair.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 px-3 py-4 text-center transition hover:bg-zinc-50">
                  <span className="text-xl">{pair.photo ? '🖼️' : '📷'}</span>
                  <span className="text-xs font-medium text-zinc-600">{pair.photo ? pair.photo.name : 'Choose photo'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                    onChange={(e) => updatePair(pair.id, 'photo', e.target.files?.[0] ?? null)} />
                </label>
                <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 px-3 py-4 text-center transition hover:bg-zinc-50">
                  <span className="text-xl">{pair.video ? '🎬' : '🎥'}</span>
                  <span className="text-xs font-medium text-zinc-600">{pair.video ? pair.video.name : 'Choose video'}</span>
                  <input type="file" accept="video/mp4,video/quicktime" className="sr-only"
                    onChange={(e) => updatePair(pair.id, 'video', e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>
          ))}
        </div>

        {pairs.length < maxItems && (
          <button onClick={addPair} className="mt-4 w-full rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
            + Add another photo ({pairs.length}/{maxItems})
          </button>
        )}

        <button onClick={handleCreate}
          className="mt-6 w-full rounded-full bg-amber-400 px-5 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-amber-300">
          Create album →
        </button>
      </section>
    </main>
  )
}
