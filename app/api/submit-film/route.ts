import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, title, director, directorBio, year, runtimeMinutes, genre, description, festivalLaurels, filmLink, message } = body

  if (!name || !email || !title || !director || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { error } = await serviceClient.from('film_submissions').insert({
    name,
    email,
    title,
    director,
    director_bio: directorBio || null,
    year: year ? parseInt(year) : null,
    runtime_minutes: runtimeMinutes ? parseInt(runtimeMinutes) : null,
    genre: genre || null,
    description,
    festival_laurels: festivalLaurels || null,
    film_link: filmLink || null,
    message: message || null,
  })

  if (error) {
    console.error('film_submissions insert error:', error)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
