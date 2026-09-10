import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore.js'
import { joinRoom } from './roomService.js'
import { useRoom } from './useRoom.js'
import { usePresence } from './usePresence.js'
import { useHostPromotion } from './useHostPromotion.js'
import { usePlayback } from '../player/usePlayback.js'
import { useQueue } from '../queue/useQueue.js'
import { advanceQueue, autoStartIfIdle } from '../player/playbackService.js'
import PlayerView from '../player/PlayerView.jsx'
import MemberList from './MemberList.jsx'
import QueueList from '../queue/QueueList.jsx'
import AddVideoPanel from '../queue/AddVideoPanel.jsx'

export default function RoomPage() {
  const { code } = useParams()
  const navigate = useNavigate()

  const uid = useAppStore((s) => s.uid)
  const displayName = useAppStore((s) => s.displayName)
  const roomCode = useAppStore((s) => s.roomCode)
  const isHost = useAppStore((s) => s.isHost)
  const queue = useAppStore((s) => s.queue)
  const playback = useAppStore((s) => s.playback)
  const setRoom = useAppStore((s) => s.setRoom)
  const leaveRoom = useAppStore((s) => s.leaveRoom)

  const [joining, setJoining] = useState(false)
  const [error, setError] = useState(null)

  // If user navigated directly to /room/CODE (e.g. shared link), auto-join
  useEffect(() => {
    if (!code || !uid || roomCode === code) return

    async function autoJoin() {
      setJoining(true)
      try {
        await joinRoom(code, uid, displayName)
        setRoom(code, false)
      } catch (err) {
        setError(err.message)
      } finally {
        setJoining(false)
      }
    }

    autoJoin()
  }, [code, uid, displayName, roomCode, setRoom])

  // Subscribe to live room data
  useRoom(code)
  usePlayback(code)
  useQueue(code)

  // Wire up presence (online/offline tracking)
  usePresence(code, uid, displayName)

  // Auto-promote to host if current host is offline
  useHostPromotion(code)

  // Auto-start: when queue goes from empty to non-empty while idle
  useEffect(() => {
    if (!isHost || !code || !uid) return
    autoStartIfIdle(code, uid, queue, playback).catch(console.error)
  }, [isHost, code, uid, queue, playback])

  // Called when the current video ends — host advances to next
  const handleVideoEnd = useCallback(() => {
    if (!isHost || !code || !uid) return
    advanceQueue(code, uid, queue).catch(console.error)
  }, [isHost, code, uid, queue])

  function handleLeave() {
    leaveRoom()
    navigate('/')
  }

  function handleCopyCode() {
    const url = `${window.location.origin}/room/${code}`
    navigator.clipboard.writeText(url).catch(() => {
      navigator.clipboard.writeText(code)
    })
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh gap-4 p-6">
        <p className="text-red-400 text-lg font-semibold">Could not join room</p>
        <p className="text-neutral-400 text-sm">{error}</p>
        <Link
          to="/"
          className="mt-2 text-sm text-neutral-500 hover:text-neutral-300 underline underline-offset-4"
        >
          ← Back to Home
        </Link>
      </div>
    )
  }

  if (joining) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-600 border-t-red-500 rounded-full animate-spin" />
          <p className="text-neutral-500 text-sm">Joining room…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">YouTube Jam</h1>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm px-3 py-1 rounded-lg border border-neutral-700 transition-colors"
            title="Copy invite link"
          >
            <span className="tracking-widest font-mono">{code}</span>
            <span className="text-neutral-500 text-xs">📋</span>
          </button>
          {isHost && (
            <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full">
              Host
            </span>
          )}
        </div>
        <button
          onClick={handleLeave}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Leave
        </button>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Left: Player */}
        <div className="flex-1 flex flex-col gap-4">
          <PlayerView onVideoEnd={handleVideoEnd} />
        </div>

        {/* Right: Sidebar */}
        <aside className="w-full lg:w-80 flex flex-col gap-4">
          <MemberList />

          <div className="flex flex-col gap-3 bg-neutral-900/50 rounded-xl border border-neutral-800 p-4">
            <h3 className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">
              Queue
            </h3>
            <AddVideoPanel />
            <QueueList />
          </div>
        </aside>
      </main>
    </div>
  )
}
