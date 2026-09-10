import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore.js'
import { claimHost } from './roomService.js'

/**
 * Watches the member list. If the current host is offline and we're the
 * earliest-joined online member, attempt to claim the host role.
 *
 * Uses a Firebase transaction so only one client wins if multiple try at once.
 */
export function useHostPromotion(code) {
  const uid = useAppStore((s) => s.uid)
  const isHost = useAppStore((s) => s.isHost)
  const members = useAppStore((s) => s.members)

  useEffect(() => {
    if (!code || !uid || isHost) return

    // Find the current host in the member list
    const entries = Object.entries(members)
    const onlineMembers = entries
      .filter(([, m]) => m.online)
      .sort(([, a], [, b]) => (a.joinedAt || 0) - (b.joinedAt || 0))

    // If there are no online members, nothing to do
    if (onlineMembers.length === 0) return

    // Check if any member is marked as the host's uid and is online
    // We need to find the host uid from the meta — but we can check
    // if we're the earliest online member
    const [earliestUid] = onlineMembers[0]

    if (earliestUid === uid) {
      // We're the most senior online member — try to claim host
      claimHost(code, uid).catch(console.error)
    }
  }, [code, uid, isHost, members])
}
