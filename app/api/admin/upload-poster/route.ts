import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('email').eq('id', user.id).single()
  if (!profile || !isAdminEmail(profile.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  const filmId = formData.get('filmId') as string

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  const allowed = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Poster must be a PNG, JPEG, or WebP image' }, { status: 400 })
  }
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Poster must be under 8MB' }, { status: 400 })

  const serviceClient = createServiceClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `posters/${filmId ?? Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await serviceClient.storage
    .from('film-assets')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = serviceClient.storage.from('film-assets').getPublicUrl(path)

  if (filmId) {
    await serviceClient.from('films').update({ thumbnail_url: publicUrl }).eq('id', filmId)
  }

  return NextResponse.json({ url: publicUrl })
}
