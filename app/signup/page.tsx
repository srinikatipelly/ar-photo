'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function SignupPage() {
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [done, setDone]                 = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { business_name: businessName },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 flex justify-center text-4xl">✉️</div>
          <h1 className="text-xl font-semibold text-zinc-900">Check your email</h1>
          <p className="mt-2 text-sm text-zinc-500">
            We sent a confirmation link to <strong>{email}</strong>.<br />
            Click it to activate your account.
          </p>
          <a href="/login" className="mt-6 inline-block text-sm font-medium text-zinc-900 hover:underline">
            Back to sign in
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">B2B Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Start creating AR frames for your clients</p>
        </div>

        <form onSubmit={handleSignup} className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-sm font-medium text-zinc-700">
              Business name
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                required
                placeholder="Jane's Photography Studio"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-400"
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700">
              Email address
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@yourbusiness.com"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-400"
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700">
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-400"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-zinc-950 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:bg-zinc-300"
          >
            {loading ? 'Creating account…' : 'Create account →'}
          </button>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-zinc-900 hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </main>
  )
}
