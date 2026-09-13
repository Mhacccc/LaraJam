import { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore.js'
import {
  writePause,
  writeResume,
  writeSeek,
  writeStop,
  advanceQueue,
} from './playbackService.js'
import { formatDuration } from '../../lib/youtube/formatDuration.js'

const VOLUME_STORAGE_KEY = 'ytjam_player_volume'

/**
 * Custom player controls offering Play/Pause, Stop, Rewind (-5s),
 * Forward (+5s), Skip, Scrubber, Local Volume, and Fullscreen.
 */
export default function CustomControls({
  playerRef,
  currentTime,
  setCurrentTime,
  duration,
  isScrubbingRef,
  isFullscreen,
  onToggleFullscreen,
}) {
  const roomCode = useAppStore((s) => s.roomCode)
  const uid = useAppStore((s) => s.uid)
  const playback = useAppStore((s) => s.playback)
  const isHost = useAppStore((s) => s.isHost)
  const isAdmin = useAppStore((s) => s.isAdmin)
  const queue = useAppStore((s) => s.queue)
  const hasControl = isHost || isAdmin

  // Local volume state
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem(VOLUME_STORAGE_KEY)
    return saved !== null ? Number(saved) : 80
  })
  const [isMuted, setIsMuted] = useState(false)

  // Local scrub state
  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  // Initialize player volume once player is ready
  useEffect(() => {
    const player = playerRef.current
    if (player && typeof player.setVolume === 'function') {
      try {
        player.setVolume(volume)
        if (isMuted) player.mute()
        else player.unMute()
      } catch {
        // Player might not be completely initialized yet
      }
    }
  }, [playerRef, volume, isMuted])

  // Play / Pause toggle
  const handleTogglePlay = useCallback(() => {
    if (!hasControl || !roomCode || !playback || !playerRef.current) return
    const player = playerRef.current
    const curTime = player.getCurrentTime() || 0

    if (playback.status === 'playing') {
      player.pauseVideo()
      writePause(roomCode, uid, curTime).catch(console.error)
    } else {
      player.playVideo()
      writeResume(roomCode, uid, curTime).catch(console.error)
    }
  }, [hasControl, roomCode, playback, playerRef, uid])

  // Stop (pause and seek to 0)
  const handleStop = useCallback(() => {
    if (!hasControl || !roomCode || !playerRef.current) return
    const player = playerRef.current
    player.pauseVideo()
    player.seekTo(0, true)
    setCurrentTime(0)
    writeStop(roomCode, uid).catch(console.error)
  }, [hasControl, roomCode, playerRef, setCurrentTime, uid])

  // Rewind 5 seconds
  const handleRewind5 = useCallback(() => {
    if (!hasControl || !roomCode || !playerRef.current) return
    const player = playerRef.current
    const curTime = player.getCurrentTime() || 0
    const target = Math.max(0, curTime - 5)

    player.seekTo(target, true)
    setCurrentTime(target)
    writeSeek(roomCode, uid, target, playback?.status === 'playing').catch(
      console.error
    )
  }, [hasControl, roomCode, playerRef, setCurrentTime, playback, uid])

  // Fast Forward 5 seconds
  const handleForward5 = useCallback(() => {
    if (!hasControl || !roomCode || !playerRef.current) return
    const player = playerRef.current
    const curTime = player.getCurrentTime() || 0
    const totalDur = duration || playback?.durationSec || 0
    const target = totalDur > 0 ? Math.min(totalDur, curTime + 5) : curTime + 5

    player.seekTo(target, true)
    setCurrentTime(target)
    writeSeek(roomCode, uid, target, playback?.status === 'playing').catch(
      console.error
    )
  }, [hasControl, roomCode, playerRef, duration, playback, setCurrentTime, uid])

  // Skip to next in queue
  const handleSkip = useCallback(() => {
    if (!hasControl || !roomCode || !uid) return
    advanceQueue(roomCode, uid, queue).catch(console.error)
  }, [hasControl, roomCode, uid, queue])

  // Scrubber drag start/change
  const handleScrubChange = (e) => {
    const val = Number(e.target.value)
    setDragTime(val)
  }

  const handleScrubStart = () => {
    if (!hasControl) return
    setIsDragging(true)
    if (isScrubbingRef) isScrubbingRef.current = true
    setDragTime(currentTime)
  }

  const handleScrubEnd = () => {
    if (!hasControl) {
      setIsDragging(false)
      if (isScrubbingRef) isScrubbingRef.current = false
      return
    }

    setIsDragging(false)
    if (isScrubbingRef) isScrubbingRef.current = false

    const player = playerRef.current
    if (player && roomCode) {
      player.seekTo(dragTime, true)
      setCurrentTime(dragTime)
      writeSeek(roomCode, uid, dragTime, playback?.status === 'playing').catch(
        console.error
      )
    }
  }

  // Volume slider
  const handleVolumeChange = (e) => {
    const val = Number(e.target.value)
    setVolume(val)
    localStorage.setItem(VOLUME_STORAGE_KEY, String(val))
    if (playerRef.current) {
      playerRef.current.setVolume(val)
      if (val > 0 && isMuted) {
        setIsMuted(false)
        playerRef.current.unMute()
      }
    }
  }

  // Mute toggle
  const handleToggleMute = () => {
    const player = playerRef.current
    if (!player) return

    if (isMuted) {
      player.unMute()
      player.setVolume(volume || 50)
      setIsMuted(false)
    } else {
      player.mute()
      setIsMuted(true)
    }
  }

  const displayTime = isDragging ? dragTime : currentTime
  const totalDuration = duration || playback?.durationSec || 0
  const progressPercent =
    totalDuration > 0
      ? Math.min(100, Math.max(0, (displayTime / totalDuration) * 100))
      : 0
  const isPlaying = playback?.status === 'playing'

  return (
    <div className="flex flex-col gap-2 p-3 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-800 text-white select-none">
      {/* Scrubber timeline */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-xs font-mono text-neutral-400 min-w-10 text-right">
          {formatDuration(displayTime)}
        </span>

        <div className="relative flex-1 flex items-center group">
          <input
            type="range"
            min="0"
            max={totalDuration > 0 ? totalDuration : 100}
            step="0.5"
            value={totalDuration > 0 ? displayTime : 0}
            disabled={!hasControl || totalDuration === 0}
            onMouseDown={handleScrubStart}
            onTouchStart={handleScrubStart}
            onChange={handleScrubChange}
            onMouseUp={handleScrubEnd}
            onTouchEnd={handleScrubEnd}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all bg-neutral-700 accent-red-500 hover:h-2.5 ${
              !hasControl ? 'cursor-not-allowed opacity-75' : ''
            }`}
            style={{
              background: `linear-gradient(to right, #ef4444 ${progressPercent}%, #404040 ${progressPercent}%)`,
            }}
            title={hasControl ? 'Drag to seek' : 'Playback synced with host'}
          />
        </div>

        <span className="text-xs font-mono text-neutral-400 min-w-10">
          {formatDuration(totalDuration)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Play / Pause */}
          <button
            onClick={handleTogglePlay}
            disabled={!hasControl}
            className={`flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold transition-all ${
              hasControl
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 active:scale-95'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
            title={
              hasControl
                ? isPlaying
                  ? 'Pause'
                  : 'Play'
                : 'Only Host/Admin can control playback'
            }
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            disabled={!hasControl}
            className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm transition-all ${
              hasControl
                ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 active:scale-95'
                : 'bg-neutral-800/50 text-neutral-600 border border-neutral-800 cursor-not-allowed'
            }`}
            title={hasControl ? 'Stop (reset to 0:00)' : 'Host only'}
          >
            ⏹
          </button>

          {/* Rewind -5s */}
          <button
            onClick={handleRewind5}
            disabled={!hasControl}
            className={`flex items-center justify-center px-2.5 h-9 rounded-lg text-xs font-semibold gap-0.5 transition-all ${
              hasControl
                ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 active:scale-95'
                : 'bg-neutral-800/50 text-neutral-600 border border-neutral-800 cursor-not-allowed'
            }`}
            title={hasControl ? 'Rewind 5 seconds' : 'Host only'}
          >
            <span>⏪</span>
            <span>5s</span>
          </button>

          {/* Forward +5s */}
          <button
            onClick={handleForward5}
            disabled={!hasControl}
            className={`flex items-center justify-center px-2.5 h-9 rounded-lg text-xs font-semibold gap-0.5 transition-all ${
              hasControl
                ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 active:scale-95'
                : 'bg-neutral-800/50 text-neutral-600 border border-neutral-800 cursor-not-allowed'
            }`}
            title={hasControl ? 'Forward 5 seconds' : 'Host only'}
          >
            <span>⏩</span>
            <span>5s</span>
          </button>

          {/* Skip */}
          <button
            onClick={handleSkip}
            disabled={!hasControl}
            className={`flex items-center justify-center px-2.5 h-9 rounded-lg text-xs font-semibold gap-1 transition-all ${
              hasControl
                ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 active:scale-95'
                : 'bg-neutral-800/50 text-neutral-600 border border-neutral-800 cursor-not-allowed'
            }`}
            title={hasControl ? 'Skip to next video' : 'Host only'}
          >
            <span>⏭</span>
            <span className="hidden sm:inline">Skip</span>
          </button>

          {!hasControl && (
            <span className="text-xs text-neutral-500 bg-neutral-800/80 px-2 py-1 rounded-md ml-1 border border-neutral-800 hidden md:inline">
              Host controls
            </span>
          )}
        </div>

        {/* Local Volume and Fullscreen */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Volume Control */}
          <div className="flex items-center gap-1.5 group">
            <button
              onClick={handleToggleMute}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors text-sm"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1 bg-neutral-700 accent-white rounded-lg cursor-pointer"
              title={`Volume: ${isMuted ? 0 : volume}%`}
            />
          </div>

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? '🗗' : '⛶'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
