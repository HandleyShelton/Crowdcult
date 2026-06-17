import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { currentMonth } from '@/lib/utils'
import { HARD_STOP_THRESHOLD } from '@/lib/limits'

// Called on a schedule by Vercel Cron (see vercel.json). Evaluates this month's
// Mux delivery minutes and flips the hard stop on/off automatically, so the 90k
// cap is enforced even when no admin has opened the dashboard.
export async function GET(req: NextRequest) {
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is
  // set. Require it so this endpoint can't be triggered by the public.
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const month = currentMonth()
  const [y, m] = month.split('-').map(Number)
  const monthStart = new Date(y, m - 1, 1).toISOString()
  const monthEnd = new Date(y, m, 1).toISOString()

  const { data: watchData } = await serviceClient
    .from('watch_events')
    .select('watched_seconds')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  const totalSeconds = watchData?.reduce((s, w) => s + (w.watched_seconds ?? 0), 0) ?? 0
  const deliveryMinutes = Math.ceil(totalSeconds / 60)
  const shouldHardStop = deliveryMinutes >= HARD_STOP_THRESHOLD

  await serviceClient
    .from('platform_settings')
    .upsert({ key: 'hard_stop_enabled', value: shouldHardStop.toString() }, { onConflict: 'key' })

  return NextResponse.json({ deliveryMinutes, hardStopEnabled: shouldHardStop })
}
