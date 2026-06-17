import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSafeHttpUrl, isValidEmail } from '@/lib/utils'
import { rateLimit, clientIp } from '@/lib/rate-limit'

// Max lengths per field — prevents multi-MB rows from bloating the DB.
const LIMITS = {
  name: 120,
  email: 200,
  title: 200,
  director: 120,
  directorBio: 2000,
  genre: 50,
  description: 5000,
  festivalLaurels: 300,
  filmLink: 500,
  message: 2000,
}

export async function POST(req: NextRequest) {
  // 5 submissions per IP per hour.
  if (!rateLimit(`submit:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const name = str(body.name)
  const email = str(body.email)
  const title = str(body.title)
  const director = str(body.director)
  const directorBio = str(body.directorBio)
  const genre = str(body.genre)
  const description = str(body.description)
  const festivalLaurels = str(body.festivalLaurels)
  const filmLink = str(body.filmLink)
  const message = str(body.message)

  if (!name || !email || !title || !director || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Length caps
  const fields = { name, email, title, director, directorBio, genre, description, festivalLaurels, filmLink, message }
  for (const [key, value] of Object.entries(fields)) {
    if (value.length > LIMITS[key as keyof typeof LIMITS]) {
      return NextResponse.json({ error: `${key} is too long` }, { status: 400 })
    }
  }

  // Only accept http(s) links — never javascript:/data: etc.
  if (filmLink && !isSafeHttpUrl(filmLink)) {
    return NextResponse.json({ error: 'Film link must be a valid http(s) URL' }, { status: 400 })
  }

  const yearNum = Number(body.year)
  const runtimeNum = Number(body.runtimeMinutes)
  const year = Number.isInteger(yearNum) && yearNum >= 1880 && yearNum <= 2100 ? yearNum : null
  const runtimeMinutes = Number.isInteger(runtimeNum) && runtimeNum > 0 && runtimeNum <= 1000 ? runtimeNum : null

  const serviceClient = createServiceClient()

  const { error } = await serviceClient.from('film_submissions').insert({
    name,
    email,
    title,
    director,
    director_bio: directorBio || null,
    year,
    runtime_minutes: runtimeMinutes,
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
