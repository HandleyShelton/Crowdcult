import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail, currentMonth } from '@/lib/utils'
import { mux } from '@/lib/mux'
import { HARD_STOP_THRESHOLD, DELIVERY_LIMIT } from '@/lib/limits'
import { getMonthlyRevenue } from '@/lib/revenue'

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

  // Asset count
  let assetCount = 0
  try {
    await mux.video.assets.list({ limit: 1 })
    const { count } = await serviceClient
      .from('films')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ready')
    assetCount = count ?? 0
  } catch {
    const { count } = await serviceClient.from('films').select('*', { count: 'exact', head: true })
    assetCount = count ?? 0
  }

  // Delivery minutes estimated from watch_events
  const [y, m] = month.split('-').map(Number)

  const { data: watchData } = await serviceClient
    .from('watch_events')
    .select('watched_seconds')
    .eq('month', month)

  const totalWatchSeconds = watchData?.reduce((s, w) => s + (w.watched_seconds ?? 0), 0) ?? 0
  const deliveryMinutes = Math.ceil(totalWatchSeconds / 60)

  // Auto-manage hard stop based on delivery minutes
  const shouldHardStop = deliveryMinutes >= HARD_STOP_THRESHOLD
  await serviceClient
    .from('platform_settings')
    .upsert({ key: 'hard_stop_enabled', value: shouldHardStop.toString() }, { onConflict: 'key' })

  // Stripe revenue
  // Accurate net subscription revenue from paid invoices (not raw charges).
  const { netCents: monthlyRevenueCents } = await getMonthlyRevenue(y, m)

  const estimatedMuxCostCents = Math.round(deliveryMinutes * 0.0088 * 100)

  return NextResponse.json({
    deliveryMinutes,
    deliveryLimit: DELIVERY_LIMIT,
    assetCount,
    assetLimit: 10,
    monthlyRevenueCents,
    estimatedMuxCostCents,
    hardStopEnabled: shouldHardStop,
  })
}
