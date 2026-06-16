import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BrowseClient from './BrowseClient'

export default async function BrowsePage() {
  const supabase = await createClient()

  // Platform kill switch check
  const { data: setting } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_enabled')
    .single()

  if (setting?.value === 'false') redirect('/maintenance')

  return <BrowseClient />
}
