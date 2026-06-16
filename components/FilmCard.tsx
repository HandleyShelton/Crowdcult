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
    <div className="group relative overflow-hidden bg-black border border-white/10 hover:border-accent transition-colors duration-200 cursor-pointer">
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={thumbnailSrc}
          alt={film.title}
          fill
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${locked ? 'blur-md brightness-50' : ''}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center font-mono">
              <div className="text-accent text-2xl mb-1">🔒</div>
              <span className="text-white/70 text-[10px] uppercase tracking-widest">SUBSCRIBE</span>
            </div>
          </div>
        )}
        {film.festival_laurels && !locked && (
          <div className="absolute top-0 left-0 right-0 bg-accent px-2 py-0.5">
            <span className="text-white text-[10px] font-mono uppercase tracking-wider">★ {film.festival_laurels}</span>
          </div>
        )}
        {film.genre && (
          <div className="absolute bottom-0 left-0">
            <span className="bg-black border-t border-r border-white/20 text-gray-400 text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider">
              {film.genre}
            </span>
          </div>
        )}
        {/* Red corner accent on hover */}
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-accent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-3 bg-black">
        <h3 className="font-mono text-white text-xs leading-tight mb-1 uppercase tracking-wide group-hover:text-accent transition-colors">
          {film.title}
        </h3>
        <p className="text-gray-600 text-[10px] font-mono">{film.director}</p>
        <div className="flex items-center gap-2 mt-1 text-gray-700 text-[10px] font-mono">
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
