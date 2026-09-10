import { useEffect } from 'react'
import { ref, onValue, onDisconnect, update } from 'firebase/database'
import { db } from '../../lib/firebase/db.js'
import { serverTimestamp } from '../../lib/firebase/serverTime.js'

/**
 * Wires up Firebase presence for a user in a room.
 *
 * Critical ordering: register onDisconnect BEFORE setting online:true.
 * If the connection drops between those two writes, onDisconnect
 * already has the cleanup registered server-side.
 */
export function usePresence(code, uid, displayName) {
  useEffect(() => {
    if (!code || !uid) return

    const meRef = ref(db, `rooms/${code}/members/${uid}`)
    const connectedRef = ref(db, '.info/connected')

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (!snap.val()) return // offline — nothing to do

      // 1. Tell the server what to do when we disconnect
      onDisconnect(meRef).update({ online: false })

      // 2. Now mark ourselves online
      update(meRef, {
        name: displayName,
        online: true,
        joinedAt: serverTimestamp(),
      })
    })

    return () => {
      // Cleanup on unmount (navigating away from room)
      unsubscribe()
      update(meRef, { online: false })
    }
  }, [code, uid, displayName])
}
