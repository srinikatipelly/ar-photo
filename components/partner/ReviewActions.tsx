'use client'

import { useState } from 'react'

export function ReviewActions({ id, token, name }: { id: string; token: string; name: string }) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState('')

  async function act(kind: 'approve' | 'reject') {
    setError(''); setBusy(kind)
    try {
      const res = await fetch(`/api/admin/partner-requests/${id}/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Could not ${kind}.`)
      setDone(kind === 'approve' ? 'approved' : 'rejected')
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not ${kind}.`)
      setBusy(null)
    }
  }

  if (done === 'approved') {
    return (
      <div className="rounded-2xl border border-cream/15 bg-green-mid/40 p-6 text-center">
        <div className="text-3xl">✅</div>
        <p className="mt-2 font-display text-xl text-cream">Approved</p>
        <p className="mt-1.5 text-sm text-cream/70">{name} has been activated and emailed a sign-in link to their partner portal.</p>
      </div>
    )
  }
  if (done === 'rejected') {
    return (
      <div className="rounded-2xl border border-cream/15 bg-green-mid/40 p-6 text-center">
        <div className="text-3xl">✕</div>
        <p className="mt-2 font-display text-xl text-cream">Rejected</p>
        <p className="mt-1.5 text-sm text-cream/70">This application has been marked as rejected.</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={() => act('approve')} disabled={busy !== null}
          className="rounded-full bg-gold-brand px-7 py-3 text-sm font-bold text-green-deep transition hover:bg-cream disabled:opacity-50">
          {busy === 'approve' ? 'Approving…' : '✓ Approve'}
        </button>
        <button onClick={() => act('reject')} disabled={busy !== null}
          className="rounded-full border border-cream/25 px-7 py-3 text-sm font-semibold text-cream/80 transition hover:border-red-400/60 hover:text-red-200 disabled:opacity-50">
          {busy === 'reject' ? 'Rejecting…' : '✕ Reject'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  )
}
