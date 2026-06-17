import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail, currentMonth } from '@/lib/utils'
import { mux } from '@/lib/mux'
import { sendEmail, filmActivatedEmail } from '@/lib/email'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('users').select('email').eq('id', user.id).single()
  return !!profile && isAdminEmail(profile.email)
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceClient = createServiceClient()
  const month = currentMonth()
  const [y, m] = month.split('-').map(Number)
  const monthStart = new Date(y, m - 1, 1).toISOString()
  const monthEnd = new Date(y, m, 1).toISOString()

  const { data: films } = await serviceClient
    .from('films')
    .select('id, title, director, year, runtime_minutes, genre, status, is_active, filmmaker_id, submission_id, created_at')
    .order('created_at', { ascending: false })

  const { data: watchData } = await serviceClient
    .from('watch_events')
    .select('film_id, watched_seconds')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  const watchMap: Record<string, number> = {}
  for (const w of watchData ?? []) watchMap[w.film_id] = (watchMap[w.film_id] ?? 0) + w.watched_seconds

  // Resolve filmmaker name/email + originating submission status.
  const filmmakerIds = [...new Set((films ?? []).map(f => f.filmmaker_id).filter(Boolean))] as string[]
  const submissionIds = [...new Set((films ?? []).map(f => f.submission_id).filter(Boolean))] as string[]

  const makers = filmmakerIds.length
    ? (await serviceClient.from('users').select('id, full_name, contact_email, email').in('id', filmmakerIds)).data ?? []
    : []
  const makerMap = new Map(makers.map(u => [u.id, u]))

  const subs = submissionIds.length
    ? (await serviceClient.from('film_submissions').select('id, status').in('id', submissionIds)).data ?? []
    : []
  const subMap = new Map(subs.map(s => [s.id, s.status]))

  const filmsOut = (films ?? []).map(f => {
    const maker = f.filmmaker_id ? makerMap.get(f.filmmaker_id) : null
    return {
      ...f,
      total_watch_seconds: watchMap[f.id] ?? 0,
      filmmaker_name: maker?.full_name ?? null,
      filmmaker_email: maker?.contact_email ?? maker?.email ?? null,
      submission_status: f.submission_id ? subMap.get(f.submission_id) ?? null : null,
    }
  })

  return NextResponse.json({ films: filmsOut })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, isActive } = await req.json()
  if (!id || typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'Missing id or isActive' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data: film } = await serviceClient
    .from('films')
    .select('id, title, filmmaker_id, is_active')
    .eq('id', id)
    .single()
  if (!film) return NextResponse.json({ error: 'Film not found' }, { status: 404 })

  const wasActive = film.is_active
  await serviceClient.from('films').update({ is_active: isActive }).eq('id', id)

  // First activation -> "your film is live" email.
  if (isActive && !wasActive && film.filmmaker_id) {
    const { data: maker } = await serviceClient
      .from('users').select('full_name, contact_email, email').eq('id', film.filmmaker_id).single()
    const to = maker?.contact_email || maker?.email
    if (to) {
      const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
      const email = filmActivatedEmail(maker?.full_name || 'there', film.title, `${base}/watch/${film.id}`)
      await sendEmail({ to, ...email })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const serviceClient = createServiceClient()
  const { data: film } = await serviceClient.from('films').select('mux_asset_id').eq('id', id).single()

  if (film?.mux_asset_id) {
    try {
      await mux.video.assets.delete(film.mux_asset_id)
    } catch {
      console.error('Failed to delete Mux asset:', film.mux_asset_id)
    }
  }

  await serviceClient.from('films').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
