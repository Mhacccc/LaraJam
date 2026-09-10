import { useEffect } from 'react'
import { auth } from '../../lib/firebase/auth.js'
import { useAppStore } from '../../store/useAppStore.js'

const STORAGE_KEY = 'ytjam_display_name'

/**
 * Reads the Firebase uid and the locally-stored display name into the store.
 * Returns { uid, displayName, hasName, saveName }.
 *
 * - uid comes from Firebase Anonymous Auth (always available after AuthGate).
 * - displayName comes from localStorage so it survives refresh.
 * - saveName(name) writes to both the store and localStorage.
 */
export function useGuestIdentity() {
  const uid = useAppStore((s) => s.uid)
  const displayName = useAppStore((s) => s.displayName)
  const setIdentity = useAppStore((s) => s.setIdentity)

  useEffect(() => {
    const firebaseUid = auth.currentUser?.uid ?? null
    const storedName = localStorage.getItem(STORAGE_KEY)
    if (firebaseUid) {
      setIdentity(firebaseUid, storedName)
    }
  }, [setIdentity])

  function saveName(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    setIdentity(auth.currentUser?.uid ?? uid, trimmed)
  }

  return {
    uid,
    displayName,
    hasName: Boolean(displayName),
    saveName,
  }
}
