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
    <div className="group relative overflow-hidden rounded-lg bg-surface border border-line hover:border-accent/60 transition-colors duration-200 cursor-pointer">
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={thumbnailSrc}
          alt={film.title}
          fill
          // Mux/Supabase already serve CDN-optimized images — skip Vercel's
          // image optimization to avoid billed transformations on every poster.
          unoptimized
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${locked ? 'blur-md brightness-50' : ''}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <div className="text-center font-mono border border-accent/40 rounded-md px-3 py-2 bg-surface/60">
              <div className="text-accent text-xs lowercase tracking-widest">locked</div>
              <span className="text-muted text-[9px] lowercase tracking-widest">subscribe to watch</span>
            </div>
          </div>
        )}
        {film.festival_laurels && !locked && (
          <div className="absolute top-0 left-0 right-0 bg-accent/90 px-2 py-0.5">
            <span className="text-background text-[10px] font-mono lowercase tracking-wider">★ {film.festival_laurels}</span>
          </div>
        )}
        {film.genre && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-background/80 border border-line text-muted text-[10px] font-mono px-2 py-0.5 rounded lowercase tracking-wider">
              {film.genre}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-mono text-ink text-xs leading-tight mb-1 lowercase tracking-wide group-hover:text-accent transition-colors">
          {film.title}
        </h3>
        <p className="text-muted text-[10px] font-mono">{film.director}</p>
        <div className="flex items-center gap-2 mt-1 text-muted/70 text-[10px] font-mono">
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
