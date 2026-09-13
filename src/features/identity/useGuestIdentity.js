import { useEffect } from 'react'
import { auth } from '../../lib/firebase/auth.js'
import { useAppStore } from '../../store/useAppStore.js'
import { ADMIN_SECRET, ADMIN_DISPLAY_NAME } from '../../utils/constants.js'

const STORAGE_KEY = 'ytjam_display_name'
const ADMIN_STORAGE_KEY = 'ytjam_is_admin'

/**
 * Reads the Firebase uid and the locally-stored display name into the store.
 * Detects the admin secret password and maps it to the admin display name.
 */
export function useGuestIdentity() {
  const uid = useAppStore((s) => s.uid)
  const displayName = useAppStore((s) => s.displayName)
  const isAdmin = useAppStore((s) => s.isAdmin)
  const setIdentity = useAppStore((s) => s.setIdentity)

  useEffect(() => {
    const firebaseUid = auth.currentUser?.uid ?? null
    const storedName = localStorage.getItem(STORAGE_KEY)
    const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY) === 'true'
    if (firebaseUid) {
      setIdentity(firebaseUid, storedName, storedAdmin)
    }
  }, [setIdentity])

  function saveName(rawInput) {
    const trimmed = rawInput.trim()
    if (!trimmed) return

    // Check for secret admin password
    const isAdminLogin = trimmed === ADMIN_SECRET
    const finalName = isAdminLogin ? ADMIN_DISPLAY_NAME : trimmed

    localStorage.setItem(STORAGE_KEY, finalName)
    localStorage.setItem(ADMIN_STORAGE_KEY, String(isAdminLogin))
    setIdentity(auth.currentUser?.uid ?? uid, finalName, isAdminLogin)
  }

  return {
    uid,
    displayName,
    isAdmin,
    hasName: Boolean(displayName),
    saveName,
  }
}
