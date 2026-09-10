import { useState, useCallback } from 'react'
import YouTube from 'react-youtube'
import { useAppStore } from '../../store/useAppStore.js'
import { useSyncedPlayer } from './useSyncedPlayer.js'
import TapToStartOverlay from './TapToStartOverlay.jsx'
import HostControls from './HostControls.jsx'

/**
 * The YouTube player wrapper. Handles:
 * - Rendering the embedded player
 * - Tap-to-start overlay (autoplay policy)
 * - Host-only state change events
 * - Synced playback for guests
 */
export default function PlayerView({ onVideoEnd }) {
  const playback = useAppStore((s) => s.playback)
  const isHost = useAppStore((s) => s.isHost)

  const [hasUserGesture, setHasUserGesture] = useState(false)
  const { playerRef, onPlayerReady } = useSyncedPlayer(hasUserGesture)

  const handleTap = useCallback(() => {
    setHasUserGesture(true)

    // If there's already a video playing, start it now
    const player = playerRef.current
    if (player && playback?.status === 'playing') {
      player.playVideo()
    }
  }, [playerRef, playback])

  /** Fires when the YouTube player changes state (play, pause, end, etc.) */
  const handleStateChange = useCallback(
    (event) => {
      // Only the host reacts to player state changes
      if (!isHost) return

      // YT.PlayerState.ENDED = 0
      if (event.data === 0 && onVideoEnd) {
        onVideoEnd()
      }
    },
    [isHost, onVideoEnd]
  )

  const videoId = playback?.videoId
  const isIdle = !playback || playback.status === 'idle' || !videoId

  if (isIdle) {
    return (
      <div className="relative aspect-video bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <p className="text-neutral-500 text-lg font-medium">No video playing</p>
          <p className="text-neutral-600 text-sm">
            Add a YouTube video to the queue to get started
          </p>
        </div>
      </div>
    )
  }

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: hasUserGesture ? 1 : 0,
      controls: isHost ? 1 : 0,
      disablekb: isHost ? 0 : 1,
      modestbranding: 1,
      rel: 0,
    },
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        {!hasUserGesture && <TapToStartOverlay onTap={handleTap} />}

        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={handleStateChange}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Now playing info + host controls */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {playback.title || 'Now playing'}
          </p>
        </div>
        <HostControls playerRef={playerRef} />
      </div>
    </div>
  )
}
