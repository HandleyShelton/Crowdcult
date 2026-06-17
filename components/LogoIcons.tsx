/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

// Free Iconify public API (no key). Phosphor set ~1,200 icons.
// Swap PREFIX for another set, e.g. 'tabler', 'lucide', 'mdi', 'ph-fill'.
const PREFIX = 'ph'

const SLOTS = [
  { color: '#f7768e' }, // pink
  { color: '#e0af68' }, // yellow
  { color: '#9ece6a' }, // green
]

// Inline fallback used only if the Iconify API can't be reached.
const FALLBACK = [
  'M12 .587l3.668 7.431 8.2 1.192-5.934 5.785 1.401 8.169L12 18.896l-7.335 3.868 1.401-8.169L.132 9.21l8.2-1.192z',
  'M8 5v14l11-7z',
  'M12 2l10 10-10 10L2 12z',
  'M13 2L3 14h7v8l10-12h-7z',
  'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  'M12 2s7 7.16 7 12a7 7 0 11-14 0c0-4.84 7-12 7-12z',
]

// Module-level cache so the icon list is fetched once per session.
let namePool: string[] | null = null
let poolPromise: Promise<string[] | null> | null = null

async function loadPool(): Promise<string[] | null> {
  if (namePool) return namePool
  if (poolPromise) return poolPromise
  poolPromise = fetch(`https://api.iconify.design/collection?prefix=${PREFIX}`)
    .then(r => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
    .then((data: { uncategorized?: string[]; categories?: Record<string, string[]> }) => {
      const names: string[] = []
      if (Array.isArray(data.uncategorized)) names.push(...data.uncategorized)
      if (data.categories) for (const arr of Object.values(data.categories)) names.push(...arr)
      namePool = names
      return names
    })
    .catch(() => null)
  return poolPromise
}

function sample<T>(arr: T[], n: number): T[] {
  const out: T[] = []
  const used = new Set<number>()
  while (out.length < n && used.size < arr.length) {
    const i = Math.floor(Math.random() * arr.length)
    if (!used.has(i)) { used.add(i); out.push(arr[i]) }
  }
  return out
}

type Picks = { kind: 'remote'; names: string[] } | { kind: 'local'; paths: string[] }

export default function LogoIcons({ className = 'flex items-center gap-1.5' }: { className?: string }) {
  const pathname = usePathname()
  const [picks, setPicks] = useState<Picks | null>(null)

  // Re-roll on first mount (refresh) and on every route change.
  useEffect(() => {
    let active = true
    loadPool().then(pool => {
      if (!active) return
      if (pool && pool.length) setPicks({ kind: 'remote', names: sample(pool, 3) })
      else setPicks({ kind: 'local', paths: sample(FALLBACK, 3) })
    })
    return () => { active = false }
  }, [pathname])

  return (
    <span className={className}>
      {SLOTS.map((slot, i) => {
        // SSR / pre-fetch placeholder — colored dots, avoids hydration mismatch.
        if (!picks) {
          return <span key={i} className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slot.color, opacity: 0.8 }} />
        }
        if (picks.kind === 'remote') {
          const url = `https://api.iconify.design/${PREFIX}/${picks.names[i]}.svg?color=${encodeURIComponent(slot.color)}&width=14&height=14`
          return <img key={i} src={url} alt="" width={14} height={14} aria-hidden />
        }
        return (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={slot.color} aria-hidden>
            <path d={picks.paths[i]} />
          </svg>
        )
      })}
    </span>
  )
}
