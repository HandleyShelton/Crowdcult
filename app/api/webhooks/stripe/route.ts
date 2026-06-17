import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  // Two endpoints hit this handler: the platform endpoint (subscriptions) and
  // the Connect endpoint (account.updated). Each has its own signing secret, so
  // try both.
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(Boolean) as string[]
  let event: Stripe.Event | null = null
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret)
      break
    } catch {
      // try the next secret
    }
  }
  if (!event) {
    console.error('Stripe webhook signature error: no matching secret')
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
    case 'account.updated': {
      // Connect onboarding progress — flip the filmmaker's payout readiness.
      const account = event.data.object as Stripe.Account
      await supabase
        .from('users')
        .update({ connect_payouts_enabled: !!account.payouts_enabled })
        .eq('stripe_connect_account_id', account.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
