import { useEffect } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { db } from '../../lib/firebase/db.js'
import { useAppStore } from '../../store/useAppStore.js'

/**
 * Subscribes to /rooms/{code}/queue and pushes the sorted list into the store.
 * Push IDs sort chronologically, so Object.entries in key order = FIFO.
 */
export function useQueue(code) {
  const setQueue = useAppStore((s) => s.setQueue)

  useEffect(() => {
    if (!code) return

    const queueRef = ref(db, `rooms/${code}/queue`)
    onValue(queueRef, (snap) => {
      const raw = snap.val()
      if (!raw) {
        setQueue([])
        return
      }

      // Convert object to sorted array — push keys are chronological
      const list = Object.entries(raw)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([id, item]) => ({ id, ...item }))

      setQueue(list)
    })

    return () => off(queueRef)
  }, [code, setQueue])
}
