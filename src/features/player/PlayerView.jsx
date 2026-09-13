import { useState, useCallback, useRef, useEffect } from 'react'
import YouTube from 'react-youtube'
import { useAppStore } from '../../store/useAppStore.js'
import { useSyncedPlayer } from './useSyncedPlayer.js'
import TapToStartOverlay from './TapToStartOverlay.jsx'
import CustomControls from './CustomControls.jsx'
import { writePause, writeResume } from './playbackService.js'

/**
 * The YouTube player wrapper with custom UI controls.
 * - YouTube iframe runs silently without native controls (controls: 0)
 * - Custom controls provide Play/Pause, Stop, -5s, +5s, Skip, Scrubber, Volume, Fullscreen
 * - Video canvas clicks toggle playback directly for host
 */
export default function PlayerView({ onVideoEnd }) {
  const containerRef = useRef(null)
  const roomCode = useAppStore((s) => s.roomCode)
  const uid = useAppStore((s) => s.uid)
  const playback = useAppStore((s) => s.playback)
  const isHost = useAppStore((s) => s.isHost)
  const isAdmin = useAppStore((s) => s.isAdmin)
  const hasControl = isHost || isAdmin

  const [hasUserGesture, setHasUserGesture] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [clickFeedback, setClickFeedback] = useState(null) // 'play' | 'pause' | null

  const {
    playerRef,
    onPlayerReady,
    currentTime,
    setCurrentTime,
    duration,
    isScrubbingRef,
  } = useSyncedPlayer(hasUserGesture)

  // Fullscreen state listener
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error)
    } else {
      containerRef.current.requestFullscreen().catch(console.error)
    }
  }, [])

  // Audio unlock tap
  const handleTap = useCallback(() => {
    setHasUserGesture(true)
    const player = playerRef.current
    if (player && playback?.status === 'playing') {
      player.playVideo()
    }
  }, [playerRef, playback])

  // Direct video canvas click: toggle Play / Pause
  const handleVideoClick = useCallback(() => {
    if (!hasUserGesture) {
      handleTap()
      return
    }

    if (!hasControl || !roomCode || !playback || !playerRef.current) return
    const player = playerRef.current
    const curTime = player.getCurrentTime() || 0

    if (playback.status === 'playing') {
      player.pauseVideo()
      writePause(roomCode, uid, curTime).catch(console.error)
      setClickFeedback('pause')
    } else {
      player.playVideo()
      writeResume(roomCode, uid, curTime).catch(console.error)
      setClickFeedback('play')
    }

    setTimeout(() => setClickFeedback(null), 600)
  }, [hasUserGesture, handleTap, hasControl, roomCode, playback, playerRef, uid])

  /** Fires when the YouTube player changes state */
  const handleStateChange = useCallback(
    (event) => {
      if (!hasControl) return
      // YT.PlayerState.ENDED = 0
      if (event.data === 0 && onVideoEnd) {
        onVideoEnd()
      }
    },
    [hasControl, onVideoEnd]
  )

  const videoId = playback?.videoId
  const isIdle = !playback || playback.status === 'idle' || !videoId

  if (isIdle) {
    return (
      <div className="relative aspect-video bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <p className="text-neutral-500 text-lg font-medium">
            No video playing
          </p>
          <p className="text-neutral-600 text-sm">
            Add a YouTube video to the queue to get started
          </p>
        </div>
      </div>
    )
  }

  // Player parameters: native YouTube controls permanently disabled
  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: hasUserGesture ? 1 : 0,
      controls: 0, // No native controls
      disablekb: 1, // Disable keyboard hotkeys on iframe
      modestbranding: 1,
      rel: 0,
      fs: 0, // Disable native fullscreen button
      iv_load_policy: 3, // Disable annotations
      playsinline: 1,
    },
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-3 ${
        isFullscreen ? 'bg-black w-full h-full justify-between p-4' : ''
      }`}
    >
      {/* Video display area */}
      <div
        className={`relative ${
          isFullscreen
            ? 'flex-1 max-h-[calc(100vh-110px)] w-full'
            : 'aspect-video'
        } bg-black rounded-xl overflow-hidden group select-none`}
      >
        {/* Autoplay unlock overlay */}
        {!hasUserGesture && <TapToStartOverlay onTap={handleTap} />}

        {/* Click interception layer for synchronized play/pause */}
        <div
          onClick={handleVideoClick}
          className="absolute inset-0 z-10 cursor-pointer"
          title={hasControl ? 'Click to toggle Play/Pause' : ''}
        >
          {/* Animated click feedback ripple */}
          {clickFeedback && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-3xl animate-ping opacity-90">
                {clickFeedback === 'play' ? '▶' : '⏸'}
              </div>
            </div>
          )}
        </div>

        {/* Embedded YouTube Player */}
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={handleStateChange}
          className="w-full h-full pointer-events-none"
          iframeClassName="w-full h-full pointer-events-none"
        />
      </div>

      {/* Video title & Custom Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-white text-sm font-semibold truncate max-w-xl">
            {playback.title || 'Now playing'}
          </p>
          {isHost && (
            <span className="text-[11px] font-medium bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
              Host Controller
            </span>
          )}
        </div>

        {/* Custom Player Controls */}
        <CustomControls
          playerRef={playerRef}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          duration={duration}
          isScrubbingRef={isScrubbingRef}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </div>
    </div>
  )
}
