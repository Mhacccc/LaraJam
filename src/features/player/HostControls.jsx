import { useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore.js'
import { writePause, writeResume, advanceQueue } from './playbackService.js'

/**
 * Play/Pause/Skip buttons shown only to the host.
 */
export default function HostControls({ playerRef }) {
  const roomCode = useAppStore((s) => s.roomCode)
  const uid = useAppStore((s) => s.uid)
  const playback = useAppStore((s) => s.playback)
  const isHost = useAppStore((s) => s.isHost)
  const isAdmin = useAppStore((s) => s.isAdmin)
  const queue = useAppStore((s) => s.queue)
  const hasControl = isHost || isAdmin

  const handleToggle = useCallback(() => {
    const player = playerRef?.current
    if (!player || !roomCode || !playback) return

    const currentTime = player.getCurrentTime() || 0

    if (playback.status === 'playing') {
      player.pauseVideo()
      writePause(roomCode, uid, currentTime)
    } else {
      player.playVideo()
      writeResume(roomCode, uid, currentTime)
    }
  }, [playerRef, roomCode, uid, playback])

  const handleSkip = useCallback(() => {
    if (!roomCode || !uid) return
    advanceQueue(roomCode, uid, queue).catch(console.error)
  }, [roomCode, uid, queue])

  if (!hasControl || !playback || playback.status === 'idle') return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg border border-neutral-700 transition-colors text-sm font-medium"
      >
        {playback.status === 'playing' ? '⏸ Pause' : '▶ Play'}
      </button>
      <button
        onClick={handleSkip}
        className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg border border-neutral-700 transition-colors text-sm font-medium"
        title="Skip to next video"
      >
        ⏭ Skip
      </button>
    </div>
  )
}
