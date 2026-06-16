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

  function exportCSV() {
    const headers = ['Film', 'Director', 'Watch Seconds', 'Watch %', 'Payout ($)', 'Paid']
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.title}"`,
        `"${r.director}"`,
        r.watchSeconds,
        r.watchPct.toFixed(2),
        r.payoutAmount.toFixed(2),
        r.paid ? 'Yes' : 'No',
      ].join(',')),
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crowdcult-payouts-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
          onClick={exportCSV}
          className="bg-surface-2 border border-white/10 hover:border-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

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
