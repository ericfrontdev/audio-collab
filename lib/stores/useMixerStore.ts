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
    makeupGain: number // 0-1 normalized
  }
  reverb: {
    enabled: boolean
    decay: number // 0-1 normalized
    wet: number
  }
}

// New FXSlot interface for multi-effect chains
export interface FXSlot {
  id: string // UUID for unique identification
  order: number // 0, 1, or 2 (chain position)
  type: FXType // 'eq' | 'compressor' | 'reverb'
  bypassed: boolean // Individual bypass per slot
  settings: {
    eq: {
      enabled: boolean
      low: number
      mid: number
      high: number
    }
    compressor: {
      enabled: boolean
      threshold: number
      ratio: number
      attack: number
      release: number
      makeupGain: number
    }
    reverb: {
      enabled: boolean
      decay: number
      wet: number
    }
  }
}

interface TrackMixerState {
  volume: number // 0-100 (UI range)
  pan: number // -100 to 100 (UI range)
  mute: boolean
  solo: boolean
  fx: FXSettings // Legacy - kept for backward compatibility
  fxChain: FXSlot[] // New multi-effect chain
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

  // Actions - FX Chain Management (new)
  addFXSlot: (trackId: string, slotType: FXType) => void
  removeFXSlot: (trackId: string, slotId: string) => void
  updateFXSlotSettings: (trackId: string, slotId: string, settings: Partial<FXSlot['settings']>) => void
  setFXSlotType: (trackId: string, slotId: string, type: FXType) => void
  setFXSlotBypassed: (trackId: string, slotId: string, bypassed: boolean) => void

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
    makeupGain: 0.5, // 12dB normalized
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
  fxChain: [], // New: empty FX chain by default
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

  // FX Chain Management
  addFXSlot: (trackId, slotType) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId) || { ...defaultTrackState }
      const currentChain = trackState.fxChain || []

      // Limit to 3 slots
      if (currentChain.length >= 3) return { tracks }

      // Don't add 'none' type to chain
      if (slotType === 'none') return { tracks }

      const newSlot: FXSlot = {
        id: crypto.randomUUID(),
        order: currentChain.length,
        type: slotType,
        bypassed: false,
        settings: {
          eq: { ...defaultFXSettings.eq },
          compressor: { ...defaultFXSettings.compressor },
          reverb: { ...defaultFXSettings.reverb },
        },
      }

      tracks.set(trackId, {
        ...trackState,
        fxChain: [...currentChain, newSlot],
      })
      return { tracks }
    }),

  removeFXSlot: (trackId, slotId) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId)
      if (!trackState) return { tracks }

      const updatedChain = trackState.fxChain
        .filter((slot) => slot.id !== slotId)
        .map((slot, index) => ({ ...slot, order: index })) // Reorder remaining slots

      tracks.set(trackId, {
        ...trackState,
        fxChain: updatedChain,
      })
      return { tracks }
    }),

  updateFXSlotSettings: (trackId, slotId, settings) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId)
      if (!trackState) return { tracks }

      const updatedChain = trackState.fxChain.map((slot) =>
        slot.id === slotId
          ? { ...slot, settings: { ...slot.settings, ...settings } }
          : slot
      )

      tracks.set(trackId, {
        ...trackState,
        fxChain: updatedChain,
      })
      return { tracks }
    }),

  setFXSlotType: (trackId, slotId, type) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId)
      if (!trackState) return { tracks }

      const updatedChain = trackState.fxChain.map((slot) =>
        slot.id === slotId
          ? { ...slot, type, bypassed: false } // Reset bypass when changing type
          : slot
      )

      tracks.set(trackId, {
        ...trackState,
        fxChain: updatedChain,
      })
      return { tracks }
    }),

  setFXSlotBypassed: (trackId, slotId, bypassed) =>
    set((state) => {
      const tracks = new Map(state.tracks)
      const trackState = tracks.get(trackId)
      if (!trackState) return { tracks }

      const updatedChain = trackState.fxChain.map((slot) =>
        slot.id === slotId ? { ...slot, bypassed } : slot
      )

      tracks.set(trackId, {
        ...trackState,
        fxChain: updatedChain,
      })
      return { tracks }
    }),

  reset: () =>
    set(initialState),
}))
