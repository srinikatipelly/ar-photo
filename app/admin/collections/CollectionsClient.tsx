'use client'

import { useState } from 'react'

export type CollectionRow = {
  id: string
  token: string
  label: string
  kind: 'customer' | 'partner'
  status: 'pending' | 'submitted' | 'cancelled'
  max_items: number
  expires_at: string | null
  frame_id: string | null
  submitted_at: string | null
  created_at: string
  contact_name: string
  contact_email: string
  contact_phone: string
  contact_address: string
  note: string
  items: { photoKey: string; videoKey: string }[] | null
}

type Created = { url: string; qrDataUrl: string; token: string }

const STATUS_STYLE: Record<CollectionRow['status'], string> = {
  pending: 'bg-gold-brand/15 text-gold-brand',
  submitted: 'bg-emerald-400/15 text-emerald-300',
  cancelled: 'bg-cream/10 text-cream/50',
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function CollectionsClient({ rows }: { rows: CollectionRow[] }) {
  const [label, setLabel] = useState('')
  const [kind, setKind] = useState<'customer' | 'partner'>('customer')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<Created | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function createLink() {
    setCreating(true)
    setError('')
    setCreated(null)
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, kind, expiresInDays: 30 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create the link.')
      setCreated({ url: data.url, qrDataUrl: data.qrDataUrl, token: data.token })
      setLabel('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl text-cream">Collection links</h1>
      <p className="mt-2 text-sm text-cream/60">
        Send someone a link (or its QR) and they upload their photo + video pairs. Submitting
        doesn&apos;t build the album — you do that afterwards from what they sent.
      </p>

      {/* ── Create ─────────────────────────────────────────────────────────── */}
      <section className="mt-8 rounded-2xl border border-cream/15 bg-green-mid/40 p-6">
        <p className="text-sm font-semibold text-cream">New link</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Who is this for? (internal label)"
            className="flex-1 rounded-xl border border-cream/20 bg-green-deep/60 px-4 py-3 text-sm text-cream outline-none placeholder:text-cream/30 focus:border-gold-brand"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as 'customer' | 'partner')}
            className="rounded-xl border border-cream/20 bg-green-deep/60 px-4 py-3 text-sm text-cream outline-none focus:border-gold-brand"
          >
            <option value="customer">Customer</option>
            <option value="partner">Partner</option>
          </select>
          <button
            onClick={createLink}
            disabled={creating}
            className="rounded-full bg-gold-brand px-6 py-3 text-sm font-bold text-green-deep transition hover:bg-cream disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create link'}
          </button>
        </div>

        {/* Partner vs customer changes only the wording the recipient sees on submit. */}
        <p className="mt-2 text-xs text-cream/40">
          {kind === 'partner'
            ? 'Partner: they’re told you’ll contact them about payment before delivery.'
            : 'Customer: they’re told you’ll deliver the AR experience shortly.'}
        </p>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
        )}

        {created && (
          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-gold-brand/30 bg-green-deep/50 p-4 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={created.qrDataUrl} alt="Upload link QR code" className="h-32 w-32 shrink-0 rounded-lg bg-white p-1" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-brand">Ready to share</p>
              <p className="mt-1 break-all font-mono text-xs text-cream/80">{created.url}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(created.url)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="rounded-full border border-cream/25 px-4 py-2 text-xs font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
                >
                  {copied ? 'Copied ✓' : 'Copy link'}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Upload your photos and videos here: ${created.url}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-cream/25 px-4 py-2 text-xs font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
                >
                  Share on WhatsApp
                </a>
                <a
                  href={created.qrDataUrl}
                  download={`collect-qr-${created.token}.png`}
                  className="rounded-full border border-cream/25 px-4 py-2 text-xs font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
                >
                  Download QR
                </a>
              </div>
              <p className="mt-3 text-xs text-cream/40">
                Save this now — the QR is generated from the link, but the list below won&apos;t show it again.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <section className="mt-10">
        <p className="text-sm font-semibold text-cream">Recent links ({rows.length})</p>

        {rows.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-cream/15 bg-green-mid/30 px-5 py-8 text-center text-sm text-cream/50">
            No collection links yet. Create one above.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((row) => (
              <details key={row.id} className="rounded-2xl border border-cream/15 bg-green-mid/40 p-5">
                <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[row.status]}`}>
                    {row.status}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-cream/40">{row.kind}</span>
                  <span className="font-semibold text-cream">{row.label || 'Untitled'}</span>
                  {row.status === 'submitted' && (
                    <span className="text-sm text-cream/60">
                      · {row.items?.length ?? 0} pair{(row.items?.length ?? 0) === 1 ? '' : 's'}
                      {row.contact_name ? ` from ${row.contact_name}` : ''}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-cream/40">{fmt(row.created_at)}</span>
                </summary>

                <div className="mt-4 space-y-2 border-t border-cream/10 pt-4 text-sm text-cream/70">
                  <p className="break-all font-mono text-xs text-cream/50">/collect/{row.token}</p>

                  {row.status === 'submitted' ? (
                    <>
                      <p><span className="text-cream/50">Name:</span> {row.contact_name || '—'}</p>
                      <p><span className="text-cream/50">Email:</span> {row.contact_email || '—'}</p>
                      <p><span className="text-cream/50">Phone:</span> {row.contact_phone || '—'}</p>
                      <p><span className="text-cream/50">Address:</span> {row.contact_address || '—'}</p>
                      {row.note && <p><span className="text-cream/50">Note:</span> {row.note}</p>}
                      <p><span className="text-cream/50">Submitted:</span> {fmt(row.submitted_at)}</p>

                      {row.frame_id ? (
                        <p className="pt-2 text-xs text-cream/40">
                          Album built: <span className="font-mono text-cream/60">{row.frame_id}</span> — QR was emailed when it was created.
                        </p>
                      ) : (
                        <div className="pt-3">
                          <p className="text-xs text-cream/40">
                            No album yet, so there&apos;s no QR. Building one compiles the AR
                            target and emails you the QR
                            {row.kind === 'partner' ? ' — hold it until payment clears.' : '.'}
                          </p>
                          <a
                            href={`/admin/collections/${row.token}/build`}
                            className="mt-3 inline-block rounded-full bg-gold-brand px-5 py-2.5 text-xs font-bold text-green-deep transition hover:bg-cream"
                          >
                            Build album & get QR →
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-cream/50">
                      Not submitted yet · accepts up to {row.max_items} pairs · expires {fmt(row.expires_at)}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
