import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signPlaybackToken } from '@/lib/mux'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('is_subscribed')
    .eq('id', user.id)
    .single()

  if (!profile?.is_subscribed) {
    return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
  }

  const playbackId = req.nextUrl.searchParams.get('playbackId')
  if (!playbackId) return NextResponse.json({ error: 'Missing playbackId' }, { status: 400 })

  const token = await signPlaybackToken(playbackId)
  return NextResponse.json({ token })
}
