import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { isAdminEmail, currentMonth } from '@/lib/utils'

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
  const monthStart = new Date(y, m - 1, 1).toISOString()
  const monthEnd = new Date(y, m, 1).toISOString()

  // Aggregate watch_events per film this month
  const { data: watchData } = await serviceClient
    .from('watch_events')
    .select('film_id, watched_seconds')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  const perFilm: Record<string, number> = {}
  let totalSeconds = 0
  for (const row of watchData ?? []) {
    perFilm[row.film_id] = (perFilm[row.film_id] ?? 0) + row.watched_seconds
    totalSeconds += row.watched_seconds
  }

  // Get Stripe revenue
  let monthlyRevenueCents = 0
  try {
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(new Date(y, m - 1, 1).getTime() / 1000),
        lt: Math.floor(new Date(y, m, 1).getTime() / 1000),
      },
      limit: 100,
    })
    monthlyRevenueCents = charges.data
      .filter(c => c.paid && !c.refunded)
      .reduce((s, c) => s + c.amount, 0)
  } catch {}

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
