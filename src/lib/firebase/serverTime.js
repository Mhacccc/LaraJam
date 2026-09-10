import { ref, onValue, serverTimestamp as fbServerTimestamp } from 'firebase/database'
import { db } from './db.js'

/**
 * Offset between local clock and Firebase server clock.
 * Updated automatically by Firebase — reads /.info/serverTimeOffset.
 * Without this, a user whose laptop clock is wrong would be permanently
 * out of sync with everyone else.
 */
let offset = 0

const offsetRef = ref(db, '.info/serverTimeOffset')
onValue(offsetRef, (snap) => {
  offset = snap.val() || 0
})

/** Returns the current server-aligned timestamp in ms */
export function serverNow() {
  return Date.now() + offset
}

/** Firebase server timestamp placeholder for writes */
export const serverTimestamp = fbServerTimestamp
