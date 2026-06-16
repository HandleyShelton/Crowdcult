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
  const playerRef = useRef<HTMLElement & { currentTime?: number }>(null)
  const lastReportedRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reportWatchTime = useCallback(async (seconds: number) => {
    try {
      await fetch('/api/watch-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId, watchedSeconds: Math.floor(seconds) }),
      })
    } catch {
      // silently fail — watch tracking is best-effort
    }
  }, [filmId])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const player = playerRef.current
      const currentTime = player?.currentTime ?? 0
      if (currentTime > lastReportedRef.current) {
        const delta = currentTime - lastReportedRef.current
        if (delta >= 1) {
          reportWatchTime(currentTime)
          lastReportedRef.current = currentTime
        }
      }
    }, 30_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      // Final report on unmount
      const player = playerRef.current
      if (player?.currentTime && player.currentTime > lastReportedRef.current) {
        reportWatchTime(player.currentTime)
      }
    }
  }, [reportWatchTime])

  return (
    <div className="w-full rounded-lg overflow-hidden bg-black shadow-2xl">
      <MuxPlayer
        ref={playerRef as React.RefObject<HTMLElement>}
        playbackId={playbackId}
        tokens={{ playback: token }}
        metadata={{ video_title: title }}
        accentColor="#e50914"
        style={{ width: '100%', aspectRatio: '16/9' }}
      />
    </div>
  )
}
