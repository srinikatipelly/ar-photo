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
  const [diagnostics, setDiagnostics] = useState<string[]>([])

  // Shown in errors and on the page: the photos come from R2_PUBLIC_URL, which
  // differs between environments, and a wrong value there is invisible otherwise.
  const photoHost = (() => {
    try {
      return new URL(photos[0]?.url ?? '').origin
    } catch {
      return 'the media host'
    }
  })()

  /**
   * Run each network dependency on its own and report which one fails.
   *
   * "Failed to fetch" is the same message whether the media host blocked CORS,
   * the AR engine 404'd, or the API is unreachable — so this isolates them
   * rather than making someone read a devtools console.
   */
  async function runChecks() {
    setBusy(true)
    setError('')
    setDiagnostics([])
    const out: string[] = []

    try {
      const res = await fetch(photos[0].url)
      out.push(`${res.ok ? '✅' : '❌'} photo download — HTTP ${res.status} from ${photoHost}`)
    } catch (e) {
      out.push(`❌ photo download — BLOCKED (${e instanceof Error ? e.message : e}) from ${photoHost}`)
    }

    try {
      const res = await fetch('/vendor/mind-ar/mindar-image.prod.js')
      out.push(`${res.ok ? '✅' : '❌'} AR engine — HTTP ${res.status}`)
    } catch (e) {
      out.push(`❌ AR engine — ${e instanceof Error ? e.message : e}`)
    }

    try {
      // No targetKey, so this is rejected with 400 without building anything —
      // we only care that the route is reachable and we're authorised.
      const res = await fetch(`/api/admin/collections/${token}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      out.push(
        `${res.status === 400 ? '✅' : '❌'} build API — HTTP ${res.status}` +
          (res.status === 403 ? ' (not signed in as admin)' : ''),
      )
    } catch (e) {
      out.push(`❌ build API — ${e instanceof Error ? e.message : e}`)
    }

    setDiagnostics(out)
    setBusy(false)
  }

  async function build() {
    setBusy(true)
    setError('')
    setDiagnostics([])

    // Every step below can fail for a different reason, and a bare "Failed to
    // fetch" (what fetch throws on any network/CORS problem) says nothing about
    // which one. Label each step so the message points at the actual cause.
    const step = async <T,>(what: string, fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn()
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        const networkish = /failed to fetch|networkerror|load failed/i.test(msg)
        throw new Error(
          networkish
            ? `${what} — the request was blocked or never completed (${msg}). This is usually CORS or a bad URL, not the album itself.`
            : `${what} — ${msg}`,
        )
      }
    }

    try {
      // Pull the uploaded photos back down so the compiler can read them.
      setProgress('Fetching uploaded photos…')
      const files = await step(`Couldn't download the uploaded photos from ${photoHost}`, () =>
        Promise.all(
          photos.map(async (p) => {
            const res = await fetch(p.url)
            if (!res.ok) throw new Error(`${p.name} returned HTTP ${res.status}`)
            const blob = await res.blob()
            return new File([blob], p.name, { type: blob.type || 'image/jpeg' })
          }),
        ),
      )

      // The reason this page exists: MindAR's compiler needs a DOM, so it can't
      // run on the server. This is the slow step — a minute or two is normal.
      setProgress('Analysing photos for AR tracking…')
      const targetBuffer = await step('The AR compile failed', () =>
        compileImageTargets(files, (p) =>
          setProgress(`Analysing photos for AR tracking… ${Math.round(p * 100)}%`),
        ),
      )

      setProgress('Uploading AR target…')
      const targetFile = new File([targetBuffer], 'album.mind', {
        type: 'application/octet-stream',
      })
      const targetKey = await step("Couldn't upload the compiled AR target", () =>
        uploadFileToR2(targetFile, 'target', 'album.mind'),
      )

      // Only the target key is sent. The server reads the photo/video pairs from
      // the collection row, so nothing here can change what goes in the album.
      setProgress('Creating the album…')
      const data = await step("Couldn't create the album", async () => {
        const res = await fetch(`/api/admin/collections/${token}/build`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetKey }),
        })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`)
        return payload
      })

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
        <div className="mt-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <p>{error}</p>
          <p className="mt-2 break-all text-xs text-red-200/70">
            Photos are served from <span className="font-mono">{photoHost}</span>
          </p>
        </div>
      )}

      {diagnostics.length > 0 && (
        <div className="mt-5 rounded-xl border border-cream/15 bg-green-deep/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-brand">Check results</p>
          <ul className="mt-2 space-y-1">
            {diagnostics.map((d, i) => (
              <li key={i} className="font-mono text-xs text-cream/70">{d}</li>
            ))}
          </ul>
        </div>
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
          <>
            <button
              onClick={runChecks}
              className="rounded-full border border-cream/25 px-5 py-3 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
            >
              Run checks
            </button>
            <Link href="/admin/collections" className="text-sm text-cream/60 underline underline-offset-2 hover:text-gold-brand">
              Cancel
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
