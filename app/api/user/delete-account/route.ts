import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Cancel any active Stripe subscription first
  if (profile?.stripe_customer_id) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
        limit: 1,
      })
      const sub = subscriptions.data[0]
      if (sub) await stripe.subscriptions.cancel(sub.id)
    } catch {
      // Non-fatal — proceed with deletion
    }
  }

  // Delete from Supabase Auth (cascades to users table via FK)
  const { error } = await serviceClient.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('Auth delete error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
