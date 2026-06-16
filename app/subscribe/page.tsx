'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('is_subscribed')
          .eq('id', user.id)
          .single()
        if (profile?.is_subscribed) {
          router.replace('/browse')
          return
        }
        // Self-heal: if a webhook was missed, reconcile against Stripe before
        // showing the pay button — avoids charging an already-subscribed user.
        try {
          const res = await fetch('/api/user/sync-subscription', { method: 'POST' })
          const { is_subscribed } = await res.json()
          if (is_subscribed) {
            router.replace('/browse')
            return
          }
        } catch {
          // Reconcile is best-effort; fall through to the pay button.
        }
      }
      setChecking(false)
    })
  }, [supabase, router])

  async function handleSubscribe() {
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/signup?next=/subscribe')
      return
    }

    try {
      const res = await fetch('/api/create-checkout-session', { method: 'POST' })
      const { url, error: apiError, alreadySubscribed } = await res.json()
      if (apiError) throw new Error(apiError)
      if (alreadySubscribed) {
        router.replace('/browse')
        return
      }
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="font-mono text-xs text-gray-600 uppercase tracking-widest animate-pulse">LOADING_</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3">★ JOIN CROWDCULT ★</div>
          <h1 className="font-display text-5xl tracking-wider text-white mb-2">START WATCHING</h1>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">
            UNLIMITED INDEPENDENT CINEMA · CANCEL ANYTIME
          </p>
        </div>

        <div className="border border-red-900 bg-surface p-8">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-red-900">
            <div>
              <div className="font-mono text-sm text-white uppercase tracking-wide">CROWDCULT MONTHLY</div>
              <div className="font-mono text-xs text-gray-500 mt-1 uppercase tracking-wider">UNLIMITED FILMS · CANCEL ANYTIME</div>
            </div>
            <div className="text-right">
              <div className="font-display text-5xl text-accent">$4.99</div>
              <div className="font-mono text-xs text-gray-500 uppercase">/ MONTH</div>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              'Unlimited access to all films in the catalog',
              '50% of your subscription supports the filmmakers you watch',
              'Watch on any device — desktop, mobile, TV',
              'Cancel anytime, no cancellation fees',
              'Secure payment via Stripe',
            ].map(text => (
              <li key={text} className="flex items-start gap-3 font-mono text-xs text-gray-400">
                <span className="text-accent flex-shrink-0">»</span>
                {text}
              </li>
            ))}
          </ul>

          {error && (
            <div className="border border-red-500/50 bg-red-900/20 text-red-400 font-mono text-xs px-4 py-3 mb-4 uppercase tracking-wide">
              ERROR: {error}
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-4 font-mono text-sm uppercase tracking-widest transition-colors"
          >
            {loading ? 'REDIRECTING TO CHECKOUT_' : 'SUBSCRIBE FOR $4.99/MONTH →'}
          </button>

          <p className="text-center font-mono text-[10px] text-gray-700 mt-4 uppercase tracking-widest">
            SECURE CHECKOUT VIA STRIPE · PAYMENT INFO NEVER STORED HERE
          </p>
        </div>
      </div>
    </div>
  )
}
