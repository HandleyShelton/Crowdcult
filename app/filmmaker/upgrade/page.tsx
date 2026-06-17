'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function FilmmakerUpgradePage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/submit'

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/signup?next=/submit'); return }
      setEmail(user.email ?? '')
      const { data: profile } = await supabase
        .from('users')
        .select('is_filmmaker, full_name')
        .eq('id', user.id)
        .single()
      if (profile?.is_filmmaker) { router.replace(next); return }
      if (profile?.full_name) setFullName(profile.full_name)
      setChecking(false)
    })
  }, [supabase, router, next])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/filmmaker/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      window.location.href = next
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="font-mono text-xs text-muted uppercase tracking-widest animate-pulse">loading_</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3">★ become a filmmaker ★</div>
          <h1 className="font-display text-5xl tracking-[0.04em] text-ink">submit your film</h1>
          <p className="font-mono text-xs text-muted mt-3 leading-relaxed">
            no payment required. just your name and you&apos;re in. you can still watch films too.
          </p>
        </div>

        <div className="border border-line rounded-xl bg-surface p-8">
          {error && (
            <div className="border border-red-500/40 bg-red-900/20 text-red-400 font-mono text-xs px-4 py-3 mb-6 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">full name</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoFocus
                placeholder="your name"
                className="w-full bg-background border border-line focus:border-accent rounded-md px-4 py-3 text-ink font-mono text-sm placeholder-muted focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">contact email</label>
              <input
                value={email}
                readOnly
                className="w-full bg-background/50 border border-line rounded-md px-4 py-3 text-muted font-mono text-sm cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-background py-3 rounded-md font-mono text-sm uppercase tracking-widest font-bold transition-colors"
            >
              {loading ? 'setting up_' : 'continue to submission →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
