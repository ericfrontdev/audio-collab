import { create } from 'zustand'

/**
 * Studio Store
 *
 * Manages project-level state and tracks data.
 * This is the single source of truth for all track information.
 */

// Track-level types
export interface TakeWithUploader {
  id: string
  track_id: string
  audio_url: string
  duration: number
  waveform_data: number[] | null
  file_size: number | null
  file_format: string | null
  created_at: string
  updated_at: string
  uploader?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export interface CommentWithProfile {
  id: string
  track_id: string
  user_id: string
  timestamp: number
  text: string
  created_at: string
  updated_at: string
  profile?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export interface MixerSettings {
  id: string
  track_id: string
  volume: number // 0-1
  pan: number // -1 to 1
  solo: boolean
  mute: boolean
  created_at: string
  updated_at: string
}

export interface Track {
  id: string
  project_id: string
  name: string
  color: string
  order_index: number
  active_take_id: string | null
  created_by: string
  is_collaborative: boolean
  is_retake_folder_open: boolean
  created_at: string
  updated_at: string
  takes?: TakeWithUploader[]
  comments?: CommentWithProfile[]
  mixer_settings?: MixerSettings | null
}

// Store state interface
interface StudioState {
  // Project info
  projectId: string | null
  projectTitle: string | null
  ownerId: string | null
  currentUserId: string | null

  // Tracks data
  tracks: Track[]

  // Loading states
  isLoading: boolean

  // Actions
  setProjectInfo: (projectId: string, projectTitle: string, ownerId?: string, currentUserId?: string) => void
  setTracks: (tracks: Track[]) => void
  addTrack: (track: Track) => void
  updateTrack: (trackId: string, updates: Partial<Track>) => void
  removeTrack: (trackId: string) => void
  reorderTracks: (trackIds: string[]) => void

  // Take management
  updateActiveTake: (trackId: string, takeId: string) => void
  addTake: (trackId: string, take: TakeWithUploader) => void
  removeTake: (trackId: string, takeId: string) => void

  // Comments
  addComment: (trackId: string, comment: CommentWithProfile) => void
  removeComment: (trackId: string, commentId: string) => void

  // Mixer settings
  updateMixerSettings: (trackId: string, settings: Partial<MixerSettings>) => void

  // Retake folder
  toggleRetakeFolder: (trackId: string) => void

  // Loading
  setLoading: (loading: boolean) => void

  // Reset
  reset: () => void
}

const initialState = {
  projectId: null,
  projectTitle: null,
  ownerId: null,
  currentUserId: null,
  tracks: [],
  isLoading: false,
}

export const useStudioStore = create<StudioState>((set) => ({
  ...initialState,

  setProjectInfo: (projectId, projectTitle, ownerId, currentUserId) =>
    set({ projectId, projectTitle, ownerId, currentUserId }),

  setTracks: (tracks) =>
    set({ tracks }),

  addTrack: (track) =>
    set((state) => ({
      tracks: [...state.tracks, track]
    })),

  updateTrack: (trackId, updates) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, ...updates } : track
      ),
    })),

  removeTrack: (trackId) =>
    set((state) => ({
      tracks: state.tracks.filter((track) => track.id !== trackId),
    })),

  reorderTracks: (trackIds) =>
    set((state) => {
      const trackMap = new Map(state.tracks.map((t) => [t.id, t]))
      return {
        tracks: trackIds
          .map((id) => trackMap.get(id))
          .filter((t): t is Track => t !== undefined),
      }
    }),

  updateActiveTake: (trackId, takeId) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? { ...track, active_take_id: takeId }
          : track
      ),
    })),

  addTake: (trackId, take) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              takes: [...(track.takes || []), take]
            }
          : track
      ),
    })),

  removeTake: (trackId, takeId) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              takes: track.takes?.filter((t) => t.id !== takeId)
            }
          : track
      ),
    })),

  addComment: (trackId, comment) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              comments: [...(track.comments || []), comment]
            }
          : track
      ),
    })),

  removeComment: (trackId, commentId) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              comments: track.comments?.filter((c) => c.id !== commentId)
            }
          : track
      ),
    })),

  updateMixerSettings: (trackId, settings) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              mixer_settings: track.mixer_settings
                ? { ...track.mixer_settings, ...settings }
                : undefined
            }
          : track
      ),
    })),

  toggleRetakeFolder: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? { ...track, is_retake_folder_open: !track.is_retake_folder_open }
          : track
      ),
    })),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  reset: () =>
    set(initialState),
}))
