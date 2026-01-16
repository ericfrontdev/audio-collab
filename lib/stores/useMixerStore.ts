import { create } from 'zustand'

/**
 * Mixer Store
 *
 * Manages mixer state for all tracks and master channel.
 * Separate from audio engine - this is pure UI state.
 */

export type FXType = 'eq' | 'compressor' | 'reverb' | 'none'

export interface FXSettings {
  type: FXType
  bypassed: boolean
  eq: {
    enabled: boolean
    low: number // 0-1 normalized
    mid: number
    high: number
  }
  compressor: {
    enabled: boolean
    threshold: number // 0-1 normalized
    ratio: number
    attack: number
    release: number
  }
  reverb: {
    enabled: boolean
    decay: number // 0-1 normalized
    wet: number
  }
}

interface TrackMixerState {
  volume: number // 0-100 (UI range)
  pan: number // -100 to 100 (UI range)
  mute: boolean
  solo: boolean
  fx: FXSettings
}

interface MixerState {
  // Per-track mixer state (UI values 0-100, -100 to 100)
  tracks: Map<string, TrackMixerState>

  // Master channel (UI values)
  masterVolume: number // 0-100
  masterPan: number // -100 to 100
  masterMute: boolean

  // Audio levels (for VU meters)
  trackLevels: Map<string, { level: number; peak: number }>
  masterLevel: { level: number; peak: number }

  // Actions - Track controls
  setTrackVolume: (trackId: string, volume: number) => void
  setTrackPan: (trackId: string, pan: number) => void
  setTrackMute: (trackId: string, mute: boolean) => void
  setTrackSolo: (trackId: string, solo: boolean) => void
  setTrackFX: (trackId: string, fx: FXSettings) => void
  setTrackFXType: (trackId: string, type: FXType) => void
  setTrackFXBypassed: (trackId: string, bypassed: boolean) => void
  initializeTrack: (trackId: string, state: TrackMixerState) => void
  removeTrack: (trackId: string) => void

  // Actions - Master controls
  setMasterVolume: (volume: number) => void
  setMasterPan: (pan: number) => void
  setMasterMute: (mute: boolean) => void

  // Actions - Audio levels
  setTrackLevel: (trackId: string, level: number, peak: number) => void
  setMasterLevel: (level: number, peak: number) => void

  // Helpers
  getTrackState: (trackId: string) => TrackMixerState | undefined
  getAllSoloedTracks: () => string[]
  isSoloActive: () => boolean

  // Reset
  reset: () => void
}

const initialState = {
  tracks: new Map<string, TrackMixerState>(),
  masterVolume: 80,
  masterPan: 0,
  masterMute: false,
  trackLevels: new Map<string, { level: number; peak: number }>(),
  masterLevel: { level: 0, peak: 0 },
}

const defaultFXSettings: FXSettings = {
  type: 'none',
  bypassed: false,
  eq: {
    enabled: true,
    low: 0.5, // 0dB normalized
    mid: 0.5,
    high: 0.5,
  },
  compressor: {
    enabled: true,
    threshold: 0.5, // -30dB normalized
    ratio: 0.2, // 4:1 normalized
    attack: 0.01,
    release: 0.25,
  },
  reverb: {
    enabled: true,
    decay: 0.15, // 1.5s normalized
    wet: 0.3,
  },
}

const defaultTrackState: TrackMixerState = {
  volume: 80,
  pan: 0,
  mute: false,
  solo: false,
  fx: defaultFXSettings,
}

export const useMixerStore = create<MixerState>((set, get) => ({
  ...initialState,

  // Track controls
  setTrackVolume: (trackId, volume) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId) || { ...defaultTrackState }
      tracks.set(trackId, { ...trackState, volume })
      return { tracks }
    }),

  setTrackPan: (trackId, pan) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId) || { ...defaultTrackState }
      tracks.set(trackId, { ...trackState, pan })
      return { tracks }
    }),

  setTrackMute: (trackId, mute) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId) || { ...defaultTrackState }
      tracks.set(trackId, { ...trackState, mute })
      return { tracks }
    }),

  setTrackSolo: (trackId, solo) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId) || { ...defaultTrackState }
      tracks.set(trackId, { ...trackState, solo })
      return { tracks }
    }),

  setTrackFX: (trackId, fx) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId) || { ...defaultTrackState }
      tracks.set(trackId, { ...trackState, fx })
      return { tracks }
    }),

  setTrackFXType: (trackId, type) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId) || { ...defaultTrackState }
      tracks.set(trackId, {
        ...trackState,
        fx: { ...trackState.fx, type, bypassed: false }
      })
      return { tracks }
    }),

  setTrackFXBypassed: (trackId, bypassed) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId) || { ...defaultTrackState }
      tracks.set(trackId, {
        ...trackState,
        fx: { ...trackState.fx, bypassed }
      })
      return { tracks }
    }),

  initializeTrack: (trackId, state) =>
    set((prevState) => {
      const tracks = new Map(prevState.tracks)
      tracks.set(trackId, state)
      return { tracks }
    }),

  removeTrack: (trackId) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      tracks.delete(trackId)
      const trackLevels = new Map(state.trackLevels)
      trackLevels.delete(trackId)
      return { tracks, trackLevels }
    }),

  // Master controls
  setMasterVolume: (volume) =>
    set({ masterVolume: volume }),

  setMasterPan: (pan) =>
    set({ masterPan: pan }),

  setMasterMute: (mute) =>
    set({ masterMute: mute }),

  // Audio levels
  setTrackLevel: (trackId, level, peak) =>
    set((state) => {
      const trackLevels = new Map(state.trackLevels)
      trackLevels.set(trackId, { level, peak })
      return { trackLevels }
    }),

  setMasterLevel: (level, peak) =>
    set({ masterLevel: { level, peak } }),

  // Helpers
  getTrackState: (trackId) => {
    const { tracks } = get()
    return tracks.get(trackId)
  },

  getAllSoloedTracks: () => {
    const { tracks } = get()
    const soloed: string[] = []
    tracks.forEach((state, trackId) => {
      if (state.solo) soloed.push(trackId)
    })
    return soloed
  },

  isSoloActive: () => {
    const { tracks } = get()
    for (const state of tracks.values()) {
      if (state.solo) return true
    }
    return false
  },

  reset: () =>
    set(initialState),
}))
