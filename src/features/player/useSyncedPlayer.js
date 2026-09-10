import { useEffect, useRef, useCallback } from 'react'
import { serverNow } from '../../lib/firebase/serverTime.js'
import { useAppStore } from '../../store/useAppStore.js'
import { DRIFT_THRESHOLD_SEC, DRIFT_CHECK_MS } from '../../utils/constants.js'

/**
 * The core sync logic. Guests run a local interval that compares where they
 * ARE versus where they SHOULD BE, and seek to correct if drift > threshold.
 *
 * No network involved in the check — it's pure arithmetic.
 *
 * @param {boolean} hasUserGesture Whether the user has tapped/clicked (autoplay unlock)
 */
export function useSyncedPlayer(hasUserGesture) {
  const playerRef = useRef(null)
  const isHost = useAppStore((s) => s.isHost)
  const playback = useAppStore((s) => s.playback)

  /** Called by react-youtube onReady */
  const onPlayerReady = useCallback((event) => {
    playerRef.current = event.target
  }, [])

  // Sync when playback state changes (new video, play/pause, seek)
  useEffect(() => {
    const player = playerRef.current
    if (!player || !playback || !hasUserGesture || isHost) return
    if (!playback.videoId || playback.status === 'idle') return

    const expected = expectedPosition(playback)

    if (playback.status === 'playing') {
      player.seekTo(expected, true)
      player.playVideo()
    } else if (playback.status === 'paused') {
      player.seekTo(expected, true)
      player.pauseVideo()
    }
  }, [playback, hasUserGesture, isHost])

  // Periodic drift correction — guests only
  useEffect(() => {
    const player = playerRef.current
    if (isHost || !player || !hasUserGesture || !playback) return
    if (playback.status !== 'playing') return

    const id = setInterval(() => {
      const expected = expectedPosition(playback)
      const actual = player.getCurrentTime()
      const drift = Math.abs(actual - expected)

      if (drift > DRIFT_THRESHOLD_SEC) {
        player.seekTo(expected, true)
      }
    }, DRIFT_CHECK_MS)

    return () => clearInterval(id)
  }, [playback, isHost, hasUserGesture])

  return { playerRef, onPlayerReady }
}

/**
 * Calculates where the video SHOULD be right now, using the virtual clock.
 * playback.positionAtUpdate is the video time when the state was last written.
 * playback.startedAt is the server time when that write happened.
 * The difference between now and startedAt = how far we should have advanced.
 */
function expectedPosition(pb) {
  if (!pb || pb.status !== 'playing') {
    return pb?.positionAtUpdate ?? 0
  }
  const elapsed = (serverNow() - pb.startedAt) / 1000
  return pb.positionAtUpdate + elapsed
}
