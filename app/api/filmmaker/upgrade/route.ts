import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Frictionless viewer -> filmmaker upgrade: one field (full name), one click.
// No payment. A user can be both a subscriber and a filmmaker.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { fullName } = await req.json()
  if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.length > 120) {
    return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('users')
    .update({
      is_filmmaker: true,
      full_name: fullName.trim(),
      contact_email: user.email,
    })
    .eq('id', user.id)

  if (error) {
    console.error('filmmaker upgrade error:', error)
    return NextResponse.json({ error: 'Could not upgrade account' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
