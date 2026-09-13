import { useEffect, useRef, useState, useCallback } from 'react'
import { serverNow } from '../../lib/firebase/serverTime.js'
import { useAppStore } from '../../store/useAppStore.js'
import { DRIFT_THRESHOLD_SEC, DRIFT_CHECK_MS } from '../../utils/constants.js'

/**
 * Enhanced sync logic for the custom YouTube player.
 * - Tracks currentTime and duration for the custom scrubber
 * - Keeps guests synchronized with the host's virtual clock
 * - Prevents the local action author from jittering
 *
 * @param {boolean} hasUserGesture Whether user clicked to unlock autoplay
 */
export function useSyncedPlayer(hasUserGesture) {
  const playerRef = useRef(null)
  const isScrubbingRef = useRef(false)

  const uid = useAppStore((s) => s.uid)
  const isHost = useAppStore((s) => s.isHost)
  const isAdmin = useAppStore((s) => s.isAdmin)
  const playback = useAppStore((s) => s.playback)
  const hasControl = isHost || isAdmin

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  /** Called by react-youtube onReady */
  const onPlayerReady = useCallback((event) => {
    playerRef.current = event.target
    const dur = event.target.getDuration() || 0
    if (dur > 0) setDuration(dur)
  }, [])

  // Sync when playback state changes in Firebase (play/pause/seek/video change)
  useEffect(() => {
    const player = playerRef.current
    if (!player || !playback || !hasUserGesture) return
    if (!playback.videoId || playback.status === 'idle') return

    // If the current user triggered this update, do not re-seek (already executed locally)
    if (playback.updatedBy === uid) return

    const expected = expectedPosition(playback)

    if (playback.status === 'playing') {
      player.seekTo(expected, true)
      player.playVideo()
    } else if (playback.status === 'paused') {
      player.seekTo(expected, true)
      player.pauseVideo()
    }
  }, [playback, hasUserGesture, uid])

  // Periodic drift correction — for users following playback
  useEffect(() => {
    const player = playerRef.current
    if (!player || !hasUserGesture || !playback) return
    if (playback.status !== 'playing') return

    // The host controls the timing, so drift correction only runs for guests
    if (hasControl) return

    const id = setInterval(() => {
      const expected = expectedPosition(playback)
      const actual = player.getCurrentTime() || 0
      const drift = Math.abs(actual - expected)

      if (drift > DRIFT_THRESHOLD_SEC) {
        player.seekTo(expected, true)
      }
    }, DRIFT_CHECK_MS)

    return () => clearInterval(id)
  }, [playback, hasControl, hasUserGesture])

  // Local ticker to update currentTime and duration for the UI scrubber
  useEffect(() => {
    const player = playerRef.current
    if (!player || !hasUserGesture || !playback || playback.status === 'idle') {
      return
    }

    const interval = setInterval(() => {
      if (isScrubbingRef.current) return

      try {
        const cur = player.getCurrentTime() || 0
        setCurrentTime(cur)

        const dur = player.getDuration() || playback.durationSec || 0
        if (dur > 0) setDuration(dur)
      } catch {
        // Player might be re-mounting
      }
    }, 250)

    return () => clearInterval(interval)
  }, [hasUserGesture, playback])

  return {
    playerRef,
    onPlayerReady,
    currentTime,
    setCurrentTime,
    duration,
    isScrubbingRef,
  }
}

/**
 * Calculates where the video SHOULD be right now using the virtual clock.
 */
function expectedPosition(pb) {
  if (!pb || pb.status !== 'playing') {
    return pb?.positionAtUpdate ?? 0
  }
  const elapsed = (serverNow() - pb.startedAt) / 1000
  return pb.positionAtUpdate + elapsed
}
