'use client'

import { useState } from 'react'
import Link from 'next/link'
import { compileImageTargets } from '@/app/upload/compile'
import { uploadFileToR2 } from '@/lib/client-upload'
import { AlbumQrPending } from '@/components/album/AlbumQrPending'

// Shared album builder: assemble N photo+video pairs → compile one MindAR .mind
// (browser-only) → upload assets → POST to `endpoint` → show the one QR.
// Used by the partner-gated builder (/partners/albums/new). `endpoint` sets
// ownership/source server-side. Brand dark theme.

type Pair = { id: number; photo: File | null; video: File | null }
type Step = 'form' | 'compiling' | 'uploading' | 'done' | 'error'

const MAX_VIDEO_BYTES = 200 * 1024 * 1024

let nextId = 1
const emptyPair = (): Pair => ({ id: nextId++, photo: null, video: null })

const label = 'block text-sm font-medium text-cream/80'
const field = 'mt-1.5 block w-full rounded-xl border border-cream/20 bg-green-deep/60 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-gold-brand'
const primaryBtn = 'rounded-full bg-gold-brand px-6 py-3 text-sm font-bold text-green-deep transition hover:bg-cream disabled:opacity-50'
const ghostBtn = 'rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand'

export function AlbumBuilder({
  endpoint,
  maxItems,
  eyebrow = 'Album',
  title = 'Build an AR album',
  backHref = '/',
  showQr = true,
}: {
  endpoint: string
  maxItems: number
  eyebrow?: string
  title?: string
  backHref?: string
  /** Partners don't see the QR — it's released by an admin after payment. */
  showQr?: boolean
}) {
  const [pairs, setPairs]       = useState<Pair[]>([emptyPair(), emptyPair()])
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [step, setStep]         = useState<Step>('form')
  const [progress, setProgress] = useState('')
  const [error, setError]       = useState('')
  const [result, setResult]     = useState<{ frameId: string; arUrl: string; qrDataUrl: string; count: number } | null>(null)

  const completePairs = pairs.filter((p) => p.photo && p.video)

  function updatePair(id: number, fieldName: 'photo' | 'video', file: File | null) {
    setError('')
    if (fieldName === 'video' && file && file.size > MAX_VIDEO_BYTES) {
      setError('Each video must be under 200 MB.')
      return
    }
    setPairs((prev) => prev.map((p) => (p.id === id ? { ...p, [fieldName]: file } : p)))
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
      setStep('compiling')
      setProgress('Analysing your photos for AR tracking…')
      const photos = completePairs.map((p) => p.photo!)
      const targetBuffer = await compileImageTargets(photos, (pct) =>
        setProgress(`Analysing photos for AR tracking… ${Math.round(pct * 100)}%`),
      )
      const targetFile = new File([targetBuffer], 'album.mind', { type: 'application/octet-stream' })

      setStep('uploading')
      const items: { photoKey: string; videoKey: string }[] = []
      for (let i = 0; i < completePairs.length; i++) {
        setProgress(`Uploading photo ${i + 1} of ${completePairs.length}…`)
        const photoKey = await uploadFileToR2(completePairs[i].photo!, 'photo', completePairs[i].photo!.name)
        setProgress(`Uploading video ${i + 1} of ${completePairs.length}…`)
        const videoKey = await uploadFileToR2(completePairs[i].video!, 'video', completePairs[i].video!.name)
        items.push({ photoKey, videoKey })
      }
      setProgress('Uploading AR target…')
      const targetKey = await uploadFileToR2(targetFile, 'target', 'album.mind')

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
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-green-deep px-4 py-16">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold-brand/15 text-3xl">🎉</div>
        <h1 className="font-display text-3xl text-cream">Album created</h1>
        <p className="mt-2 text-cream/70">
          {showQr
            ? `One QR for all ${result.count} photos. Print the photos, then scan this and pan from photo to photo.`
            : `All ${result.count} photos are linked to one album.`}
        </p>

        {showQr ? (
          <div className="mt-8 rounded-3xl border border-cream/15 bg-green-mid/40 p-6 text-center">
            {result.qrDataUrl && (
              <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.qrDataUrl} alt="Album QR code" className="h-52 w-52" />
              </div>
            )}
            <p className="mt-4 break-all font-mono text-sm text-cream/60">{result.arUrl}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a href={result.arUrl} target="_blank" rel="noopener noreferrer" className={primaryBtn}>Open AR viewer</a>
              <Link href={backHref} className={ghostBtn}>Done</Link>
            </div>
            <p className="mt-4 text-xs text-cream/40">Reference: {result.frameId}</p>
          </div>
        ) : (
          <div className="mt-8">
            <AlbumQrPending frameId={result.frameId} count={result.count} />
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={result.arUrl} target="_blank" rel="noopener noreferrer" className={ghostBtn}>Preview the AR album</a>
              <Link href={backHref} className={ghostBtn}>Done</Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Working ────────────────────────────────────────────────────────────────
  if (step === 'compiling' || step === 'uploading') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center bg-green-deep px-4">
        <div className="w-full max-w-md rounded-3xl border border-cream/15 bg-green-mid/40 p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gold-brand border-t-transparent" />
          <p className="font-display text-xl text-cream">
            {step === 'compiling' ? 'Preparing your AR album' : 'Uploading your files'}
          </p>
          <p className="mt-2 text-sm text-cream/60">{progress}</p>
          <p className="mt-4 text-xs text-cream/40">Please keep this tab open.</p>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-green-deep px-4 py-16">
      <Link href={backHref} className="mb-8 inline-flex items-center gap-1.5 text-sm text-cream/60 hover:text-gold-brand">← Back</Link>

      <span className="eyebrow text-sm font-semibold uppercase tracking-[0.3em] text-gold-brand">{eyebrow}</span>
      <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">{title}</h1>
      <p className="mt-3 text-cream/70">
        Add up to {maxItems} photo + video pairs. They compile into <strong className="text-cream">one QR</strong> — scan once and pan
        from photo to photo. Matte, well-textured prints track best.
      </p>

      {error && <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

      <section className="mt-6 rounded-3xl border border-cream/15 bg-green-mid/40 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Name <span className="text-cream/40">(optional)</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Album name" className={field} />
          </div>
          <div>
            <label className={label}>Email <span className="text-cream/40">(optional)</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />
          </div>
        </div>

        <div className="my-6 border-t border-cream/10" />

        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-cream/50">
          Photos &amp; videos · {completePairs.length} ready
        </h2>

        <div className="space-y-4">
          {pairs.map((pair, i) => (
            <div key={pair.id} className="rounded-2xl border border-cream/15 bg-green-deep/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-cream/80">Photo {i + 1}</span>
                {pairs.length > 1 && (
                  <button onClick={() => removePair(pair.id)} className="text-xs text-red-300 hover:underline">Remove</button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-cream/20 px-3 py-4 text-center transition hover:border-gold-brand/60">
                  <span className="text-xl">{pair.photo ? '🖼️' : '📷'}</span>
                  <span className="text-xs font-medium text-cream/70">{pair.photo ? pair.photo.name : 'Choose photo'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                    onChange={(e) => updatePair(pair.id, 'photo', e.target.files?.[0] ?? null)} />
                </label>
                <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-cream/20 px-3 py-4 text-center transition hover:border-gold-brand/60">
                  <span className="text-xl">{pair.video ? '🎬' : '🎥'}</span>
                  <span className="text-xs font-medium text-cream/70">{pair.video ? pair.video.name : 'Choose video'}</span>
                  <input type="file" accept="video/mp4,video/quicktime" className="sr-only"
                    onChange={(e) => updatePair(pair.id, 'video', e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>
          ))}
        </div>

        {pairs.length < maxItems && (
          <button onClick={addPair} className="mt-4 w-full rounded-xl border border-dashed border-cream/25 px-4 py-3 text-sm font-medium text-cream/70 transition hover:border-gold-brand/60 hover:text-cream">
            + Add another photo ({pairs.length}/{maxItems})
          </button>
        )}

        <button onClick={handleCreate} className={`${primaryBtn} mt-6 w-full`}>
          Create album →
        </button>
      </section>
    </div>
  )
}
