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
  is_active: boolean
  created_at: string
  total_watch_seconds?: number
  filmmaker_name: string | null
  filmmaker_email: string | null
  submission_status: string | null
}

export default function FilmsTab() {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  async function loadFilms() {
    setLoading(true)
    const res = await fetch('/api/admin/films')
    const data = await res.json()
    setFilms(data.films ?? [])
    setLoading(false)
  }

  useEffect(() => { loadFilms() }, [])

  async function toggleActive(film: Film) {
    setBusy(film.id)
    await fetch('/api/admin/films', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: film.id, isActive: !film.is_active }),
    })
    await loadFilms()
    setBusy(null)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setBusy(id)
    await fetch(`/api/admin/films?id=${id}`, { method: 'DELETE' })
    await loadFilms()
    setBusy(null)
  }

  function formatWatchTime(seconds?: number): string {
    if (!seconds) return '—'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h === 0 ? `${m}m` : `${h}h ${m}m`
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
        <p className="text-muted">No films uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="pb-3 pr-4 font-medium">Title</th>
                <th className="pb-3 pr-4 font-medium">Filmmaker</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Live</th>
                <th className="pb-3 pr-4 font-medium">Watch (mo)</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {films.map(film => (
                <tr key={film.id} className="hover:bg-white/5">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-ink">{film.title}</div>
                    <div className="text-xs text-muted">{film.director} · {film.year}</div>
                  </td>
                  <td className="py-3 pr-4">
                    {film.filmmaker_name ? (
                      <div>
                        <div className="text-ink text-xs">{film.filmmaker_name}</div>
                        <div className="text-muted text-[11px]">{film.filmmaker_email}</div>
                      </div>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                      film.status === 'ready' ? 'bg-green/10 text-green' : 'bg-yellow/10 text-yellow'
                    }`}>
                      {film.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => toggleActive(film)}
                      disabled={busy === film.id || film.status !== 'ready'}
                      title={film.status !== 'ready' ? 'Film must finish processing first' : ''}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${
                        film.is_active ? 'bg-green' : 'bg-surface-2'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        film.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-muted">{formatWatchTime(film.total_watch_seconds)}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(film.id, film.title)}
                      disabled={busy === film.id}
                      className="text-pink hover:text-red-400 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                      {busy === film.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted mt-4">
            Only <span className="text-green">Live</span> films appear on the platform. Toggle off to hide a film without deleting it.
          </p>
        </div>
      )}
    </div>
  )
}
