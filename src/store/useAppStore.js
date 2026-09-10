import { create } from 'zustand'

/**
 * Central app store. Flat shape — every top-level key is independently
 * subscribable, so a component watching `queue` won't re-render when
 * `playback` changes.
 */
export const useAppStore = create((set) => ({
  // Identity — set once on auth + name prompt
  uid: null,
  displayName: null,

  // Room — set when creating or joining
  roomCode: null,
  isHost: false,

  // Live data from Firebase listeners
  members: {},
  queue: [],
  playback: null,

  // Actions
  setIdentity: (uid, displayName) => set({ uid, displayName }),
  setRoom: (roomCode, isHost) => set({ roomCode, isHost }),
  setIsHost: (isHost) => set({ isHost }),
  setMembers: (members) => set({ members }),
  setQueue: (queue) => set({ queue }),
  setPlayback: (playback) => set({ playback }),

  // Full reset when leaving a room
  leaveRoom: () =>
    set({
      roomCode: null,
      isHost: false,
      members: {},
      queue: [],
      playback: null,
    }),
}))
