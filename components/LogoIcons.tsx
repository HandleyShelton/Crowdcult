'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// Small built-in icon "database" — simple filled glyphs that read well at ~13px.
// Add more entries here to expand the pool.
const ICONS: ReactNode[] = [
  <path key="star" d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.785 1.401 8.169L12 18.896l-7.335 3.868 1.401-8.169L.132 9.21l8.2-1.192z" />,
  <path key="heart" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />,
  <circle key="circle" cx="12" cy="12" r="9" />,
  <rect key="square" x="4" y="4" width="16" height="16" rx="3" />,
  <path key="play" d="M8 5v14l11-7z" />,
  <path key="diamond" d="M12 2l10 10-10 10L2 12z" />,
  <path key="plus" d="M11 3h2v8h8v2h-8v8h-2v-8H3v-2h8z" />,
  <path key="bolt" d="M13 2L3 14h7v8l10-12h-7z" />,
  <path key="moon" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
  <path key="droplet" d="M12 2s7 7.16 7 12a7 7 0 11-14 0c0-4.84 7-12 7-12z" />,
  <path key="eye" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 11a4 4 0 110-8 4 4 0 010 8z" />,
  <path key="sparkle" d="M11 2h2v6.6l4.6-4.6 1.4 1.4-4.6 4.6H21v2h-6.6l4.6 4.6-1.4 1.4-4.6-4.6V21h-2v-6.6l-4.6 4.6-1.4-1.4 4.6-4.6H3v-2h6.6L5 6.4 6.4 5 11 9.6z" />,
  <path key="triangle" d="M12 3l10 17H2z" />,
  <path key="hexagon" d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />,
]

const SLOTS = [
  { text: 'text-pink', dot: 'bg-pink/80' },
  { text: 'text-yellow', dot: 'bg-yellow/80' },
  { text: 'text-green', dot: 'bg-green/80' },
]

function pickDistinct(count: number, max: number): number[] {
  const pool = Array.from({ length: max }, (_, i) => i)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

export default function LogoIcons({ className = 'flex items-center gap-1.5' }: { className?: string }) {
  const pathname = usePathname()
  const [picks, setPicks] = useState<number[] | null>(null)

  // Re-randomize on first mount (refresh) and on every route change.
  useEffect(() => {
    setPicks(pickDistinct(SLOTS.length, ICONS.length))
  }, [pathname])

  return (
    <span className={className}>
      {SLOTS.map((slot, i) =>
        picks ? (
          <svg
            key={i}
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={slot.text}
            aria-hidden
          >
            {ICONS[picks[i]]}
          </svg>
        ) : (
          // SSR / pre-mount placeholder — matches the old dots, avoids hydration mismatch.
          <span key={i} className={`block w-2.5 h-2.5 rounded-full ${slot.dot}`} />
        )
      )}
    </span>
  )
}
