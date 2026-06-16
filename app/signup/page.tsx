'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/subscribe'
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/subscribe` },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    window.location.href = next
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3">★ CROWDCULT ★</div>
          <h1 className="font-display text-5xl tracking-wider text-white">CREATE ACCOUNT</h1>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mt-2">
            SUPPORT INDEPENDENT FILMMAKERS
          </p>
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
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 focus:border-accent px-4 py-3 text-white font-mono text-sm placeholder-gray-700 focus:outline-none"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-3 font-mono text-sm uppercase tracking-widest transition-colors mt-2"
            >
              {loading ? 'CREATING ACCOUNT_' : 'CREATE ACCOUNT →'}
            </button>
          </form>

          <p className="text-center font-mono text-[10px] text-gray-700 mt-4 uppercase tracking-widest leading-relaxed">
            BY SIGNING UP YOU AGREE TO OUR TERMS. CANCEL ANYTIME.
          </p>

          <p className="text-center font-mono text-xs text-gray-600 mt-4 uppercase tracking-widest">
            HAVE AN ACCOUNT?{' '}
            <Link href="/login" className="text-accent hover:text-white transition-colors">
              SIGN IN »
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
