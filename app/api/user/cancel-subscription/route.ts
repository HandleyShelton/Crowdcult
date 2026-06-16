import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

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
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 10,
    })

    const cancellable = subscriptions.data.filter(s => s.status === 'active' || s.status === 'trialing')
    for (const sub of cancellable) {
      await stripe.subscriptions.cancel(sub.id)
    }
  } catch (err) {
    console.error('Stripe cancel error:', err)
    return NextResponse.json({ error: 'Failed to cancel with Stripe' }, { status: 500 })
  }

  await serviceClient
    .from('users')
    .update({ is_subscribed: false })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
