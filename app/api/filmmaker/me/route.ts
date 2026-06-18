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

  // Submissions owned by this filmmaker.
  const { data: subs } = await serviceClient
    .from('film_submissions')
    .select('id, title, status, rejection_reason, film_id, created_at')
    .eq('filmmaker_id', user.id)
    .order('created_at', { ascending: false })

  // Films owned by this filmmaker — includes ones assigned directly (no submission).
  const { data: ownedFilms } = await serviceClient
    .from('films')
    .select('id, title, is_active')
    .eq('filmmaker_id', user.id)
  const ownedIds = (ownedFilms ?? []).map(f => f.id)

  // Resolve is_active for any films linked from submissions or owned directly.
  const subFilmIds = (subs ?? []).map(s => s.film_id).filter(Boolean) as string[]
  const linkFilmIds = [...new Set([...subFilmIds, ...ownedIds])]
  const linkedFilms = linkFilmIds.length
    ? (await serviceClient.from('films').select('id, is_active').in('id', linkFilmIds)).data ?? []
    : []
  const filmMap = new Map(linkedFilms.map(f => [f.id, f]))

  // Watch totals this month (across all films, for the pro-rata denominator).
  const month = currentMonth()

  const watchByFilm = new Map<string, number>()
  let totalSeconds = 0
  // Payout estimate denominator only; the actual pool is computed in the admin
  // payouts route. Watch time is shown here regardless.
  const filmPoolUsd = 0
  {
    const { data: watch } = await serviceClient
      .from('watch_events')
      .select('film_id, watched_seconds')
      .eq('month', month)
    for (const w of watch ?? []) {
      watchByFilm.set(w.film_id, (watchByFilm.get(w.film_id) ?? 0) + (w.watched_seconds ?? 0))
      totalSeconds += w.watched_seconds ?? 0
    }
  }

  const estimate = (filmId: string | null) => {
    const watchSeconds = filmId ? (watchByFilm.get(filmId) ?? 0) : 0
    const estPayoutUsd = totalSeconds > 0 ? filmPoolUsd * (watchSeconds / totalSeconds) : 0
    return { watchSeconds, estPayoutUsd }
  }

  type Item = { id: string; title: string; status: string; rejectionReason: string | null; filmId: string | null; watchSeconds: number; estPayoutUsd: number }
  const items: Item[] = []
  const shownFilmIds = new Set<string>()

  for (const s of subs ?? []) {
    const film = s.film_id ? filmMap.get(s.film_id) : null
    let derived: string = s.status // pending | approved | rejected
    if (film) derived = film.is_active ? 'active' : 'inactive'
    if (s.film_id) shownFilmIds.add(s.film_id)
    const { watchSeconds, estPayoutUsd } = estimate(s.film_id ?? null)
    items.push({ id: s.id, title: s.title, status: derived, rejectionReason: s.rejection_reason ?? null, filmId: s.film_id ?? null, watchSeconds, estPayoutUsd })
  }

  // Directly-assigned films not already represented by a submission above.
  for (const f of ownedFilms ?? []) {
    if (shownFilmIds.has(f.id)) continue
    const { watchSeconds, estPayoutUsd } = estimate(f.id)
    items.push({ id: f.id, title: f.title, status: f.is_active ? 'active' : 'inactive', rejectionReason: null, filmId: f.id, watchSeconds, estPayoutUsd })
  }

  // Payout history (grouped by month) across all films this filmmaker owns.
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
