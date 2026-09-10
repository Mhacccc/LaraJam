import { useAppStore } from '../../store/useAppStore.js'
import { formatDuration } from '../../lib/youtube/formatDuration.js'
import { removeFromQueue } from './queueService.js'

export default function QueueItem({ item, index }) {
  const uid = useAppStore((s) => s.uid)
  const isHost = useAppStore((s) => s.isHost)
  const roomCode = useAppStore((s) => s.roomCode)

  const canRemove = item.addedBy === uid || isHost

  async function handleRemove() {
    try {
      await removeFromQueue(roomCode, item.id, item.addedBy)
    } catch (err) {
      console.error('Remove failed:', err)
    }
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/50 group">
      {/* Index */}
      <span className="text-neutral-600 text-xs w-5 text-right shrink-0">
        {index + 1}
      </span>

      {/* Thumbnail */}
      <img
        src={item.thumbnail}
        alt=""
        className="w-16 h-9 rounded object-cover shrink-0 bg-neutral-800"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm truncate">{item.title}</p>
        <p className="text-neutral-500 text-xs truncate">
          {item.addedByName || 'Guest'} · {formatDuration(item.durationSec)}
        </p>
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={handleRemove}
          className="text-neutral-600 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          title="Remove from queue"
        >
          ✕
        </button>
      )}
    </div>
  )
}
