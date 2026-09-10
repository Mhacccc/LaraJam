import { useAppStore } from '../../store/useAppStore.js'

/**
 * Displays the list of users currently in the room.
 * Green dot = online, gray dot = offline.
 */
export default function MemberList() {
  const members = useAppStore((s) => s.members)
  const uid = useAppStore((s) => s.uid)

  const entries = Object.entries(members)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">
        In the room ({entries.filter(([, m]) => m.online).length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {entries
          .sort(([, a], [, b]) => (a.joinedAt || 0) - (b.joinedAt || 0))
          .map(([memberId, member]) => (
            <div
              key={memberId}
              className="flex items-center gap-2 bg-neutral-800/60 px-3 py-1.5 rounded-lg text-sm"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  member.online ? 'bg-green-500' : 'bg-neutral-600'
                }`}
              />
              <span className={member.online ? 'text-white' : 'text-neutral-500'}>
                {member.name || 'Guest'}
              </span>
              {memberId === uid && (
                <span className="text-neutral-600 text-xs">(you)</span>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
