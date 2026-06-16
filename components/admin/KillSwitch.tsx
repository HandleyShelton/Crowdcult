'use client'

import { useEffect, useState } from 'react'

export default function KillSwitch() {
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings?key=platform_enabled')
      .then(r => r.json())
      .then(d => { setEnabled(d.value !== 'false'); setLoading(false) })
  }, [])

  async function toggle() {
    if (!confirm(enabled
      ? 'Disable the platform? All users will see the maintenance page immediately.'
      : 'Re-enable the platform?'
    )) return

    setToggling(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'platform_enabled', value: (!enabled).toString() }),
    })
    setEnabled(!enabled)
    setToggling(false)
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-6">Platform Kill Switch</h2>

      <div className={`rounded-2xl border p-8 ${
        enabled ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/20 border-red-500/30'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Platform Status</h3>
            <p className={`text-sm mt-1 font-medium ${enabled ? 'text-green-400' : 'text-red-400'}`}>
              {loading ? 'Loading…' : enabled ? '● Online' : '● Offline — Maintenance Mode'}
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={loading || toggling}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 ${
              enabled ? 'bg-green-500' : 'bg-red-500'
            } disabled:opacity-50`}
          >
            <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          {enabled
            ? 'The platform is live. Subscribers can browse and watch films. Toggle off to immediately show the maintenance page to all users — no video will be served and new signups will be paused.'
            : 'The platform is in maintenance mode. All users see the maintenance page. No video is served. New signups are paused. Toggle on to restore service.'}
        </p>

        {!enabled && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-300">
            ⚠ Platform is offline. Toggle above to restore service.
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Changes take effect immediately for all new page loads. Users currently watching may need to refresh.
      </p>
    </div>
  )
}
