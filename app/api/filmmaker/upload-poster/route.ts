import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Optional poster upload for filmmaker submissions -> Supabase Storage.
// Requires a public bucket named "film-assets". Non-fatal for the caller:
// if it errors, the submission can still proceed without a poster.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient.from('users').select('is_filmmaker').eq('id', user.id).single()
  if (!profile?.is_filmmaker) return NextResponse.json({ error: 'Filmmaker account required' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Poster must be under 8MB' }, { status: 400 })

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `posters/${user.id}-${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await serviceClient.storage
    .from('film-assets')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = serviceClient.storage.from('film-assets').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
