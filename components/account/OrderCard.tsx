'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type Order = {
  frame_id: string
  customer_name: string
  status: string
  scan_count: number
  created_at: string
  photo_url: string | null
  qr_url: string | null
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-green-500/20 text-green-300' },
  pending: { label: 'Processing', cls: 'bg-amber-500/20 text-amber-200' },
  deleted: { label: 'Deleted', cls: 'bg-red-500/20 text-red-300' },
}

export function OrderCard({ order }: { order: Order }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const deleted = order.status === 'deleted'
  const status = STATUS_LABEL[order.status] ?? { label: order.status, cls: 'bg-cream/15 text-cream/70' }
  const created = new Date(order.created_at).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/account/frames/${order.frame_id}/delete`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Could not delete this order.')
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this order.')
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="flex flex-col rounded-3xl border border-cream/15 bg-green-mid/40 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold text-cream">{order.frame_id}</p>
          <p className="mt-0.5 text-xs text-cream/50">Ordered {created}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}>{status.label}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-cream/60">
        <span>👁️ {order.scan_count} {order.scan_count === 1 ? 'scan' : 'scans'}</span>
      </div>

      {!deleted && (
        <div className="mt-5 flex flex-wrap gap-2">
          {order.qr_url ? (
            <>
              <a
                href={order.qr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-gold-brand px-4 py-2 text-xs font-semibold text-green-deep transition hover:bg-cream"
              >
                View QR code
              </a>
              <a
                href={order.qr_url}
                download={`golden-frame-qr-${order.frame_id}.png`}
                className="rounded-full border border-cream/25 px-4 py-2 text-xs font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
              >
                Download QR
              </a>
            </>
          ) : (
            <span className="rounded-full border border-cream/15 px-4 py-2 text-xs font-medium text-cream/50">
              QR code preparing…
            </span>
          )}
        </div>
      )}

      {!deleted && (
        <p className="mt-3 text-xs leading-relaxed text-cream/50">
          Scan the QR code on your frame with any phone camera to relive your memory - no app needed.
        </p>
      )}

      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

      {!deleted && (
        <div className="mt-5 border-t border-cream/10 pt-4">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs font-medium text-cream/50 transition hover:text-red-300"
            >
              Request deletion
            </button>
          ) : (
            <div>
              <p className="text-xs leading-relaxed text-cream/70">
                Permanently delete this memory? The photo and video will be removed and the AR
                experience will stop working. This cannot be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-full bg-red-500/90 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete permanently'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="rounded-full border border-cream/25 px-4 py-2 text-xs font-semibold text-cream transition hover:border-cream/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
