import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { isAdminEmail, currentMonth } from '@/lib/utils'
import { mux } from '@/lib/mux'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('email').eq('id', user.id).single()
  if (!profile || !isAdminEmail(profile.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = createServiceClient()
  const month = currentMonth()

  // Get asset count from Mux
  let assetCount = 0
  try {
    await mux.video.assets.list({ limit: 1 })
    // Mux doesn't expose total count directly in SDK — use films table as proxy
    const { count } = await serviceClient
      .from('films')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ready')
    assetCount = count ?? 0
  } catch {
    const { count } = await serviceClient
      .from('films')
      .select('*', { count: 'exact', head: true })
    assetCount = count ?? 0
  }

  // Estimate delivery minutes from our own watch_events (total watched seconds / 60)
  const [y, m] = month.split('-').map(Number)
  const monthStart = new Date(y, m - 1, 1).toISOString()
  const monthEnd = new Date(y, m, 1).toISOString()

  const { data: watchData } = await serviceClient
    .from('watch_events')
    .select('watched_seconds')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  const totalWatchSeconds = watchData?.reduce((s, w) => s + (w.watched_seconds ?? 0), 0) ?? 0
  const deliveryMinutes = Math.ceil(totalWatchSeconds / 60)

  // Get Stripe revenue for this month
  let monthlyRevenueCents = 0
  try {
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(new Date(y, m - 1, 1).getTime() / 1000),
        lt: Math.floor(new Date(y, m, 1).getTime() / 1000),
      },
      limit: 100,
    })
    monthlyRevenueCents = charges.data
      .filter(c => c.paid && !c.refunded)
      .reduce((s, c) => s + c.amount, 0)
  } catch {
    // Stripe unavailable in dev
  }

  // Check hard stop setting
  const { data: hardStopSetting } = await serviceClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'hard_stop_enabled')
    .single()

  const hardStopEnabled = hardStopSetting?.value === 'true'

  // Mux paid tier pricing: $0.0088/min delivered
  const estimatedMuxCostCents = Math.round(deliveryMinutes * 0.0088 * 100)

  return NextResponse.json({
    deliveryMinutes,
    deliveryLimit: 100_000,
    assetCount,
    assetLimit: 10,
    monthlyRevenueCents,
    estimatedMuxCostCents,
    hardStopEnabled,
  })
}
