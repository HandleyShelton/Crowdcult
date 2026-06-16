import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signPlaybackToken } from '@/lib/mux'
import VideoPlayer from '@/components/VideoPlayer'
import { formatRuntime } from '@/lib/utils'

async function checkPlatformEnabled(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['platform_enabled', 'hard_stop_enabled'])

  const map: Record<string, string> = {}
  for (const row of settings ?? []) map[row.key] = row.value

  const platformEnabled = map['platform_enabled'] !== 'false'
  const hardStop = map['hard_stop_enabled'] === 'true'
  return platformEnabled && !hardStop
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const ok = await checkPlatformEnabled(supabase)
  if (!ok) redirect('/maintenance')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/watch/${id}`)

  const { data: profile } = await supabase
    .from('users')
    .select('is_subscribed')
    .eq('id', user.id)
    .single()

  if (!profile?.is_subscribed) redirect('/subscribe')

  const { data: film } = await supabase
    .from('films')
    .select('*')
    .eq('id', id)
    .eq('status', 'ready')
    .single()

  if (!film) notFound()

  let playbackToken = ''
  try {
    playbackToken = await signPlaybackToken(film.mux_playback_id)
  } catch {
    // Fall back to unsigned in dev when signing keys aren't configured
  }

  const thumbnailSrc = film.thumbnail_url
    ?? (film.mux_playback_id
      ? `https://image.mux.com/${film.mux_playback_id}/thumbnail.jpg?time=30`
      : null)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <VideoPlayer
        playbackId={film.mux_playback_id}
        token={playbackToken}
        filmId={film.id}
        title={film.title}
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-2">{film.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
            <span>{film.year}</span>
            {film.runtime_minutes && (
              <>
                <span>·</span>
                <span>{formatRuntime(film.runtime_minutes)}</span>
              </>
            )}
            {film.genre && (
              <>
                <span>·</span>
                <span className="bg-surface-2 px-2 py-0.5 rounded text-gray-300">{film.genre}</span>
              </>
            )}
          </div>

          {film.festival_laurels && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg px-4 py-2 mb-4 inline-block">
              <span className="text-accent text-sm font-medium">🏆 {film.festival_laurels}</span>
            </div>
          )}

          <p className="text-gray-300 leading-relaxed text-base">{film.description}</p>
        </div>

        <div className="bg-surface rounded-xl p-6 border border-white/5 h-fit">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Director</p>
          <h2 className="text-lg font-bold mb-3">{film.director}</h2>
          {thumbnailSrc && (
            <div
              className="w-full aspect-video rounded-lg mb-4 bg-surface-2 bg-cover bg-center"
              style={{ backgroundImage: `url(${thumbnailSrc})` }}
            />
          )}
          {film.director_bio && (
            <p className="text-gray-400 text-sm leading-relaxed">{film.director_bio}</p>
          )}
        </div>
      </div>
    </div>
  )
}
