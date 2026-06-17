import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'

// Create (or reuse) a Stripe Connect Express account for the filmmaker and
// return a hosted onboarding link. Stripe collects bank + identity details.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  if (!rateLimit(`connect:${user.id}`, 8, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('is_filmmaker, full_name, contact_email, email, stripe_connect_account_id')
    .eq('id', user.id)
    .single()

  if (!profile?.is_filmmaker) {
    return NextResponse.json({ error: 'Filmmaker account required' }, { status: 403 })
  }

  let accountId = profile.stripe_connect_account_id
  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile.contact_email || profile.email || undefined,
        capabilities: { transfers: { requested: true } },
        business_type: 'individual',
        metadata: { supabase_user_id: user.id },
      })
      accountId = account.id
      await serviceClient.from('users').update({ stripe_connect_account_id: accountId }).eq('id', user.id)
    }

    const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/settings`,
      return_url: `${base}/settings`,
      type: 'account_onboarding',
    })
    return NextResponse.json({ url: link.url })
  } catch (err) {
    console.error('Connect onboarding error:', err)
    const message = err instanceof Error ? err.message : 'Could not start onboarding'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
