import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Legit clients report every ~30s. 30/min per user is generous but caps floods.
  if (!rateLimit(`watch:${user.id}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { filmId, watchedSeconds } = await req.json()

  if (!filmId || typeof watchedSeconds !== 'number' || !Number.isFinite(watchedSeconds) || watchedSeconds < 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: film } = await supabase
    .from('films')
    .select('id, runtime_minutes')
    .eq('id', filmId)
    .eq('status', 'ready')
    .single()
  if (!film) return NextResponse.json({ error: 'Film not found' }, { status: 404 })

  // Cap reported watch time to the film's runtime (+1 min slack). Without this
  // a client could report an arbitrarily large value and inflate its share of
  // the pro-rata payout pool. Fall back to a 6h ceiling if runtime is unknown.
  const maxSeconds = film.runtime_minutes ? film.runtime_minutes * 60 + 60 : 6 * 60 * 60
  const clamped = Math.floor(Math.min(watchedSeconds, maxSeconds))

  // Upsert watch event
  const { data: existing } = await supabase
    .from('watch_events')
    .select('id, watched_seconds')
    .eq('user_id', user.id)
    .eq('film_id', filmId)
    .single()

  if (existing) {
    if (clamped > existing.watched_seconds) {
      await supabase
        .from('watch_events')
        .update({ watched_seconds: clamped })
        .eq('id', existing.id)
    }
  } else {
    await supabase.from('watch_events').insert({
      user_id: user.id,
      film_id: filmId,
      watched_seconds: clamped,
    })
  }

  return NextResponse.json({ ok: true })
}
