'use client'

import { useState } from 'react'
import Link from 'next/link'
import { compileImageTargets } from '@/app/upload/compile'
import { uploadFileToR2 } from '@/lib/client-upload'

// Compiles the collection's photos into one MindAR target here in the browser,
// then asks the server to create the album. Same shape as the partner importer:
// compile client-side, create server-side.

type Photo = { index: number; url: string; name: string }
type Result = { frameId: string; arUrl: string; qrDataUrl: string; count: number }

export default function BuildClient({
  token,
  label,
  kind,
  contactName,
  contactEmail,
  photos,
}: {
  token: string
  label: string
  kind: 'customer' | 'partner'
  contactName: string
  contactEmail: string
  photos: Photo[]
}) {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  async function build() {
    setBusy(true)
    setError('')
    try {
      // Pull the uploaded photos back down so the compiler can read them.
      setProgress('Fetching uploaded photos…')
      const files = await Promise.all(
        photos.map(async (p) => {
          const res = await fetch(p.url)
          if (!res.ok) throw new Error(`Could not fetch ${p.name} (${res.status}).`)
          const blob = await res.blob()
          return new File([blob], p.name, { type: blob.type || 'image/jpeg' })
        }),
      )

      // The reason this page exists: MindAR's compiler needs a DOM, so it can't
      // run on the server. This is the slow step — a minute or two is normal.
      setProgress('Analysing photos for AR tracking…')
      const targetBuffer = await compileImageTargets(files, (p) =>
        setProgress(`Analysing photos for AR tracking… ${Math.round(p * 100)}%`),
      )

      setProgress('Uploading AR target…')
      const targetFile = new File([targetBuffer], 'album.mind', {
        type: 'application/octet-stream',
      })
      const targetKey = await uploadFileToR2(targetFile, 'target', 'album.mind')

      // Only the target key is sent. The server reads the photo/video pairs from
      // the collection row, so nothing here can change what goes in the album.
      setProgress('Creating the album…')
      const res = await fetch(`/api/admin/collections/${token}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not build the album.')

      setResult(data as Result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl text-cream">Album built 🎉</h1>
        <p className="mt-3 text-sm text-cream/70">
          {result.count} photo{result.count === 1 ? '' : 's'} · reference{' '}
          <span className="font-mono text-cream">{result.frameId}</span>
        </p>

        <div className="mt-8 flex flex-col items-start gap-5 rounded-2xl border border-gold-brand/30 bg-green-mid/40 p-6 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.qrDataUrl}
            alt="AR album QR code"
            className="h-44 w-44 shrink-0 rounded-lg bg-white p-2"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-brand">
              QR code
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cream/70">
              Also emailed to you as an attachment.{' '}
              {kind === 'partner'
                ? 'Forward it to the partner once their payment clears.'
                : 'Send it to the customer when you’re ready.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={result.qrDataUrl}
                download={`qr-${result.frameId}.png`}
                className="rounded-full bg-gold-brand px-5 py-2.5 text-xs font-bold text-green-deep transition hover:bg-cream"
              >
                Download QR
              </a>
              <a
                href={result.arUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-cream/25 px-5 py-2.5 text-xs font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
              >
                Preview
              </a>
            </div>
            <p className="mt-4 break-all font-mono text-xs text-cream/40">{result.arUrl}</p>
          </div>
        </div>

        <Link
          href="/admin/collections"
          className="mt-8 inline-block text-sm text-cream/60 underline underline-offset-2 hover:text-gold-brand"
        >
          ← Back to collections
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-cream">Build album</h1>
      <p className="mt-3 text-sm text-cream/70">
        {label} · {photos.length} photo{photos.length === 1 ? '' : 's'} from {contactName || contactEmail}
      </p>

      <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.index}
            src={p.url}
            alt={`Uploaded photo ${p.index + 1}`}
            className="aspect-square w-full rounded-xl border border-cream/15 object-cover"
          />
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-cream/15 bg-green-mid/40 p-5">
        <p className="text-sm leading-relaxed text-cream/70">
          This compiles the photos into one AR target in <strong className="text-cream">this
          browser</strong>, then creates the album and emails you the QR code. It can take a
          minute or two — keep the tab open.
        </p>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={build}
          disabled={busy}
          className="rounded-full bg-gold-brand px-7 py-3 text-sm font-bold text-green-deep transition hover:bg-cream disabled:opacity-60"
        >
          {busy ? progress || 'Working…' : 'Build album & email me the QR'}
        </button>
        {!busy && (
          <Link href="/admin/collections" className="text-sm text-cream/60 underline underline-offset-2 hover:text-gold-brand">
            Cancel
          </Link>
        )}
      </div>
    </div>
  )
}
