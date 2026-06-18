import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/utils'
import { sendEmail, filmApprovedEmail, filmRejectedEmail } from '@/lib/email'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('users').select('email').eq('id', user.id).single()
  return !!profile && isAdminEmail(profile.email)
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceClient = createServiceClient()
  const statusFilter = req.nextUrl.searchParams.get('status')

  let query = serviceClient.from('film_submissions').select('*').order('created_at', { ascending: false })
  if (statusFilter) query = query.eq('status', statusFilter)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submissions: data })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status, rejectionReason, notes } = await req.json()
  if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 })
  }
  if (status === 'rejected' && (typeof rejectionReason !== 'string' || rejectionReason.trim().length < 3)) {
    return NextResponse.json({ error: 'A rejection reason is required' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data: sub } = await serviceClient
    .from('film_submissions')
    .select('name, email, title')
    .eq('id', id)
    .single()
  if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

  const update: Record<string, unknown> = { status }
  if (notes !== undefined) update.notes = notes ?? null
  if (status === 'rejected') update.rejection_reason = rejectionReason.trim()

  const { error } = await serviceClient.from('film_submissions').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the filmmaker (best-effort).
  if (status === 'approved') {
    const email = filmApprovedEmail(sub.name, sub.title)
    await sendEmail({ to: sub.email, ...email })
  } else if (status === 'rejected') {
    const email = filmRejectedEmail(sub.name, sub.title, rejectionReason.trim())
    await sendEmail({ to: sub.email, ...email })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // FK films.submission_id is ON DELETE SET NULL, so deleting a submission
  // never removes an uploaded film — it just unlinks it.
  const serviceClient = createServiceClient()
  const { error } = await serviceClient.from('film_submissions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
