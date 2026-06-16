import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Source of truth: ask Stripe for the customer's current subscriptions and
  // set is_subscribed accordingly. This is order-independent, so a delayed
  // "subscription.deleted" event can't clobber a fresh resubscription.
  async function syncSubscriptionStatus(customerId: string) {
    let hasActive = false
    try {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
      })
      hasActive = subs.data.some(s => s.status === 'active' || s.status === 'trialing')
    } catch (err) {
      console.error('Failed to list subscriptions for', customerId, err)
      return
    }
    await supabase
      .from('users')
      .update({ is_subscribed: hasActive })
      .eq('stripe_customer_id', customerId)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.customer) await syncSubscriptionStatus(session.customer as string)
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await syncSubscriptionStatus(sub.customer as string)
      break
    }
    case 'invoice.payment_failed':
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.customer) await syncSubscriptionStatus(invoice.customer as string)
      break
    }
  }

  return NextResponse.json({ received: true })
}
