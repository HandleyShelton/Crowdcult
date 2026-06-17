import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubmitForm from './SubmitForm'

// Submit is gated:
//  - not logged in        -> sign up (then routed back here)
//  - logged in, not a fm   -> frictionless one-field upgrade
//  - filmmaker             -> the native submission form
export default async function SubmitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup?next=/submit')

  const { data: profile } = await supabase
    .from('users')
    .select('is_filmmaker, full_name, contact_email, email')
    .eq('id', user.id)
    .single()

  if (!profile?.is_filmmaker) redirect('/filmmaker/upgrade')

  return (
    <SubmitForm
      director={profile.full_name ?? ''}
      contactEmail={profile.contact_email ?? profile.email ?? ''}
    />
  )
}
