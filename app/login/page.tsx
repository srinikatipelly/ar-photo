'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">B2B Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Sign in to your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your AR frames and clients</p>
        </div>

        <form onSubmit={handleLogin} className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-400"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-zinc-950 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:bg-zinc-300"
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>

          <p className="mt-5 text-center text-sm text-zinc-500">
            No account?{' '}
            <a href="/signup" className="font-medium text-zinc-900 hover:underline">
              Create one
            </a>
          </p>
        </form>
      </div>
    </main>
  )
}
