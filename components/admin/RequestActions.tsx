'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RequestActions({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState('')

  async function act(kind: 'approve' | 'reject') {
    setError(''); setBusy(kind)
    try {
      const res = await fetch(`/api/admin/partner-requests/${id}/${kind}`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Could not ${kind}.`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not ${kind}.`)
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button onClick={() => act('approve')} disabled={busy !== null}
          className="rounded-full bg-gold-brand px-4 py-2 text-sm font-bold text-green-deep transition hover:bg-cream disabled:opacity-50">
          {busy === 'approve' ? 'Approving…' : 'Approve'}
        </button>
        <button onClick={() => act('reject')} disabled={busy !== null}
          className="rounded-full border border-cream/25 px-4 py-2 text-sm font-semibold text-cream/80 transition hover:border-red-400/60 hover:text-red-200 disabled:opacity-50">
          {busy === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  )
}
