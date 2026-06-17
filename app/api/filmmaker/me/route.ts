import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { currentMonth } from '@/lib/utils'

// Filmmaker self-service data: profile, their submissions (with derived status),
// and per-film watch time + estimated payout for the current month.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const serviceClient = createServiceClient()

  const { data: profile } = await serviceClient
    .from('users')
    .select('is_filmmaker, full_name, contact_email, email, stripe_connect_account_id, connect_payouts_enabled')
    .eq('id', user.id)
    .single()

  if (!profile?.is_filmmaker) {
    return NextResponse.json({ isFilmmaker: false })
  }

  const { data: subs } = await serviceClient
    .from('film_submissions')
    .select('id, title, status, rejection_reason, film_id, created_at')
    .eq('filmmaker_id', user.id)
    .order('created_at', { ascending: false })

  const filmIds = (subs ?? []).map(s => s.film_id).filter(Boolean) as string[]

  const films = filmIds.length
    ? (await serviceClient.from('films').select('id, is_active, mux_playback_id').in('id', filmIds)).data ?? []
    : []
  const filmMap = new Map(films.map(f => [f.id, f]))

  // Watch totals this month for the filmmaker's linked films.
  const month = currentMonth()
  const [y, m] = month.split('-').map(Number)
  const monthStart = new Date(y, m - 1, 1).toISOString()
  const monthEnd = new Date(y, m, 1).toISOString()

  const watchByFilm = new Map<string, number>()
  let totalSeconds = 0
  // Detailed revenue + payout math lives in the admin payouts route; the
  // filmmaker view shows watch time now, and the payout estimate fills in
  // once that pool is computed (Phase 3).
  const filmPoolUsd = 0
  if (filmIds.length) {
    const { data: watch } = await serviceClient
      .from('watch_events')
      .select('film_id, watched_seconds')
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)
    for (const w of watch ?? []) {
      watchByFilm.set(w.film_id, (watchByFilm.get(w.film_id) ?? 0) + (w.watched_seconds ?? 0))
      totalSeconds += w.watched_seconds ?? 0
    }
  }

  const items = (subs ?? []).map(s => {
    const film = s.film_id ? filmMap.get(s.film_id) : null
    let derived: string = s.status // pending | approved | rejected
    if (film) derived = film.is_active ? 'active' : 'inactive'
    const watchSeconds = s.film_id ? (watchByFilm.get(s.film_id) ?? 0) : 0
    const estPayoutUsd = totalSeconds > 0 ? filmPoolUsd * (watchSeconds / totalSeconds) : 0
    return {
      id: s.id,
      title: s.title,
      status: derived,
      rejectionReason: s.rejection_reason ?? null,
      filmId: s.film_id ?? null,
      watchSeconds,
      estPayoutUsd,
    }
  })

  // Payout history (grouped by month) across all films this filmmaker owns.
  const { data: ownedFilms } = await serviceClient.from('films').select('id').eq('filmmaker_id', user.id)
  const ownedIds = (ownedFilms ?? []).map(f => f.id)
  let payoutHistory: { month: string; amountUsd: number; paid: boolean }[] = []
  if (ownedIds.length) {
    const { data: payouts } = await serviceClient
      .from('filmmaker_payouts')
      .select('month, payout_amount, paid')
      .in('film_id', ownedIds)
      .order('month', { ascending: false })
    const byMonth = new Map<string, { month: string; amountUsd: number; paid: boolean }>()
    for (const p of payouts ?? []) {
      const e = byMonth.get(p.month) ?? { month: p.month, amountUsd: 0, paid: true }
      e.amountUsd += Number(p.payout_amount ?? 0)
      e.paid = e.paid && !!p.paid
      byMonth.set(p.month, e)
    }
    payoutHistory = [...byMonth.values()]
  }

  return NextResponse.json({
    isFilmmaker: true,
    profile: {
      fullName: profile.full_name ?? '',
      contactEmail: profile.contact_email ?? profile.email,
      stripeConnected: !!profile.stripe_connect_account_id,
      payoutsEnabled: !!profile.connect_payouts_enabled,
    },
    films: items,
    payoutHistory,
    month,
  })
}
