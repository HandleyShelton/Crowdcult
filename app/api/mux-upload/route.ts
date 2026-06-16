import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { mux } from '@/lib/mux'
import { isAdminEmail } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile || !isAdminEmail(profile.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, director, directorBio, year, runtimeMinutes, genre, description, festivalLaurels } = body

  // Insert film record first to get the ID to pass as passthrough
  const serviceClient = createServiceClient()
  const { data: film, error: dbError } = await serviceClient
    .from('films')
    .insert({
      title,
      director,
      director_bio: directorBio,
      year: year || null,
      runtime_minutes: runtimeMinutes || null,
      genre: genre || null,
      description: description || null,
      festival_laurels: festivalLaurels || null,
      status: 'processing',
    })
    .select('id')
    .single()

  if (dbError || !film) {
    return NextResponse.json({ error: 'Failed to create film record' }, { status: 500 })
  }

  // Create Mux direct upload URL, passing the film DB id as passthrough
  let upload
  try {
    upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        passthrough: film.id,
      },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? '*',
    })
  } catch (err) {
    // Clean up the film record if Mux fails
    await serviceClient.from('films').delete().eq('id', film.id)
    const message = err instanceof Error ? err.message : 'Mux upload creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ uploadUrl: upload.url, filmId: film.id })
}
