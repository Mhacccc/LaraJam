import { ref, push, update, get } from 'firebase/database'
import { db } from '../../lib/firebase/db.js'
import { serverTimestamp } from '../../lib/firebase/serverTime.js'
import { MAX_PENDING, MAX_DURATION_SEC } from '../../utils/constants.js'

/**
 * Adds a video to the queue. Uses an atomic multi-path update to write
 * both the queue item and increment the user's pending counter in one shot.
 * This ensures the security rules see a consistent state.
 *
 * @param {Object} options
 * @param {boolean} [options.isAdmin] - If true, bypasses the queue cap
 */
export async function addToQueue(code, uid, displayName, video, { isAdmin = false } = {}) {
  // Client-side checks (rules enforce these too, but better UX to catch early)
  if (video.durationSec > MAX_DURATION_SEC) {
    throw new Error(`Videos must be ${MAX_DURATION_SEC / 60} minutes or shorter.`)
  }

  // Count current pending items for this user
  const memberRef = ref(db, `rooms/${code}/members/${uid}/pending`)
  const pendingSnap = await get(memberRef)
  const currentPending = pendingSnap.val() || 0

  if (!isAdmin && currentPending >= MAX_PENDING) {
    throw new Error(`You already have ${MAX_PENDING} videos queued. A slot frees up when one of yours starts playing.`)
  }

  // Generate a push ID for the new queue item
  const newItemRef = push(ref(db, `rooms/${code}/queue`))
  const newItemId = newItemRef.key

  // Atomic write: queue item + updated pending count
  const updates = {
    [`rooms/${code}/queue/${newItemId}`]: {
      videoId: video.videoId,
      title: video.title,
      channel: video.channel,
      thumbnail: video.thumbnail,
      durationSec: video.durationSec,
      addedBy: uid,
      addedByName: displayName,
      addedAt: serverTimestamp(),
    },
    [`rooms/${code}/members/${uid}/pending`]: currentPending + 1,
  }

  await update(ref(db), updates)
  return newItemId
}

/**
 * Removes a queue item. The caller must be the owner or the host.
 * Decrements the owner's pending counter.
 */
export async function removeFromQueue(code, itemId, ownerUid) {
  const memberRef = ref(db, `rooms/${code}/members/${ownerUid}/pending`)
  const pendingSnap = await get(memberRef)
  const currentPending = pendingSnap.val() || 0

  const updates = {
    [`rooms/${code}/queue/${itemId}`]: null,
    [`rooms/${code}/members/${ownerUid}/pending`]: Math.max(0, currentPending - 1),
  }

  await update(ref(db), updates)
}
