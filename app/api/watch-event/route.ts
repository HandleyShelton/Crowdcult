import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { currentMonth } from '@/lib/utils'
import { HARD_STOP_THRESHOLD } from '@/lib/limits'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { filmId, watchedSeconds } = await req.json()

  if (!filmId || typeof watchedSeconds !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Upsert watch event
  const { data: existing } = await supabase
    .from('watch_events')
    .select('id, watched_seconds')
    .eq('user_id', user.id)
    .eq('film_id', filmId)
    .single()

  if (existing) {
    if (watchedSeconds > existing.watched_seconds) {
      await supabase
        .from('watch_events')
        .update({ watched_seconds: Math.floor(watchedSeconds) })
        .eq('id', existing.id)
    }
  } else {
    await supabase.from('watch_events').insert({
      user_id: user.id,
      film_id: filmId,
      watched_seconds: Math.floor(watchedSeconds),
    })
  }

  // Auto-check delivery minutes and toggle hard stop
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

  return NextResponse.json({ ok: true })
}
