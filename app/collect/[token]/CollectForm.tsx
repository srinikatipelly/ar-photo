'use client'

import { useState } from 'react'

// The uploader behind a collection link. Deliberately simple: pick pairs, add
// contact details, submit. It does NOT compile MindAR targets — that would mean
// ten compiles on a phone, and the AR experience is built by us afterwards
// anyway (see the migration for why intake and delivery are separate).

type Pair = {
  id: string
  photo: File | null
  video: File | null
  photoKey?: string
  videoKey?: string
}

type Status = 'editing' | 'uploading' | 'done'

const MAX_VIDEO_BYTES = 200 * 1024 * 1024
const MAX_PHOTO_BYTES = 25 * 1024 * 1024

const newPair = (): Pair => ({
  id: Math.random().toString(36).slice(2),
  photo: null,
  video: null,
})

/**
 * Common misspellings of the big mail providers.
 *
 * A real submission was lost to "gmai.com" — which is a live typo-squat domain
 * with its own MX record, so the mail was accepted by someone else's server.
 * No bounce, no error anywhere, and the customer simply never heard from us.
 * Format validation cannot catch this; only a known-typo list can.
 */
const DOMAIN_TYPOS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'iclod.com': 'icloud.com',
  'icloud.co': 'icloud.com',
}

/** Returns the likely-intended address, or null if nothing looks wrong. */
function suggestEmailFix(email: string): string | null {
  const [local, domain] = email.trim().toLowerCase().split('@')
  if (!local || !domain) return null
  const fixed = DOMAIN_TYPOS[domain]
  return fixed ? `${local}@${fixed}` : null
}

const inputBase =
  'mt-1.5 block w-full rounded-xl border border-cream/20 bg-green-deep/60 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-gold-brand'

export default function CollectForm({
  token,
  kind,
  maxItems,
}: {
  token: string
  kind: 'customer' | 'partner'
  maxItems: number
}) {
  const [pairs, setPairs] = useState<Pair[]>([newPair()])
  const [status, setStatus] = useState<Status>('editing')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')

  const complete = pairs.filter((p) => p.photo && p.video)
  const emailSuggestion = suggestEmailFix(email)

  function setFile(id: string, which: 'photo' | 'video', file: File | null) {
    setError('')
    if (file) {
      const limit = which === 'video' ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES
      if (file.size > limit) {
        setError(`That ${which} is too large (max ${Math.round(limit / 1024 / 1024)} MB).`)
        return
      }
    }
    setPairs((prev) => prev.map((p) => (p.id === id ? { ...p, [which]: file } : p)))
  }

  async function uploadFile(file: File, fileKind: 'photo' | 'video'): Promise<string> {
    const res = await fetch(`/api/collect/${token}/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: fileKind, contentType: file.type }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not start the upload.')

    const put = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!put.ok) throw new Error(`Upload failed for ${file.name}.`)

    return data.key as string
  }

  async function handleSubmit() {
    setError('')

    if (complete.length === 0) {
      setError('Add at least one photo and its video.')
      return
    }
    if (!name.trim() || !email.trim()) {
      setError('Please add your name and email so we can reach you.')
      return
    }

    setStatus('uploading')
    try {
      const items: { photoKey: string; videoKey: string }[] = []

      // Sequential rather than parallel: these are phone uploads on mobile data,
      // and ten simultaneous PUTs of large video tend to stall each other out.
      for (let i = 0; i < complete.length; i++) {
        const pair = complete[i]
        setProgress(`Uploading ${i + 1} of ${complete.length}…`)
        const photoKey = await uploadFile(pair.photo!, 'photo')
        const videoKey = await uploadFile(pair.video!, 'video')
        items.push({ photoKey, videoKey })
      }

      setProgress('Finishing up…')
      const res = await fetch(`/api/collect/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          contactName: name,
          contactEmail: email,
          contactPhone: phone,
          contactAddress: address,
          note,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not submit.')

      setStatus('done')
    } catch (err) {
      setStatus('editing')
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'done') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="The Golden Frame" className="mb-8 h-14 w-auto" />
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-brand/15 text-4xl" aria-hidden="true">
          🎉
        </div>
        <h1 className="mt-6 font-display text-3xl text-cream">Uploaded successfully!</h1>
        <p className="mt-4 text-sm leading-relaxed text-cream/75">
          Thank you — we&apos;ve received your {complete.length} photo
          {complete.length === 1 ? '' : 's'} and video{complete.length === 1 ? '' : 's'}.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-cream/75">
          {kind === 'partner'
            ? 'We’ll contact you shortly with the payment details. Once payment is confirmed we’ll send through your AR experience.'
            : 'We’ll be in touch if there are any issues — otherwise we’ll deliver your AR experience shortly.'}
        </p>
      </main>
    )
  }

  const busy = status === 'uploading'

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="The Golden Frame" className="mx-auto mb-8 h-12 w-auto" />

      <h1 className="text-center font-display text-3xl text-cream">Send us your photos & videos</h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-cream/70">
        Add up to {maxItems} pairs — each photo with the video that brings it to life.
        Videos can be up to 1 minute.
      </p>

      <section className="mt-8 space-y-4">
        {pairs.map((pair, i) => (
          <div key={pair.id} className="rounded-2xl border border-cream/15 bg-green-mid/40 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-cream">Pair {i + 1}</p>
              {pairs.length > 1 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPairs((prev) => prev.filter((p) => p.id !== pair.id))}
                  className="text-xs text-cream/50 underline underline-offset-2 hover:text-gold-brand disabled:opacity-40"
                >
                  Remove
                </button>
              )}
            </div>

            <label className="mt-3 block text-xs font-medium text-cream/70">
              Photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => setFile(pair.id, 'photo', e.target.files?.[0] ?? null)}
                className={`${inputBase} file:mr-3 file:rounded-full file:border-0 file:bg-gold-brand file:px-3 file:py-1 file:text-xs file:font-semibold file:text-green-deep`}
              />
            </label>

            <label className="mt-3 block text-xs font-medium text-cream/70">
              Video
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                disabled={busy}
                onChange={(e) => setFile(pair.id, 'video', e.target.files?.[0] ?? null)}
                className={`${inputBase} file:mr-3 file:rounded-full file:border-0 file:bg-gold-brand file:px-3 file:py-1 file:text-xs file:font-semibold file:text-green-deep`}
              />
            </label>
          </div>
        ))}

        {pairs.length < maxItems && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setPairs((prev) => [...prev, newPair()])}
            className="w-full rounded-2xl border border-dashed border-cream/25 px-5 py-3 text-sm font-semibold text-cream/80 transition hover:border-gold-brand hover:text-gold-brand disabled:opacity-40"
          >
            + Add another pair
          </button>
        )}
      </section>

      <section className="mt-8 space-y-4 rounded-2xl border border-cream/15 bg-green-mid/40 p-5">
        <p className="text-sm font-semibold text-cream">Your details</p>
        <label className="block text-xs font-medium text-cream/70">
          Name *
          <input type="text" value={name} disabled={busy} onChange={(e) => setName(e.target.value)} className={inputBase} />
        </label>
        <label className="block text-xs font-medium text-cream/70">
          Email *
          <input type="email" value={email} disabled={busy} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
          <span className="mt-1 block text-[11px] font-normal text-cream/40">
            We send your confirmation here, so please double-check it.
          </span>
        </label>

        {/* A suggestion, not a block — the list can't be exhaustive and the
            address might genuinely be right. One tap accepts it. */}
        {emailSuggestion && (
          <button
            type="button"
            onClick={() => setEmail(emailSuggestion)}
            className="-mt-2 block w-full rounded-xl border border-gold-brand/40 bg-gold-brand/10 px-4 py-2.5 text-left text-xs text-cream/85 transition hover:bg-gold-brand/20"
          >
            Did you mean <span className="font-semibold text-gold-brand">{emailSuggestion}</span>? Tap to use it.
          </button>
        )}
        <label className="block text-xs font-medium text-cream/70">
          Phone
          <input type="tel" value={phone} disabled={busy} onChange={(e) => setPhone(e.target.value)} className={inputBase} />
        </label>
        <label className="block text-xs font-medium text-cream/70">
          Address
          <textarea rows={2} value={address} disabled={busy} onChange={(e) => setAddress(e.target.value)} className={inputBase} />
        </label>
        <label className="block text-xs font-medium text-cream/70">
          Anything we should know?
          <textarea rows={2} value={note} disabled={busy} onChange={(e) => setNote(e.target.value)} className={inputBase} />
        </label>
      </section>

      {error && (
        <p className="mt-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={busy}
        className="mt-6 w-full rounded-full bg-gold-brand px-5 py-3.5 text-sm font-bold text-green-deep transition hover:bg-cream disabled:opacity-60"
      >
        {busy ? progress || 'Uploading…' : `Send ${complete.length || ''} pair${complete.length === 1 ? '' : 's'}`.replace('  ', ' ')}
      </button>

      <p className="mt-3 text-center text-xs text-cream/40">
        {busy ? 'Please keep this page open until it finishes.' : 'You can only submit once, so add everything before sending.'}
      </p>
    </main>
  )
}
