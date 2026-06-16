import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// Reconciles the DB is_subscribed flag against Stripe's source of truth.
// Self-heals cases where a webhook was missed or arrived out of order.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ is_subscribed: false })
  }

  let hasActive = false
  try {
    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 10,
    })
    hasActive = subs.data.some(s => s.status === 'active' || s.status === 'trialing')
  } catch (err) {
    console.error('sync-subscription Stripe error:', err)
    return NextResponse.json({ error: 'Stripe unavailable' }, { status: 500 })
  }

  await serviceClient
    .from('users')
    .update({ is_subscribed: hasActive })
    .eq('id', user.id)

  return NextResponse.json({ is_subscribed: hasActive })
}
