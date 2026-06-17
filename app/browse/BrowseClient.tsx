'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import FilmCard from '@/components/FilmCard'
import Marquee from '@/components/Marquee'

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

export default function BrowseClient() {
  const [films, setFilms] = useState<Film[]>([])
  const [filtered, setFiltered] = useState<Film[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadFilms() {
      const { data } = await supabase
        .from('films')
        .select('id, title, director, year, runtime_minutes, thumbnail_url, mux_playback_id, genre, festival_laurels')
        .eq('status', 'ready')
        .order('created_at', { ascending: false })

      const list = data ?? []
      setFilms(list)
      setFiltered(list)
      const uniqueGenres = Array.from(new Set(list.map(f => f.genre).filter(Boolean) as string[]))
      setGenres(uniqueGenres)
      setLoading(false)
    }
    loadFilms()
  }, [supabase])

  useEffect(() => {
    let result = films
    if (selectedGenre !== 'all') result = result.filter(f => f.genre === selectedGenre)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(f => f.title.toLowerCase().includes(q) || f.director.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [films, selectedGenre, search])

  return (
    <div>
      <Marquee
        items={['browse the catalog', 'independent media', 'support the makers', 'new films weekly', 'no algorithms']}
        color="text-accent"
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-[0.08em]">
            <span className="text-muted">~/</span>browse<span className="cursor" aria-hidden />
          </h1>
          {!loading && (
            <span className="font-mono text-xs text-muted lowercase tracking-widest">
              {filtered.length} {filtered.length === 1 ? 'film' : 'films'}
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-mono text-sm pointer-events-none">$</span>
            <input
              type="search"
              placeholder="search by title or director..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-line rounded-md focus:border-accent pl-8 pr-4 py-2.5 text-ink placeholder-muted focus:outline-none text-sm font-mono lowercase"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', ...genres].map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`rounded-md px-3 py-1.5 text-xs font-mono lowercase tracking-widest border transition-colors ${
                  selectedGenre === g
                    ? 'bg-accent border-accent text-background font-bold'
                    : 'bg-surface border-line text-muted hover:border-accent hover:text-ink'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-lg animate-pulse aspect-[2/3] border border-line" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-line rounded-lg bg-surface p-12 text-center">
            <p className="font-mono text-sm text-muted lowercase tracking-widest">{'// no films found'}</p>
            <p className="font-mono text-xs text-muted/60 mt-2 lowercase">try a different search or genre filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {filtered.map(film => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
        )}
      </section>

      <Marquee
        items={genres.length > 0 ? genres : ['drama', 'documentary', 'experimental', 'shorts', 'horror', 'sci-fi', 'comedy']}
        color="text-cyan"
        reverse
        speed={36}
      />
    </div>
  )
}
