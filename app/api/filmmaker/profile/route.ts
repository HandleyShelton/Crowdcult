import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isValidEmail } from '@/lib/utils'

// Edit filmmaker profile (full name + contact email).
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { fullName, contactEmail } = await req.json()
  if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.length > 120) {
    return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 })
  }
  if (typeof contactEmail !== 'string' || !isValidEmail(contactEmail) || contactEmail.length > 200) {
    return NextResponse.json({ error: 'Please enter a valid contact email' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('users')
    .update({ full_name: fullName.trim(), contact_email: contactEmail.trim() })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Could not update profile' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
