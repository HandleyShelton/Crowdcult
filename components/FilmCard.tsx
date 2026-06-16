import Link from 'next/link'
import Image from 'next/image'
import { formatRuntime } from '@/lib/utils'

interface Film {
  id: string
  title: string
  director: string
  year: number
  runtime_minutes: number
  thumbnail_url: string | null
  mux_playback_id: string | null
  genre: string | null
  festival_laurels: string | null
}

interface FilmCardProps {
  film: Film
  locked?: boolean
  href?: string
}

export default function FilmCard({ film, locked = false, href }: FilmCardProps) {
  const thumbnailSrc = film.thumbnail_url
    ? film.thumbnail_url
    : film.mux_playback_id
    ? `https://image.mux.com/${film.mux_playback_id}/thumbnail.jpg?time=30`
    : '/placeholder-poster.jpg'

  const cardContent = (
    <div className="group relative rounded-lg overflow-hidden bg-surface border border-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer">
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={thumbnailSrc}
          alt={film.title}
          fill
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${locked ? 'blur-md' : ''}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <svg className="w-10 h-10 text-white/70 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <span className="text-white/70 text-xs font-medium">Subscribe to Watch</span>
            </div>
          </div>
        )}
        {film.festival_laurels && !locked && (
          <div className="absolute top-2 left-2">
            <span className="bg-accent text-white text-xs px-2 py-1 rounded font-medium">
              🏆 {film.festival_laurels}
            </span>
          </div>
        )}
        {film.genre && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-black/70 text-white/80 text-xs px-2 py-1 rounded">
              {film.genre}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-white text-sm leading-tight mb-1 group-hover:text-accent transition-colors">
          {film.title}
        </h3>
        <p className="text-gray-400 text-xs">{film.director}</p>
        <div className="flex items-center gap-2 mt-1 text-gray-500 text-xs">
          <span>{film.year}</span>
          {film.runtime_minutes && (
            <>
              <span>·</span>
              <span>{formatRuntime(film.runtime_minutes)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )

  if (locked) return cardContent

  return (
    <Link href={href ?? `/watch/${film.id}`} className="block">
      {cardContent}
    </Link>
  )
}
