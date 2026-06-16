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
  // Track time via onTimeUpdate into a plain ref — avoids MuxPlayerElement typing issues
  const currentTimeRef = useRef(0)
  const lastReportedRef = useRef(0)

  const reportWatchTime = useCallback(async (seconds: number) => {
    if (seconds <= 0) return
    try {
      await fetch('/api/watch-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId, watchedSeconds: Math.floor(seconds) }),
      })
    } catch {
      // best-effort tracking
    }
  }, [filmId])

  useEffect(() => {
    const interval = setInterval(() => {
      const current = currentTimeRef.current
      if (current > lastReportedRef.current) {
        lastReportedRef.current = current
        reportWatchTime(current)
      }
    }, 30_000)

    return () => {
      clearInterval(interval)
      // Final report on unmount
      reportWatchTime(currentTimeRef.current)
    }
  }, [reportWatchTime])

  return (
    <div className="w-full rounded-lg overflow-hidden bg-black shadow-2xl">
      <MuxPlayer
        playbackId={playbackId}
        tokens={token ? { playback: token } : undefined}
        metadata={{ video_title: title }}
        accentColor="#e50914"
        style={{ width: '100%', aspectRatio: '16/9' }}
        onTimeUpdate={(evt) => {
          const target = evt.target as HTMLVideoElement
          currentTimeRef.current = target.currentTime ?? 0
        }}
      />
    </div>
  )
}
