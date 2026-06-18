import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { isAdminEmail, currentMonth } from '@/lib/utils'
import { sendEmail, payoutSentEmail } from '@/lib/email'
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
  const [y, m] = month.split('-').map(Number)

  // Aggregate watch_events for this month
  const { data: watchData } = await serviceClient
    .from('watch_events')
    .select('film_id, watched_seconds')
    .eq('month', month)

  const perFilm: Record<string, number> = {}
  let totalSeconds = 0
  for (const row of watchData ?? []) {
    perFilm[row.film_id] = (perFilm[row.film_id] ?? 0) + row.watched_seconds
    totalSeconds += row.watched_seconds
  }

  // Accurate net subscription revenue from paid invoices (not raw charges).
  const { netCents: monthlyRevenueCents } = await getMonthlyRevenue(y, m)

  const filmPool = (monthlyRevenueCents / 100) * 0.5

  // Get films
  const filmIds = Object.keys(perFilm)
  const { data: films } = await serviceClient
    .from('films')
    .select('id, title, director')
    .in('id', filmIds.length > 0 ? filmIds : ['00000000-0000-0000-0000-000000000000'])

  // Check paid status from filmmaker_payouts
  const { data: existingPayouts } = await serviceClient
    .from('filmmaker_payouts')
    .select('film_id, paid')
    .eq('month', month)

  const paidMap: Record<string, boolean> = {}
  for (const p of existingPayouts ?? []) paidMap[p.film_id] = p.paid

  const filmMap: Record<string, { title: string; director: string }> = {}
  for (const f of films ?? []) filmMap[f.id] = { title: f.title, director: f.director }

  const payouts = filmIds
    .filter(id => filmMap[id])
    .map(id => {
      const watchSeconds = perFilm[id] ?? 0
      const watchPct = totalSeconds > 0 ? (watchSeconds / totalSeconds) * 100 : 0
      const payoutAmount = totalSeconds > 0 ? filmPool * (watchSeconds / totalSeconds) : 0
      return {
        filmId: id,
        title: filmMap[id].title,
        director: filmMap[id].director,
        watchSeconds,
        watchPct,
        payoutAmount,
        paid: paidMap[id] ?? false,
      }
    })
    .sort((a, b) => b.watchSeconds - a.watchSeconds)

  return NextResponse.json({ payouts, month, totalRevenueCents: monthlyRevenueCents })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('email').eq('id', user.id).single()
  if (!profile || !isAdminEmail(profile.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { filmId, month, paid } = await req.json()
  const serviceClient = createServiceClient()

  await serviceClient
    .from('filmmaker_payouts')
    .upsert({ film_id: filmId, month, paid, total_watch_seconds: 0, payout_amount: 0 }, {
      onConflict: 'film_id,month',
    })
    .select()

  return NextResponse.json({ ok: true })
}

// Run Monthly Payouts: compute each filmmaker's share of 50% of net revenue by
// watch-time proportion, transfer via Stripe Connect, flag unconnected, log to
// filmmaker_payouts, and email a breakdown. Idempotent-ish: re-running recomputes
// amounts; already-paid rows still attempt transfer only for connected makers.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('email').eq('id', user.id).single()
  if (!profile || !isAdminEmail(profile.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const month = typeof body.month === 'string' && body.month ? body.month : currentMonth()
  const [y, m] = month.split('-').map(Number)

  const serviceClient = createServiceClient()

  const { data: watchData } = await serviceClient
    .from('watch_events')
    .select('film_id, watched_seconds')
    .eq('month', month)

  const perFilm: Record<string, number> = {}
  let totalSeconds = 0
  for (const w of watchData ?? []) {
    perFilm[w.film_id] = (perFilm[w.film_id] ?? 0) + w.watched_seconds
    totalSeconds += w.watched_seconds
  }

  // Accurate net subscription revenue from paid invoices (not raw charges).
  const { netCents: revenueCents } = await getMonthlyRevenue(y, m)
  const filmPoolCents = Math.floor(revenueCents * 0.5)

  const filmIds = Object.keys(perFilm)
  const films = filmIds.length
    ? (await serviceClient.from('films').select('id, title, filmmaker_id').in('id', filmIds)).data ?? []
    : []

  type Entry = { films: { id: string; title: string; secs: number; amountCents: number }[]; totalCents: number }
  const byMaker = new Map<string, Entry>()
  for (const f of films) {
    if (!f.filmmaker_id) continue
    const secs = perFilm[f.id] ?? 0
    const amountCents = totalSeconds > 0 ? Math.round(filmPoolCents * (secs / totalSeconds)) : 0
    await serviceClient.from('filmmaker_payouts').upsert(
      { film_id: f.id, month, total_watch_seconds: secs, payout_amount: amountCents / 100 },
      { onConflict: 'film_id,month' },
    )
    const e = byMaker.get(f.filmmaker_id) ?? { films: [], totalCents: 0 }
    e.films.push({ id: f.id, title: f.title, secs, amountCents })
    e.totalCents += amountCents
    byMaker.set(f.filmmaker_id, e)
  }

  // Idempotency guard: which films are already marked paid for this month, so a
  // second "Run Monthly Payouts" can never double-transfer to the same filmmaker.
  const { data: paidRows } = await serviceClient
    .from('filmmaker_payouts')
    .select('film_id, paid')
    .eq('month', month)
  const paidFilmIds = new Set((paidRows ?? []).filter(p => p.paid).map(p => p.film_id))

  const results: { filmmaker: string; amountUsd: number; status: string; error?: string }[] = []
  for (const [makerId, entry] of byMaker) {
    const { data: maker } = await serviceClient
      .from('users')
      .select('full_name, contact_email, email, stripe_connect_account_id, connect_payouts_enabled')
      .eq('id', makerId)
      .single()
    const name = maker?.full_name || maker?.email || 'unknown'
    const amountUsd = entry.totalCents / 100

    // Already paid this month (by a prior run or a manual override) -> skip.
    if (entry.films.some(f => paidFilmIds.has(f.id))) {
      results.push({ filmmaker: name, amountUsd, status: 'already paid this month' })
      continue
    }
    if (entry.totalCents <= 0) { results.push({ filmmaker: name, amountUsd: 0, status: 'skipped (no earnings)' }); continue }
    if (!maker?.connect_payouts_enabled || !maker.stripe_connect_account_id) {
      results.push({ filmmaker: name, amountUsd, status: 'not connected — payout pending' })
      continue
    }
    try {
      await stripe.transfers.create({
        amount: entry.totalCents,
        currency: 'usd',
        destination: maker.stripe_connect_account_id,
        description: `Crowdcult payout ${month}`,
        metadata: { month, filmmaker_id: makerId },
      })
      await serviceClient.from('filmmaker_payouts').update({ paid: true }).in('film_id', entry.films.map(f => f.id)).eq('month', month)
      const to = maker.contact_email || maker.email
      if (to) {
        const rows = entry.films.map(f => ({ title: f.title, watchMinutes: Math.floor(f.secs / 60), amountUsd: f.amountCents / 100 }))
        await sendEmail({ to, ...payoutSentEmail(maker.full_name || 'there', month, amountUsd, rows) })
      }
      results.push({ filmmaker: name, amountUsd, status: 'paid' })
    } catch (err) {
      results.push({ filmmaker: name, amountUsd, status: 'error', error: err instanceof Error ? err.message : 'transfer failed' })
    }
  }

  return NextResponse.json({ month, revenueCents, filmPoolCents, results })
}
