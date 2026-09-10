import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, signInAsGuest } from '../lib/firebase/auth.js'

/**
 * Wraps the entire app. Ensures an anonymous Firebase user exists before
 * rendering children. Shows a loading spinner while auth initializes.
 *
 * This means every component below AuthGate can safely assume auth.currentUser
 * is non-null — no defensive null-checks scattered everywhere.
 */
export default function AuthGate({ children }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          await signInAsGuest()
          // onAuthStateChanged will fire again with the new user
          return
        }
        setReady(true)
      } catch (err) {
        console.error('Auth failed:', err)
        setError(err.message)
      }
    })

    return unsubscribe
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh gap-4 p-6 text-center">
        <p className="text-red-400 text-lg font-semibold">
          Could not connect
        </p>
        <p className="text-neutral-400 text-sm max-w-sm">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-neutral-500 hover:text-neutral-300 underline underline-offset-4"
        >
          Reload
        </button>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-600 border-t-red-500 rounded-full animate-spin" />
          <p className="text-neutral-500 text-sm">Connecting…</p>
        </div>
      </div>
    )
  }

  return children
}
