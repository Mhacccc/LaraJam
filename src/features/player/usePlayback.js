import { useEffect } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { db } from '../../lib/firebase/db.js'
import { useAppStore } from '../../store/useAppStore.js'

/**
 * Subscribes to /rooms/{code}/playback and pushes state into the store.
 */
export function usePlayback(code) {
  const setPlayback = useAppStore((s) => s.setPlayback)

  useEffect(() => {
    if (!code) return

    const playbackRef = ref(db, `rooms/${code}/playback`)
    onValue(playbackRef, (snap) => {
      setPlayback(snap.val())
    })

    return () => off(playbackRef)
  }, [code, setPlayback])
}
