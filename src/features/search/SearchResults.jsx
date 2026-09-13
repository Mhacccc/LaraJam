import { useAppStore } from '../../store/useAppStore.js'
import { addToQueue } from '../queue/queueService.js'
import { formatDuration } from '../../lib/youtube/formatDuration.js'
import { MAX_DURATION_SEC } from '../../utils/constants.js'

export default function SearchResults({ results, onAdd }) {
  const uid = useAppStore((s) => s.uid)
  const displayName = useAppStore((s) => s.displayName)
  const roomCode = useAppStore((s) => s.roomCode)
  const isAdmin = useAppStore((s) => s.isAdmin)

  async function handleAdd(item) {
    try {
      await addToQueue(roomCode, uid, displayName, {
        videoId: item.videoId,
        title: item.title,
        channel: item.channel,
        thumbnail: item.thumbnail,
        durationSec: item.durationSec,
      }, { isAdmin })
      if (onAdd) onAdd(item)
    } catch (err) {
      alert(err.message)
    }
  }

  if (results.length === 0) return null

  return (
    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
      {results.map((item) => {
        const tooLong = item.durationSec > MAX_DURATION_SEC
        return (
          <button
            key={item.videoId}
            onClick={() => !tooLong && handleAdd(item)}
            disabled={tooLong}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/50 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <img
              src={item.thumbnail}
              alt=""
              className="w-20 h-11 rounded object-cover shrink-0 bg-neutral-800"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {item.title}
              </p>
              <p className="text-neutral-500 text-xs truncate">
                {item.channel} · {formatDuration(item.durationSec)}
                {tooLong && ' (too long)'}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
