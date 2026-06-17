import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/utils'

// List filmmaker accounts for the admin upload selector.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('email').eq('id', user.id).single()
  if (!profile || !isAdminEmail(profile.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = createServiceClient()
  const { data } = await serviceClient
    .from('users')
    .select('id, full_name, contact_email, email')
    .eq('is_filmmaker', true)
    .order('full_name', { ascending: true })

  const filmmakers = (data ?? []).map(u => ({
    id: u.id,
    name: u.full_name ?? u.email,
    email: u.contact_email ?? u.email,
  }))
  return NextResponse.json({ filmmakers })
}
