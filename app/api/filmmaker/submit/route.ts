import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSafeHttpUrl } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail, submissionReceivedEmail } from '@/lib/email'

const LIMITS = {
  title: 200, director: 120, coDirectors: 300, genre: 50, description: 5000,
  directorBio: 2000, festivalLaurels: 300, contentWarnings: 500, filmLink: 500, posterUrl: 500,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  if (!(await rateLimit(`fsubmit:${user.id}`, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 })
  }

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('is_filmmaker, full_name, contact_email, email')
    .eq('id', user.id)
    .single()

  if (!profile?.is_filmmaker) {
    return NextResponse.json({ error: 'Filmmaker account required' }, { status: 403 })
  }

  const body = await req.json()
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const fields = {
    title: str(body.title),
    director: str(body.director) || profile.full_name || '',
    coDirectors: str(body.coDirectors),
    genre: str(body.genre),
    description: str(body.description),
    directorBio: str(body.directorBio),
    festivalLaurels: str(body.festivalLaurels),
    contentWarnings: str(body.contentWarnings),
    filmLink: str(body.filmLink),
    posterUrl: str(body.posterUrl),
  }

  if (!fields.title || !fields.director || !fields.description || !fields.filmLink) {
    return NextResponse.json({ error: 'Title, director, synopsis, and film link are required' }, { status: 400 })
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value.length > LIMITS[key as keyof typeof LIMITS]) {
      return NextResponse.json({ error: `${key} is too long` }, { status: 400 })
    }
  }
  if (!isSafeHttpUrl(fields.filmLink)) {
    return NextResponse.json({ error: 'Film link must be a valid http(s) URL' }, { status: 400 })
  }
  if (fields.posterUrl && !isSafeHttpUrl(fields.posterUrl)) {
    return NextResponse.json({ error: 'Poster URL is invalid' }, { status: 400 })
  }

  const yearNum = Number(body.year)
  const runtimeNum = Number(body.runtimeMinutes)
  const year = Number.isInteger(yearNum) && yearNum >= 1880 && yearNum <= 2100 ? yearNum : null
  const runtimeMinutes = Number.isInteger(runtimeNum) && runtimeNum > 0 && runtimeNum <= 1000 ? runtimeNum : null

  const contactEmail = profile.contact_email || profile.email

  const { error } = await serviceClient.from('film_submissions').insert({
    filmmaker_id: user.id,
    name: profile.full_name || fields.director,
    email: contactEmail,
    title: fields.title,
    director: fields.director,
    co_directors: fields.coDirectors || null,
    director_bio: fields.directorBio || null,
    year,
    runtime_minutes: runtimeMinutes,
    genre: fields.genre || null,
    description: fields.description,
    festival_laurels: fields.festivalLaurels || null,
    content_warnings: fields.contentWarnings || null,
    film_link: fields.filmLink,
    poster_url: fields.posterUrl || null,
    status: 'pending',
  })

  if (error) {
    console.error('filmmaker submit error:', error)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }

  // Confirmation email (best-effort).
  const email = submissionReceivedEmail(profile.full_name || fields.director, fields.title)
  await sendEmail({ to: contactEmail, ...email })

  return NextResponse.json({ ok: true })
}
