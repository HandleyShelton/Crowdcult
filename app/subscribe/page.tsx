'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleSubscribe() {
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?next=/subscribe')
      return
    }

    try {
      const res = await fetch('/api/create-checkout-session', { method: 'POST' })
      const { url, error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Start watching today</h1>
          <p className="text-gray-400">
            Unlimited access to independent cinema. Cancel anytime.
          </p>
        </div>

        <div className="bg-surface border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
            <div>
              <div className="font-semibold text-lg">Crowdcult Monthly</div>
              <div className="text-gray-400 text-sm mt-0.5">Unlimited films · Cancel anytime</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">$4.99</div>
              <div className="text-gray-400 text-sm">/ month</div>
            </div>
          </div>

          <ul className="space-y-3 mb-8 text-sm">
            {[
              ['🎬', 'Unlimited access to all films in the catalog'],
              ['💰', '50% of your subscription supports the filmmakers you watch'],
              ['📱', 'Watch on any device — desktop, mobile, TV'],
              ['❌', 'Cancel anytime, no cancellation fees'],
              ['🔒', 'Secure payment via Stripe'],
            ].map(([icon, text]) => (
              <li key={text} className="flex items-start gap-3 text-gray-300">
                <span className="text-base flex-shrink-0">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            {loading ? 'Redirecting to checkout…' : 'Subscribe for $4.99/month'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            You&apos;ll be redirected to Stripe&apos;s secure checkout. Your payment information is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  )
}
