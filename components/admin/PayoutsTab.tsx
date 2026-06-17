'use client'

import { useEffect, useState } from 'react'

interface PayoutRow {
  filmId: string
  title: string
  director: string
  watchSeconds: number
  watchPct: number
  payoutAmount: number
  paid: boolean
}

export default function PayoutsTab() {
  const [rows, setRows] = useState<PayoutRow[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState('')
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [running, setRunning] = useState(false)
  const [runResults, setRunResults] = useState<{ filmmaker: string; amountUsd: number; status: string; error?: string }[] | null>(null)

  async function loadPayouts() {
    setLoading(true)
    const res = await fetch('/api/admin/payouts')
    const data = await res.json()
    setRows(data.payouts ?? [])
    setMonth(data.month ?? '')
    setTotalRevenue(data.totalRevenueCents ?? 0)
    setLoading(false)
  }

  useEffect(() => { loadPayouts() }, [])

  async function runPayouts() {
    if (!confirm(`Run payouts for ${month}? This sends real Stripe Connect transfers to all connected filmmakers based on this month's watch time.`)) return
    setRunning(true)
    setRunResults(null)
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      })
      const json = await res.json()
      setRunResults(json.results ?? [])
      await loadPayouts()
    } catch {
      setRunResults([{ filmmaker: '—', amountUsd: 0, status: 'error', error: 'request failed' }])
    } finally {
      setRunning(false)
    }
  }

  async function togglePaid(filmId: string, currentPaid: boolean) {
    await fetch('/api/admin/payouts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filmId, month, paid: !currentPaid }),
    })
    setRows(prev => prev.map(r => r.filmId === filmId ? { ...r, paid: !currentPaid } : r))
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-2 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  const filmPool = totalRevenue * 0.5 / 100

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Payouts — {month}</h2>
          <p className="text-gray-400 text-sm mt-1">
            Filmmaker pool: <strong className="text-green-400">${filmPool.toFixed(2)}</strong>
            {' '}(50% of ${(totalRevenue / 100).toFixed(2)} net revenue)
          </p>
        </div>
        <button
          onClick={runPayouts}
          disabled={running}
          className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-background px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          {running ? 'Running payouts…' : 'Run Monthly Payouts'}
        </button>
      </div>

      {runResults && (
        <div className="border border-line rounded-lg bg-surface p-4 mb-6">
          <p className="text-sm font-semibold text-ink mb-2">Payout run results</p>
          {runResults.length === 0 ? (
            <p className="text-sm text-muted">No filmmaker films with watch time this month.</p>
          ) : (
            <div className="space-y-1.5">
              {runResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm font-mono">
                  <span className="text-ink">{r.filmmaker}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted">${r.amountUsd.toFixed(2)}</span>
                    <span className={
                      r.status === 'paid' ? 'text-green' :
                      r.status.startsWith('not connected') ? 'text-yellow' :
                      r.status === 'error' ? 'text-pink' : 'text-muted'
                    }>
                      {r.status}{r.error ? ` (${r.error})` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted mt-3">
            Filmmakers flagged <span className="text-yellow">not connected</span> are logged as pending — re-run after they connect a bank account, or use the checkboxes below to mark a payout settled manually.
          </p>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-gray-400">No watch data for this month yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="pb-3 pr-4 font-medium">Film</th>
                <th className="pb-3 pr-4 font-medium">Director</th>
                <th className="pb-3 pr-4 font-medium">Watch Time</th>
                <th className="pb-3 pr-4 font-medium">% of Total</th>
                <th className="pb-3 pr-4 font-medium">Payout</th>
                <th className="pb-3 font-medium">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map(row => {
                const h = Math.floor(row.watchSeconds / 3600)
                const m = Math.floor((row.watchSeconds % 3600) / 60)
                const timeLabel = h > 0 ? `${h}h ${m}m` : `${m}m`
                return (
                  <tr key={row.filmId} className="hover:bg-white/5">
                    <td className="py-3 pr-4 font-medium text-white">{row.title}</td>
                    <td className="py-3 pr-4 text-gray-300">{row.director}</td>
                    <td className="py-3 pr-4 text-gray-400 font-mono">{timeLabel}</td>
                    <td className="py-3 pr-4 text-gray-400 font-mono">{row.watchPct.toFixed(1)}%</td>
                    <td className="py-3 pr-4 font-semibold text-green-400">${row.payoutAmount.toFixed(2)}</td>
                    <td className="py-3">
                      <button
                        onClick={() => togglePaid(row.filmId, row.paid)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          row.paid ? 'bg-green-500 border-green-500' : 'border-white/30 hover:border-white/60'
                        }`}
                        aria-label={row.paid ? 'Mark as unpaid' : 'Mark as paid'}
                      >
                        {row.paid && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
