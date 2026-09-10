import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { app } from './config.js'

export const auth = getAuth(app)

/**
 * Signs in anonymously. Firebase persists the session in browser storage,
 * so a page refresh keeps the same uid — the user stays the same person.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export function signInAsGuest() {
  return signInAnonymously(auth)
}

/**
 * Returns a promise that resolves with the current user once auth initializes.
 * Resolves immediately on subsequent calls if auth is already ready.
 * @returns {Promise<import('firebase/auth').User | null>}
 */
export function waitForAuth() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}
