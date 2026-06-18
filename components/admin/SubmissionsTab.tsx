/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import { isSafeHttpUrl } from '@/lib/utils'

interface Submission {
  id: string
  name: string
  email: string
  title: string
  director: string
  director_bio: string | null
  year: number | null
  runtime_minutes: number | null
  genre: string | null
  description: string
  festival_laurels: string | null
  film_link: string | null
  message: string | null
  co_directors: string | null
  content_warnings: string | null
  poster_url: string | null
  rejection_reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  created_at: string
}

const STATUS_COLORS = {
  pending: 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30',
  approved: 'bg-green-900/30 text-green-300 border-green-500/30',
  rejected: 'bg-red-900/30 text-red-300 border-red-500/30',
}

export default function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/submissions')
    const json = await res.json()
    const subs: Submission[] = json.submissions ?? []
    setSubmissions(subs)
    const initialNotes: Record<string, string> = {}
    for (const s of subs) initialNotes[s.id] = s.rejection_reason ?? s.notes ?? ''
    setNotes(initialNotes)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    if (status === 'rejected' && (!notes[id] || notes[id].trim().length < 3)) {
      alert('Please enter a rejection reason — it will be emailed to the filmmaker.')
      return
    }
    setSaving(id)
    await fetch('/api/admin/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        status === 'rejected'
          ? { id, status, rejectionReason: notes[id] }
          : { id, status, notes: notes[id] },
      ),
    })
    await load()
    setSaving(null)
  }

  async function deleteSubmission(id: string) {
    if (!confirm('Delete this submission permanently? This cannot be undone. Any uploaded film stays — it just unlinks.')) return
    setSaving(id)
    await fetch(`/api/admin/submissions?id=${id}`, { method: 'DELETE' })
    await load()
    setSaving(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const pending = submissions.filter(s => s.status === 'pending')
  const reviewed = submissions.filter(s => s.status !== 'pending')

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Film Submissions</h2>
        <span className="text-sm text-gray-400">{pending.length} pending</span>
      </div>

      {submissions.length === 0 && (
        <p className="text-gray-400">No submissions yet.</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pending review</h3>
          {pending.map(s => (
            <SubmissionCard
              key={s.id}
              sub={s}
              expanded={expanded === s.id}
              onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
              notes={notes[s.id] ?? ''}
              onNotesChange={v => setNotes(n => ({ ...n, [s.id]: v }))}
              onApprove={() => updateStatus(s.id, 'approved')}
              onReject={() => updateStatus(s.id, 'rejected')}
              onDelete={() => deleteSubmission(s.id)}
              saving={saving === s.id}
            />
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Reviewed</h3>
          {reviewed.map(s => (
            <SubmissionCard
              key={s.id}
              sub={s}
              expanded={expanded === s.id}
              onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
              notes={notes[s.id] ?? ''}
              onNotesChange={v => setNotes(n => ({ ...n, [s.id]: v }))}
              onApprove={() => updateStatus(s.id, 'approved')}
              onReject={() => updateStatus(s.id, 'rejected')}
              onDelete={() => deleteSubmission(s.id)}
              saving={saving === s.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SubmissionCard({
  sub,
  expanded,
  onToggle,
  notes,
  onNotesChange,
  onApprove,
  onReject,
  onDelete,
  saving,
}: {
  sub: Submission
  expanded: boolean
  onToggle: () => void
  notes: string
  onNotesChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  onDelete: () => void
  saving: boolean
}) {
  return (
    <div className="bg-surface rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{sub.title}</p>
            <p className="text-sm text-gray-400">{sub.director} · submitted by {sub.name} ({sub.email})</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[sub.status]}`}>
            {sub.status}
          </span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-white/10 pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {sub.year && <Info label="Year" value={String(sub.year)} />}
            {sub.runtime_minutes && <Info label="Runtime" value={`${sub.runtime_minutes} min`} />}
            {sub.genre && <Info label="Genre" value={sub.genre} />}
            <Info label="Submitted" value={new Date(sub.created_at).toLocaleDateString()} />
          </div>

          {sub.co_directors && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Co-directors</p>
              <p className="text-sm text-gray-300">{sub.co_directors}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Synopsis</p>
            <p className="text-sm text-gray-300 leading-relaxed">{sub.description}</p>
          </div>

          {sub.content_warnings && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Content warnings</p>
              <p className="text-sm text-yellow">{sub.content_warnings}</p>
            </div>
          )}

          {sub.poster_url && isSafeHttpUrl(sub.poster_url) && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Poster</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sub.poster_url} alt="poster" className="h-32 rounded border border-line" />
            </div>
          )}

          {sub.director_bio && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Director bio</p>
              <p className="text-sm text-gray-300 leading-relaxed">{sub.director_bio}</p>
            </div>
          )}

          {sub.festival_laurels && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Laurels</p>
              <p className="text-sm text-gray-300">{sub.festival_laurels}</p>
            </div>
          )}

          {sub.film_link && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Film link</p>
              {isSafeHttpUrl(sub.film_link) ? (
                <a
                  href={sub.film_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline break-all"
                >
                  {sub.film_link}
                </a>
              ) : (
                <span className="text-sm text-gray-400 break-all">{sub.film_link} (unsafe link — not clickable)</span>
              )}
            </div>
          )}

          {sub.message && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notes from filmmaker</p>
              <p className="text-sm text-gray-300">{sub.message}</p>
            </div>
          )}

          {sub.status === 'rejected' && sub.rejection_reason && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rejection reason (emailed)</p>
              <p className="text-sm text-pink">{sub.rejection_reason}</p>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
              Rejection reason / notes
            </label>
            <textarea
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              rows={2}
              placeholder="Required if rejecting — this text is emailed to the filmmaker…"
              className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onApprove}
              disabled={saving || sub.status === 'approved'}
              className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : sub.status === 'approved' ? 'Approved' : 'Approve'}
            </button>
            <button
              onClick={onReject}
              disabled={saving || sub.status === 'rejected'}
              className="flex-1 bg-surface-2 hover:bg-white/10 disabled:opacity-40 text-red-400 text-sm font-semibold py-2 rounded-lg border border-red-500/20 transition-colors"
            >
              {saving ? 'Saving…' : sub.status === 'rejected' ? 'Rejected' : 'Reject'}
            </button>
          </div>

          <button
            onClick={onDelete}
            disabled={saving}
            className="w-full text-xs text-gray-500 hover:text-red-400 disabled:opacity-40 uppercase tracking-widest py-1 transition-colors"
          >
            Delete submission
          </button>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
  )
}
