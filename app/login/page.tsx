'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/browse'
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_subscribed')
      .eq('email', email)
      .single()

    router.push(profile?.is_subscribed ? next : '/subscribe')
    router.refresh()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3">★ CROWDCULT ★</div>
          <h1 className="font-display text-5xl tracking-wider text-white">WELCOME BACK</h1>
        </div>

        <div className="border border-red-900 bg-surface p-8">
          {error && (
            <div className="border border-red-500/50 bg-red-900/20 text-red-400 font-mono text-xs px-4 py-3 mb-6 uppercase tracking-wide">
              ERROR: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 focus:border-accent px-4 py-3 text-white font-mono text-sm placeholder-gray-700 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 focus:border-accent px-4 py-3 text-white font-mono text-sm placeholder-gray-700 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-3 font-mono text-sm uppercase tracking-widest transition-colors mt-2"
            >
              {loading ? 'SIGNING IN_' : 'SIGN IN →'}
            </button>
          </form>

          <p className="text-center font-mono text-xs text-gray-600 mt-6 uppercase tracking-widest">
            NO ACCOUNT?{' '}
            <Link href="/signup" className="text-accent hover:text-white transition-colors">
              CREATE ONE »
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
