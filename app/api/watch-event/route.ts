import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { currentMonth } from '@/lib/utils'

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

  return NextResponse.json({ ok: true })
}
