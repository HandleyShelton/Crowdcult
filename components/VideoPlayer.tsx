'use client'

import { useEffect, useRef, useCallback } from 'react'
import MuxPlayer from '@mux/mux-player-react'

interface VideoPlayerProps {
  playbackId: string
  token: string
  filmId: string
  title: string
}

export default function VideoPlayer({ playbackId, token, filmId, title }: VideoPlayerProps) {
  // Measure ACTUAL time watched, not playhead position. We accumulate the small
  // forward deltas between timeupdate ticks during normal playback, and ignore
  // big jumps (seeks/scrubs) — so scrubbing to the end can't inflate watch time.
  const watchedRef = useRef(0)        // accumulated real seconds watched this session
  const lastSentRef = useRef(0)       // how much we've already reported
  const lastTimeRef = useRef<number | null>(null)

  const flush = useCallback(() => {
    const delta = Math.floor(watchedRef.current - lastSentRef.current)
    if (delta < 1) return
    lastSentRef.current += delta
    try {
      fetch('/api/watch-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId, deltaSeconds: delta }),
        keepalive: true, // ensures the final report survives page unload
      })
    } catch {
      // best-effort tracking
    }
  }, [filmId])

  useEffect(() => {
    const interval = setInterval(flush, 30_000)
    return () => {
      clearInterval(interval)
      flush()
    }
  }, [flush])

  return (
    <div className="w-full rounded-lg overflow-hidden bg-black shadow-2xl">
      <MuxPlayer
        playbackId={playbackId}
        tokens={token ? { playback: token } : undefined}
        metadata={{ video_title: title }}
        accentColor="#bb9af7"
        style={{ width: '100%', aspectRatio: '16/9' }}
        onTimeUpdate={(evt) => {
          const t = (evt.target as HTMLVideoElement).currentTime ?? 0
          const last = lastTimeRef.current
          if (last !== null) {
            const d = t - last
            // Only count normal forward progress (~0.25s/tick). A delta >1.5s is
            // a seek; a negative delta is a rewind — neither counts as watched.
            if (d > 0 && d < 1.5) watchedRef.current += d
          }
          lastTimeRef.current = t
        }}
      />
    </div>
  )
}
