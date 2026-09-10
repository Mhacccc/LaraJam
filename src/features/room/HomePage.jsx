import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore.js'
import { createRoom, roomExists } from './roomService.js'

export default function HomePage() {
  const navigate = useNavigate()
  const uid = useAppStore((s) => s.uid)
  const displayName = useAppStore((s) => s.displayName)
  const setRoom = useAppStore((s) => s.setRoom)

  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const code = await createRoom(uid, displayName)
      setRoom(code, true)
      navigate(`/room/${code}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return

    setLoading(true)
    setError(null)
    try {
      const exists = await roomExists(code)
      if (!exists) {
        setError('Room not found. Check the code and try again.')
        return
      }
      setRoom(code, false)
      navigate(`/room/${code}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh gap-8 p-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-bold text-white tracking-tight">
          YouTube Jam
        </h1>
        <p className="text-neutral-400 text-lg max-w-md text-center">
          Watch YouTube videos together. Create a room, share the code,
          and build a queue with friends.
        </p>
        <p className="text-neutral-500 text-sm">
          Playing as <span className="text-white font-medium">{displayName}</span>
        </p>
      </div>

      {/* Create */}
      <button
        onClick={handleCreate}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-lg"
      >
        {loading ? 'Creating…' : 'Create Room'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 w-full max-w-xs">
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-neutral-600 text-sm">or join</span>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      {/* Join */}
      <form onSubmit={handleJoin} className="flex gap-3 w-full max-w-xs">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Room code"
          maxLength={6}
          className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-center text-lg tracking-widest uppercase focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || joinCode.trim().length === 0}
          className="bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-semibold px-5 py-3 rounded-xl border border-neutral-700 transition-colors"
        >
          Join
        </button>
      </form>

      {error && (
        <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>
      )}
    </div>
  )
}
