'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase/client'

function LoginForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(params.get('error') ? 'Sign-in link expired or invalid. Please try again.' : '')

  const supabase = createBrowserSupabase()
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function signInWithGoogle() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) setError(error.message)
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-cream/15 bg-green-mid/40 p-8 text-center">
        <div className="text-4xl" aria-hidden="true">✉️</div>
        <h2 className="mt-4 font-display text-2xl text-cream">Check your inbox</h2>
        <p className="mt-3 text-sm leading-relaxed text-cream/70">
          We sent a secure sign-in link to <span className="font-semibold text-cream">{email}</span>.
          Open it on this device to view your orders.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-semibold text-gold-brand hover:underline"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-cream/15 bg-green-mid/40 p-8">
      <h1 className="font-display text-3xl text-cream">Sign in</h1>
      <p className="mt-2 text-sm leading-relaxed text-cream/70">
        Access your orders and manage your AR memories.
      </p>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-cream/80" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="block w-full rounded-xl border border-cream/20 bg-green-deep/60 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-gold-brand"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gold-brand px-5 py-3.5 text-sm font-semibold text-green-deep transition hover:bg-cream disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-cream/40">
        <span className="h-px flex-1 bg-cream/15" /> or <span className="h-px flex-1 bg-cream/15" />
      </div>

      <button
        onClick={signInWithGoogle}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-cream/25 px-5 py-3.5 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.7-2.6C17 1.9 14.7.9 12 .9 6.5.9 2 5.3 2 11.9s4.5 11 10 11c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z" />
        </svg>
        Continue with Google
      </button>

      <p className="mt-6 text-center text-xs text-cream/50">
        We&apos;ll only use your email to show your orders. No password needed.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-md flex-col justify-center px-6 py-16">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
