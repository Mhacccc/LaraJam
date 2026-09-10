import { useAppStore } from '../../store/useAppStore.js'
import QueueItem from './QueueItem.jsx'

export default function QueueList() {
  const queue = useAppStore((s) => s.queue)

  if (queue.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-neutral-600 text-sm text-center">
          Queue is empty. Paste a YouTube link to add a video.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-80 pr-1">
      {queue.map((item, index) => (
        <QueueItem key={item.id} item={item} index={index} />
      ))}
    </div>
  )
}
