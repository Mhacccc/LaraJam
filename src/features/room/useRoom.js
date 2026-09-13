import { useEffect } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { db } from '../../lib/firebase/db.js'
import { useAppStore } from '../../store/useAppStore.js'

/**
 * Subscribes to /rooms/{code}/meta and /rooms/{code}/members.
 * Pushes live data into the Zustand store so any component can read it.
 */
export function useRoom(code) {
  const uid = useAppStore((s) => s.uid)
  const setMembers = useAppStore((s) => s.setMembers)
  const setIsHost = useAppStore((s) => s.setIsHost)

  useEffect(() => {
    if (!code) return

    // Listen to members
    const membersRef = ref(db, `rooms/${code}/members`)
    onValue(membersRef, (snap) => {
      setMembers(snap.val() || {})
    })

    // Listen to meta (for host changes)
    const metaRef = ref(db, `rooms/${code}/meta`)
    onValue(metaRef, (snap) => {
      const meta = snap.val()
      if (meta) {
        setIsHost(meta.hostUid === uid)
      }
    })

    return () => {
      off(membersRef)
      off(metaRef)
    }
  }, [code, uid, setMembers, setIsHost])
}
