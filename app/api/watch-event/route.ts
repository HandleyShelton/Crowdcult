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

  const { filmId, deltaSeconds } = await req.json()

  if (!filmId || typeof deltaSeconds !== 'number' || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: film } = await supabase
    .from('films')
    .select('id')
    .eq('id', filmId)
    .eq('status', 'ready')
    .eq('is_active', true)
    .single()
  if (!film) return NextResponse.json({ error: 'Film not found' }, { status: 404 })

  // Clients report incremental actual-watched seconds. Reports fire every ~30s,
  // so a legit delta is at most ~35s; cap at 120s to bound any client tampering.
  const delta = Math.min(Math.floor(deltaSeconds), 120)

  // Accumulate into the running total for this user+film.
  const { data: existing } = await supabase
    .from('watch_events')
    .select('id, watched_seconds')
    .eq('user_id', user.id)
    .eq('film_id', filmId)
    .single()

  if (existing) {
    await supabase
      .from('watch_events')
      .update({ watched_seconds: (existing.watched_seconds ?? 0) + delta })
      .eq('id', existing.id)
  } else {
    await supabase.from('watch_events').insert({
      user_id: user.id,
      film_id: filmId,
      watched_seconds: delta,
    })
  }

  return NextResponse.json({ ok: true })
}
