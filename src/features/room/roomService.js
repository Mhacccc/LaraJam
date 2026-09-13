import { ref, get, update, runTransaction } from 'firebase/database'
import { db } from '../../lib/firebase/db.js'
import { serverTimestamp } from '../../lib/firebase/serverTime.js'
import { generateRoomCode } from '../../utils/roomCode.js'

/**
 * Creates a new room. Generates codes until one is unused (collision check).
 * Returns the room code on success.
 */
export async function createRoom(uid, displayName) {
  let code
  let attempts = 0

  // Keep generating until we find an unused code
  while (attempts < 10) {
    code = generateRoomCode()
    const roomRef = ref(db, `rooms/${code}/meta`)
    const snapshot = await get(roomRef)

    if (!snapshot.exists()) {
      // Code is free — claim it with multi-path update so Firebase
      // checks rules at each child path individually
      await update(ref(db), {
        [`rooms/${code}/meta`]: {
          hostUid: uid,
          createdAt: serverTimestamp(),
        },
        [`rooms/${code}/members/${uid}`]: {
          name: displayName,
          joinedAt: serverTimestamp(),
          online: true,
          pending: 0,
        },
      })
      return code
    }
    attempts++
  }

  throw new Error('Could not generate a unique room code. Try again.')
}

/**
 * Checks if a room exists. Returns true/false.
 */
export async function roomExists(code) {
  const snapshot = await get(ref(db, `rooms/${code}/meta`))
  return snapshot.exists()
}

/**
 * Joins an existing room by writing the user into /members.
 */
export async function joinRoom(code, uid, displayName) {
  const exists = await roomExists(code)
  if (!exists) {
    throw new Error('Room not found. Check the code and try again.')
  }

  await update(ref(db, `rooms/${code}/members/${uid}`), {
    name: displayName,
    joinedAt: serverTimestamp(),
    online: true,
    pending: 0,
  })
}

/**
 * Attempts to claim the host role. Succeeds only if the current host is offline.
 * Uses a transaction so only one client wins the race.
 */
export async function claimHost(code, uid) {
  const metaRef = ref(db, `rooms/${code}/meta/hostUid`)

  const result = await runTransaction(metaRef, (currentHostUid) => {
    // Transaction function — return the new value or undefined to abort
    if (currentHostUid === uid) return // already host
    return uid
  })

  return result.committed
}
