import { ref, update, get } from 'firebase/database'
import { db } from '../../lib/firebase/db.js'
import { serverTimestamp } from '../../lib/firebase/serverTime.js'

/**
 * All writes to /playback go through here. Only the host should call these.
 * Guests read playback state and correct their local player — they never write.
 */

export function getPlaybackRef(code) {
  return ref(db, `rooms/${code}/playback`)
}

/** Host starts playing a video */
export function writePlay(code, uid, videoId, title, durationSec, position = 0) {
  return update(ref(db, `rooms/${code}/playback`), {
    videoId,
    title,
    durationSec,
    status: 'playing',
    positionAtUpdate: position,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
}

/** Host pauses */
export function writePause(code, uid, currentPosition) {
  return update(ref(db, `rooms/${code}/playback`), {
    status: 'paused',
    positionAtUpdate: currentPosition,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
}

/** Host resumes from pause */
export function writeResume(code, uid, currentPosition) {
  return update(ref(db, `rooms/${code}/playback`), {
    status: 'playing',
    positionAtUpdate: currentPosition,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
}

/** Host seeks to a new position */
export function writeSeek(code, uid, position, wasPlaying) {
  return update(ref(db, `rooms/${code}/playback`), {
    status: wasPlaying ? 'playing' : 'paused',
    positionAtUpdate: position,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
}

/** Set playback to idle (queue empty, nothing to play) */
export function writeIdle(code, uid) {
  return update(ref(db, `rooms/${code}/playback`), {
    status: 'idle',
    videoId: null,
    title: null,
    durationSec: null,
    positionAtUpdate: 0,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
}

/**
 * Advance to the next video in the queue. Host-only.
 * Pops the head of the queue, writes it into /playback, and recomputes
 * pending counters for all members (self-healing on every advance).
 *
 * @param {string} code - Room code
 * @param {string} uid - Host's uid
 * @param {Array} queue - Current queue array from the store
 */
export async function advanceQueue(code, uid, queue) {
  if (!queue || queue.length === 0) {
    return writeIdle(code, uid)
  }

  const [head, ...remaining] = queue

  // Recompute pending counters from the remaining queue
  const pendingCounts = {}
  for (const item of remaining) {
    pendingCounts[item.addedBy] = (pendingCounts[item.addedBy] || 0) + 1
  }

  // Build the atomic update
  const updates = {
    // Remove head from queue
    [`rooms/${code}/queue/${head.id}`]: null,
    // Write new playback state
    [`rooms/${code}/playback`]: {
      videoId: head.videoId,
      itemId: head.id,
      title: head.title,
      durationSec: head.durationSec || 0,
      status: 'playing',
      positionAtUpdate: 0,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    },
  }

  // Recompute pending for all known members
  const membersSnap = await get(ref(db, `rooms/${code}/members`))
  const members = membersSnap.val() || {}
  for (const memberId of Object.keys(members)) {
    updates[`rooms/${code}/members/${memberId}/pending`] =
      pendingCounts[memberId] || 0
  }

  await update(ref(db), updates)
}

/**
 * Auto-start: when the queue goes from empty to non-empty while idle,
 * the host should start the first video automatically.
 */
export async function autoStartIfIdle(code, uid, queue, playback) {
  if (!queue || queue.length === 0) return
  if (playback && playback.status !== 'idle') return

  await advanceQueue(code, uid, queue)
}
