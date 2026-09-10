/**
 * Browsers block autoplay with sound until the user has interacted with the
 * page. This overlay captures that first click/tap, which unlocks audio for
 * the YouTube player. Shown once per session.
 */
export default function TapToStartOverlay({ onTap }) {
  return (
    <div
      onClick={onTap}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 cursor-pointer rounded-xl"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <p className="text-white font-semibold text-lg">Tap to join playback</p>
        <p className="text-neutral-400 text-sm">Required by your browser to enable audio</p>
      </div>
    </div>
  )
}
