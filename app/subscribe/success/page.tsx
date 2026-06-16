'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SubscribeSuccessPage() {
  const [confirmed, setConfirmed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    let attempts = 0
    let active = true

    async function poll() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data } = await supabase
        .from('users')
        .select('is_subscribed')
        .eq('id', user.id)
        .single()

      if (!active) return

      if (data?.is_subscribed) {
        setConfirmed(true)
        setTimeout(() => router.replace('/browse'), 1200)
        return
      }

      attempts++
      if (attempts >= 10) { setTimedOut(true); return }
      setTimeout(poll, 1500)
    }

    poll()
    return () => { active = false }
  }, [supabase, router])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {confirmed ? (
          <>
            <div className="font-display text-7xl text-accent mb-4 tracking-wider">OK!</div>
            <h1 className="font-display text-4xl tracking-wider text-ink mb-3">YOU&apos;RE SUBSCRIBED</h1>
            <p className="font-mono text-xs text-gray-400 mb-2 leading-relaxed uppercase tracking-wider">
              Welcome to Crowdcult. Taking you to the films...
            </p>
            <p className="font-mono text-xs text-gray-600 mb-10 leading-relaxed">
              50% of your subscription goes directly to the filmmakers you watch.
            </p>
            <Link
              href="/browse"
              className="bg-accent hover:bg-accent-hover text-ink px-10 py-3 font-mono text-sm uppercase tracking-widest transition-colors"
            >
              START WATCHING →
            </Link>
          </>
        ) : timedOut ? (
          <>
            <div className="font-display text-7xl text-accent mb-4 tracking-wider">...</div>
            <h1 className="font-display text-4xl tracking-wider text-ink mb-3">ALMOST THERE</h1>
            <p className="font-mono text-xs text-gray-400 mb-10 leading-relaxed uppercase tracking-wider">
              Your payment went through. Activation is taking a moment — refresh in a few seconds,
              or check your account page.
            </p>
            <Link
              href="/settings"
              className="border border-white/30 hover:border-accent text-ink px-10 py-3 font-mono text-sm uppercase tracking-widest transition-colors"
            >
              VIEW ACCOUNT →
            </Link>
          </>
        ) : (
          <>
            <div className="font-display text-7xl text-accent mb-4 tracking-wider animate-pulse">$</div>
            <h1 className="font-display text-4xl tracking-wider text-ink mb-3">ACTIVATING</h1>
            <p className="font-mono text-xs text-gray-500 leading-relaxed uppercase tracking-widest animate-pulse">
              Confirming your subscription_
            </p>
          </>
        )}
      </div>
    </div>
  )
}
