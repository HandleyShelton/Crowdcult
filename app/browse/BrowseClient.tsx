'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import FilmCard from '@/components/FilmCard'

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
  const [selectedGenre, setSelectedGenre] = useState('All')
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
    if (selectedGenre !== 'All') result = result.filter(f => f.genre === selectedGenre)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(f => f.title.toLowerCase().includes(q) || f.director.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [films, selectedGenre, search])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="border-b border-line pb-4 mb-8">
        <h1 className="font-display text-5xl tracking-wider text-ink">BROWSE FILMS</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="search"
          placeholder="Search by title or director..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-background border border-white/10 focus:border-accent px-4 py-2 text-ink placeholder-gray-700 focus:outline-none flex-1 text-sm font-mono"
        />
        <div className="flex gap-2 flex-wrap">
          {['All', ...genres].map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors border ${
                selectedGenre === g
                  ? 'bg-accent border-accent text-ink'
                  : 'bg-background border-white/10 text-gray-400 hover:border-accent hover:text-ink'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-surface animate-pulse aspect-[2/3] border border-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-mono text-gray-500 uppercase tracking-widest text-sm">{'// NO FILMS FOUND'}</p>
          <p className="font-mono text-xs text-gray-700 mt-2">Try a different search or genre filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(film => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      )}
    </div>
  )
}
