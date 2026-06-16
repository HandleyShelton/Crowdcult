import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Fall back to the request origin if the env var isn't set, so the
  // redirect never becomes "undefined/subscribe/success".
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  // Retrieve or create Stripe customer
  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  } else {
    // Guard against double-billing: if this customer already has an active
    // subscription, don't open a second checkout. Reconcile the DB instead.
    const existing = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
    const hasActive = existing.data.some(s => s.status === 'active' || s.status === 'trialing')
    if (hasActive) {
      await createServiceClient()
        .from('users')
        .update({ is_subscribed: true })
        .eq('id', user.id)
      return NextResponse.json({ alreadySubscribed: true })
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${baseUrl}/subscribe/success`,
    cancel_url: `${baseUrl}/subscribe`,
    metadata: { supabase_user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
