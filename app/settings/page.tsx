'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  email: string
  is_subscribed: boolean
  created_at: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login?next=/settings'); return }
      const { data } = await supabase
        .from('users')
        .select('email, is_subscribed, created_at')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    })
  }, [supabase, router])

  async function handleCancelSubscription() {
    if (!confirm('Cancel your subscription? Your access ends immediately and future charges stop. You can resubscribe anytime.')) return
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/user/cancel-subscription', { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error)
      setProfile(p => p ? { ...p, is_subscribed: false } : p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setWorking(false)
    }
  }

  async function handleDeleteAccount() {
    const confirmed = prompt('Type DELETE to permanently delete your account and all data:')
    if (confirmed !== 'DELETE') return
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="font-mono text-xs text-gray-600 uppercase tracking-widest animate-pulse">LOADING_</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="border-b border-red-900 pb-4 mb-10">
        <h1 className="font-display text-5xl tracking-wider text-ink">ACCOUNT</h1>
      </div>

      {error && (
        <div className="border border-red-500/50 bg-red-900/20 text-red-400 font-mono text-xs px-4 py-3 mb-6 uppercase tracking-wide">
          ERROR: {error}
        </div>
      )}

      {/* Account info */}
      <section className="border border-white/10 bg-surface p-6 mb-4">
        <h2 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4">{'// ACCOUNT INFO'}</h2>
        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 text-xs uppercase tracking-wider">Email</span>
            <span className="text-ink text-xs">{profile?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-xs uppercase tracking-wider">Member since</span>
            <span className="text-ink text-xs">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-xs uppercase tracking-wider">Status</span>
            <span className={`text-xs font-mono px-2 py-0.5 border ${
              profile?.is_subscribed
                ? 'text-green-400 border-green-900 bg-green-900/20'
                : 'text-gray-500 border-white/10'
            }`}>
              {profile?.is_subscribed ? 'SUBSCRIBED' : 'NOT SUBSCRIBED'}
            </span>
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section className="border border-white/10 bg-surface p-6 mb-4">
        <h2 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4">{'// SUBSCRIPTION'}</h2>
        {profile?.is_subscribed ? (
          <div>
            <p className="font-mono text-xs text-gray-400 mb-5 leading-relaxed">
              Your subscription is active at $4.99/month. Cancelling stops future charges
              and ends access immediately. You can resubscribe anytime.
            </p>
            <button
              onClick={handleCancelSubscription}
              disabled={working}
              className="border border-red-900 text-red-400 hover:bg-red-900/20 disabled:opacity-40 font-mono text-xs uppercase tracking-widest px-5 py-2.5 transition-colors"
            >
              {working ? 'CANCELLING_' : 'CANCEL SUBSCRIPTION'}
            </button>
          </div>
        ) : (
          <div>
            <p className="font-mono text-xs text-gray-500 mb-5">You do not have an active subscription.</p>
            <a
              href="/subscribe"
              className="bg-accent hover:bg-accent-hover text-ink font-mono text-xs uppercase tracking-widest px-5 py-2.5 transition-colors inline-block"
            >
              SUBSCRIBE FOR $4.99/MO →
            </a>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className="border border-red-900/50 bg-background p-6">
        <h2 className="font-mono text-xs text-red-900 uppercase tracking-widest mb-4">{'// DANGER ZONE'}</h2>
        <p className="font-mono text-xs text-gray-600 mb-5 leading-relaxed">
          Permanently deletes your account and all associated data. This cannot be undone.
          Any active subscription will be cancelled immediately.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={working}
          className="border border-red-800 text-red-700 hover:bg-red-900/30 hover:text-red-400 disabled:opacity-40 font-mono text-xs uppercase tracking-widest px-5 py-2.5 transition-colors"
        >
          {working ? 'DELETING_' : 'DELETE ACCOUNT'}
        </button>
      </section>
    </div>
  )
}
