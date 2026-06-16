'use client'

import { useEffect, useState } from 'react'

interface UsageData {
  deliveryMinutes: number
  deliveryLimit: number
  assetCount: number
  assetLimit: number
  monthlyRevenueCents: number
  estimatedMuxCostCents: number
  hardStopEnabled: boolean
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400 font-mono">
          {value.toLocaleString()} / {max.toLocaleString()} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="bg-surface-2 rounded-full h-3 overflow-hidden">
        <div className={`${color} h-3 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function UsageTab() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  async function loadUsage() {
    setLoading(true)
    const res = await fetch('/api/admin/usage')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { loadUsage() }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return <p className="text-red-400">Failed to load usage data.</p>

  const deliveryPct = (data.deliveryMinutes / data.deliveryLimit) * 100

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-2xl font-bold">Usage Dashboard</h2>

      {deliveryPct >= 80 && (
        <div className={`border rounded-lg px-5 py-4 flex items-start gap-3 ${
          deliveryPct >= 90
            ? 'bg-red-900/30 border-red-500/30 text-red-300'
            : 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300'
        }`}>
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">
              {deliveryPct >= 90
                ? 'Critical: Approaching Mux free tier limit!'
                : 'Warning: Approaching Mux free tier limit'}
            </p>
            <p className="text-sm mt-0.5 opacity-80">
              {deliveryPct >= 90
                ? 'Hard stop is now active — subscribers see a maintenance page. Upgrade your Mux plan to restore access.'
                : 'Approaching Mux free tier limit — consider upgrading your plan.'}
            </p>
          </div>
        </div>
      )}

      {/* Mux delivery minutes */}
      <div className="bg-surface rounded-xl p-6 border border-white/10 space-y-5">
        <h3 className="font-semibold text-white">Mux Free Tier Usage</h3>
        <ProgressBar
          value={data.deliveryMinutes}
          max={data.deliveryLimit}
          label="Delivery minutes this month"
        />
        <ProgressBar
          value={data.assetCount}
          max={data.assetLimit}
          label="Stored video assets"
        />
      </div>

      {/* Hard stop status (automatic) */}
      <div className="bg-surface rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Auto Hard Stop</h3>
            <p className="text-sm text-gray-400 mt-1">
              Automatically blocks video playback when delivery exceeds 90,000 minutes. Resets when usage drops below the threshold.
            </p>
          </div>
          <span className={`flex-shrink-0 ml-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            data.hardStopEnabled
              ? 'bg-red-900/40 text-red-300 border border-red-500/30'
              : 'bg-green-900/40 text-green-300 border border-green-500/30'
          }`}>
            {data.hardStopEnabled ? 'ACTIVE' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Revenue + cost */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl p-5 border border-white/10">
          <p className="text-sm text-gray-400 mb-1">Monthly Revenue (Stripe)</p>
          <p className="text-3xl font-bold text-green-400">
            ${(data.monthlyRevenueCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-white/10">
          <p className="text-sm text-gray-400 mb-1">Est. Mux Cost (paid tier)</p>
          <p className="text-3xl font-bold text-gray-300">
            ${(data.estimatedMuxCostCents / 100).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">at $0.0088/min delivered</p>
        </div>
      </div>
    </div>
  )
}
