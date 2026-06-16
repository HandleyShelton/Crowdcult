'use client'

import { useEffect, useState } from 'react'
interface Film {
  id: string
  title: string
  director: string
  year: number
  runtime_minutes: number
  genre: string | null
  status: string
  created_at: string
  total_watch_seconds?: number
}

export default function FilmsTab() {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function loadFilms() {
    setLoading(true)
    const res = await fetch('/api/admin/films')
    const data = await res.json()
    setFilms(data.films ?? [])
    setLoading(false)
  }

  useEffect(() => { loadFilms() }, [])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(id)
    await fetch(`/api/admin/films?id=${id}`, { method: 'DELETE' })
    await loadFilms()
    setDeleting(null)
  }

  function formatWatchTime(seconds?: number): string {
    if (!seconds) return '—'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Films ({films.length})</h2>
      {films.length === 0 ? (
        <p className="text-gray-400">No films uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="pb-3 pr-4 font-medium">Title</th>
                <th className="pb-3 pr-4 font-medium">Director</th>
                <th className="pb-3 pr-4 font-medium">Year</th>
                <th className="pb-3 pr-4 font-medium">Genre</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Watch Time (month)</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {films.map(film => (
                <tr key={film.id} className="hover:bg-white/5">
                  <td className="py-3 pr-4 font-medium text-white">{film.title}</td>
                  <td className="py-3 pr-4 text-gray-300">{film.director}</td>
                  <td className="py-3 pr-4 text-gray-400">{film.year}</td>
                  <td className="py-3 pr-4 text-gray-400">{film.genre ?? '—'}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      film.status === 'ready'
                        ? 'bg-green-900/40 text-green-300'
                        : 'bg-yellow-900/40 text-yellow-300'
                    }`}>
                      {film.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{formatWatchTime(film.total_watch_seconds)}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(film.id, film.title)}
                      disabled={deleting === film.id}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                      {deleting === film.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
