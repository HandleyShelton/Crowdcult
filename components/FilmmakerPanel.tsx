'use client'

import { useEffect, useState } from 'react'

interface FilmItem {
  id: string
  title: string
  status: 'pending' | 'approved' | 'active' | 'inactive' | 'rejected'
  rejectionReason: string | null
  filmId: string | null
  watchSeconds: number
  estPayoutUsd: number
}

interface PayoutHistory { month: string; amountUsd: number; paid: boolean }

interface FilmmakerData {
  isFilmmaker: boolean
  profile?: { fullName: string; contactEmail: string; stripeConnected: boolean; payoutsEnabled: boolean }
  films?: FilmItem[]
  payoutHistory?: PayoutHistory[]
  month?: string
}

const STATUS_STYLE: Record<FilmItem['status'], string> = {
  pending: 'text-yellow border-yellow/40 bg-yellow/10',
  approved: 'text-cyan border-cyan/40 bg-cyan/10',
  active: 'text-green border-green/40 bg-green/10',
  inactive: 'text-muted border-line bg-surface-2',
  rejected: 'text-pink border-pink/40 bg-pink/10',
}

function fmtWatch(seconds: number): string {
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export default function FilmmakerPanel() {
  const [data, setData] = useState<FilmmakerData | null>(null)
  const [fullName, setFullName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [connecting, setConnecting] = useState(false)

  async function load() {
    const res = await fetch('/api/filmmaker/me')
    const json: FilmmakerData = await res.json()
    setData(json)
    if (json.profile) {
      setFullName(json.profile.fullName)
      setContactEmail(json.profile.contactEmail)
    }
  }

  useEffect(() => { load() }, [])

  async function saveProfile() {
    setSaving(true)
    setSavedMsg('')
    try {
      const res = await fetch('/api/filmmaker/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, contactEmail }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSavedMsg('saved')
    } catch (err) {
      setSavedMsg(err instanceof Error ? err.message : 'error')
    } finally {
      setSaving(false)
    }
  }

  async function startConnect() {
    setConnecting(true)
    try {
      const res = await fetch('/api/filmmaker/connect', { method: 'POST' })
      const json = await res.json()
      if (json.url) { window.location.href = json.url; return }
      throw new Error(json.error)
    } catch {
      setConnecting(false)
    }
  }

  if (!data) return null

  // Non-filmmakers get a compact invite (keeps the account page tidy).
  if (!data.isFilmmaker) {
    return (
      <section className="border border-line bg-surface p-6 mb-4 rounded-lg">
        <h2 className="font-mono text-xs text-muted uppercase tracking-widest mb-3">{'// filmmaker'}</h2>
        <p className="font-mono text-xs text-muted mb-4 leading-relaxed">
          made a film? submit it to crowdcult and earn 50% of revenue by watch time. no fee to join.
        </p>
        <a href="/submit" className="inline-block bg-accent hover:bg-accent-hover text-background font-mono text-xs uppercase tracking-widest px-5 py-2.5 rounded-md font-bold transition-colors">
          submit a film →
        </a>
      </section>
    )
  }

  return (
    <section className="border border-line bg-surface p-6 mb-4 rounded-lg space-y-6">
      <h2 className="font-mono text-xs text-muted uppercase tracking-widest">{'// filmmaker'}</h2>

      {/* Profile */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-[10px] text-muted uppercase tracking-widest mb-1.5">full name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full bg-background border border-line focus:border-accent rounded-md px-3 py-2 text-ink font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block font-mono text-[10px] text-muted uppercase tracking-widest mb-1.5">contact email</label>
            <input value={contactEmail} onChange={e => setContactEmail(e.target.value)}
              className="w-full bg-background border border-line focus:border-accent rounded-md px-3 py-2 text-ink font-mono text-xs focus:outline-none" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveProfile} disabled={saving}
            className="border border-line hover:border-accent text-ink font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-md transition-colors disabled:opacity-50">
            {saving ? 'saving_' : 'save profile'}
          </button>
          {savedMsg && <span className="font-mono text-[10px] text-muted uppercase tracking-widest">{savedMsg}</span>}
        </div>
      </div>

      {/* Submitted films */}
      <div>
        <h3 className="font-mono text-[10px] text-muted uppercase tracking-widest mb-3 border-t border-line pt-4">your films</h3>
        {data.films && data.films.length > 0 ? (
          <div className="space-y-2">
            {data.films.map(f => (
              <div key={f.id} className="border border-line rounded-md bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-ink truncate">{f.title}</span>
                  <span className={`flex-shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLE[f.status]}`}>
                    {f.status}
                  </span>
                </div>
                {f.status === 'rejected' && f.rejectionReason && (
                  <p className="font-mono text-[10px] text-pink/80 mt-2 leading-relaxed">reason: {f.rejectionReason}</p>
                )}
                {(f.status === 'active' || f.status === 'inactive') && (
                  <div className="flex gap-4 mt-2 font-mono text-[10px] text-muted">
                    <span>watch time ({data.month}): {fmtWatch(f.watchSeconds)}</span>
                    {f.estPayoutUsd > 0 && <span className="text-green">est. payout: ${f.estPayoutUsd.toFixed(2)}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-xs text-muted">no submissions yet. <a href="/submit" className="text-accent hover:text-ink">submit a film →</a></p>
        )}
      </div>

      {/* Payouts / Stripe Connect */}
      <div className="border-t border-line pt-4">
        <h3 className="font-mono text-[10px] text-muted uppercase tracking-widest mb-3">payouts</h3>
        {data.profile?.payoutsEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono text-xs text-green">
              <span className="w-2 h-2 rounded-full bg-green" /> bank account connected — ready for payouts
            </div>
            {data.payoutHistory && data.payoutHistory.length > 0 ? (
              <div className="border border-line rounded-md overflow-hidden">
                {data.payoutHistory.map(p => (
                  <div key={p.month} className="flex items-center justify-between px-3 py-2 border-b border-line last:border-0 font-mono text-xs">
                    <span className="text-muted">{p.month}</span>
                    <span className="text-ink">${p.amountUsd.toFixed(2)}</span>
                    <span className={p.paid ? 'text-green' : 'text-yellow'}>{p.paid ? 'paid' : 'pending'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-[11px] text-muted">no payouts yet. earnings appear here after the monthly run.</p>
            )}
          </div>
        ) : data.profile?.stripeConnected ? (
          <div className="space-y-3">
            <p className="font-mono text-xs text-yellow">onboarding incomplete — finish setup to receive payouts.</p>
            <button onClick={startConnect} disabled={connecting}
              className="bg-accent hover:bg-accent-hover text-background font-mono text-xs uppercase tracking-widest px-5 py-2.5 rounded-md font-bold transition-colors disabled:opacity-50">
              {connecting ? 'redirecting_' : 'finish bank setup →'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-mono text-xs text-muted leading-relaxed">
              connect a bank account via stripe to receive your monthly payouts (50% of revenue, split by watch time).
            </p>
            <button onClick={startConnect} disabled={connecting}
              className="bg-accent hover:bg-accent-hover text-background font-mono text-xs uppercase tracking-widest px-5 py-2.5 rounded-md font-bold transition-colors disabled:opacity-50">
              {connecting ? 'redirecting_' : 'connect bank account →'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
