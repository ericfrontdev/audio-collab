import { create } from 'zustand'

/**
 * Playback Store
 *
 * Manages audio playback state and transport controls.
 * Separate from audio engine logic - this is pure state.
 */

interface PlaybackState {
  // Playback state
  isPlaying: boolean
  currentTime: number // seconds
  maxDuration: number // seconds

  // Track durations (loaded from audio files)
  trackDurations: Map<string, number>

  // Actions
  setPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setMaxDuration: (duration: number) => void
  setTrackDuration: (trackId: string, duration: number) => void
  removeTrackDuration: (trackId: string) => void

  // Computed
  getMaxDuration: () => number

  // Reset
  reset: () => void
}

const initialState = {
  isPlaying: false,
  currentTime: 0,
  maxDuration: 0,
  trackDurations: new Map<string, number>(),
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  ...initialState,

  setPlaying: (playing) =>
    set({ isPlaying: playing }),

  setCurrentTime: (time) =>
    set({ currentTime: time }),

  setMaxDuration: (duration) =>
    set({ maxDuration: duration }),

  setTrackDuration: (trackId, duration) =>
    set((state) => {
      const newDurations = new Map(state.trackDurations)
      newDurations.set(trackId, duration)

      // Recalculate max duration
      const maxDuration = newDurations.size > 0
        ? Math.max(...Array.from(newDurations.values()))
        : 0

      return {
        trackDurations: newDurations,
        maxDuration,
      }
    }),

  removeTrackDuration: (trackId) =>
    set((state) => {
      const newDurations = new Map(state.trackDurations)
      newDurations.delete(trackId)

      // Recalculate max duration
      const maxDuration = newDurations.size > 0
        ? Math.max(...Array.from(newDurations.values()))
        : 0

      return {
        trackDurations: newDurations,
        maxDuration,
      }
    }),

  getMaxDuration: () => {
    const { trackDurations } = get()
    return trackDurations.size > 0
      ? Math.max(...Array.from(trackDurations.values()))
      : 0
  },

  reset: () =>
    set(initialState),
}))
