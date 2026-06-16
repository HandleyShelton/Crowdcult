import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail, currentMonth } from '@/lib/utils'
import { mux } from '@/lib/mux'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('email').eq('id', user.id).single()
  if (!profile || !isAdminEmail(profile.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = createServiceClient()
  const month = currentMonth()
  const [y, m] = month.split('-').map(Number)
  const monthStart = new Date(y, m - 1, 1).toISOString()
  const monthEnd = new Date(y, m, 1).toISOString()

  const { data: films } = await serviceClient
    .from('films')
    .select('id, title, director, year, runtime_minutes, genre, status, created_at')
    .order('created_at', { ascending: false })

  const { data: watchData } = await serviceClient
    .from('watch_events')
    .select('film_id, watched_seconds')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  const watchMap: Record<string, number> = {}
  for (const w of watchData ?? []) {
    watchMap[w.film_id] = (watchMap[w.film_id] ?? 0) + w.watched_seconds
  }

  const filmsWithWatch = (films ?? []).map(f => ({
    ...f,
    total_watch_seconds: watchMap[f.id] ?? 0,
  }))

  return NextResponse.json({ films: filmsWithWatch })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('email').eq('id', user.id).single()
  if (!profile || !isAdminEmail(profile.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const serviceClient = createServiceClient()

  // Get mux asset id to delete from Mux
  const { data: film } = await serviceClient
    .from('films')
    .select('mux_asset_id')
    .eq('id', id)
    .single()

  if (film?.mux_asset_id) {
    try {
      await mux.video.assets.delete(film.mux_asset_id)
    } catch {
      // Log but don't fail if Mux deletion fails
      console.error('Failed to delete Mux asset:', film.mux_asset_id)
    }
  }

  await serviceClient.from('films').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
