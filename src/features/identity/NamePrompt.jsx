import { useState } from 'react'
import { MAX_NAME_LENGTH } from '../../utils/constants.js'

/**
 * Full-screen prompt that asks for a display name before the user
 * can interact with rooms. Shown only when no name is stored.
 */
export default function NamePrompt({ onSubmit }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH) {
      onSubmit(trimmed)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh gap-6 p-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          YouTube Jam
        </h1>
        <p className="text-neutral-400">
          Pick a name to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-xs">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your display name"
          maxLength={MAX_NAME_LENGTH}
          autoFocus
          className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-center text-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
        />
        <button
          type="submit"
          disabled={name.trim().length === 0}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Continue
        </button>
        <p className="text-neutral-600 text-xs">
          {name.trim().length}/{MAX_NAME_LENGTH} characters
        </p>
      </form>
    </div>
  )
}
