/**
 * Audio Handlers Hook
 *
 * Manages audio loading, waveform events, and upload handling.
 */

import { useCallback } from 'react'
import type { Track } from '@/lib/stores/useStudioStore'
import { getProjectStudioData } from '@/app/actions/studio/data'
import { useStudioStore } from '@/lib/stores'

export interface UseAudioHandlersProps {
  projectId: string
  tracks: Track[]
  maxDuration: number
  audioEngine: any // TODO: Type this properly
  loadedAudioUrlsRef: React.MutableRefObject<Map<string, string>>
  updateTrackInStore: (id: string, updates: Partial<Track>) => void
  setTrackDurations: React.Dispatch<React.SetStateAction<Map<string, number>>>
  openCommentModal: (
    trackId: string,
    timestamp: number,
    position: { x: number; y: number }
  ) => void
}

export interface UseAudioHandlersReturn {
  handleUploadSuccess: (trackId: string) => Promise<void>
  handleWaveformReady: (trackId: string, duration: number) => void
  handleWaveformClick: (e: React.MouseEvent<HTMLDivElement>, trackId: string) => void
  reloadTrackAudio: (trackId: string) => Promise<void>
}

export function useAudioHandlers({
  projectId,
  tracks,
  maxDuration,
  audioEngine,
  loadedAudioUrlsRef,
  updateTrackInStore,
  setTrackDurations,
  openCommentModal,
}: UseAudioHandlersProps): UseAudioHandlersReturn {
  /**
   * Handle successful audio upload
   * Fetches updated track data and updates store
   */
  const handleUploadSuccess = async (trackId: string) => {
    // Fetch the updated track data
    const result = await getProjectStudioData(projectId)
    if (result.success && result.tracks) {
      const updatedTrack = result.tracks.find((t) => t.id === trackId)
      if (updatedTrack) {
        // Check if this is a new track or an existing one
        const existingTrack = tracks.find((track) => track.id === trackId)
        if (existingTrack) {
          // Update existing track, but preserve local UI state
          updateTrackInStore(trackId, {
            ...(updatedTrack as Track),
            // Preserve folder open state (don't auto-open on upload)
            is_retake_folder_open: existingTrack.is_retake_folder_open || false,
          })
        } else {
          // Add new track (folder closed by default)
          const addTrackToStore = useStudioStore.getState().addTrack
          addTrackToStore({
            ...(updatedTrack as Track),
            is_retake_folder_open: false,
          })
        }
      }
    }
  }

  /**
   * Handle waveform ready event
   * Stores the loaded duration for timeline calculations
   */
  const handleWaveformReady = useCallback(
    (trackId: string, duration: number) => {
      setTrackDurations((prev) => {
        const newMap = new Map(prev)
        newMap.set(trackId, duration)
        return newMap
      })
    },
    [setTrackDurations]
  )

  /**
   * Handle waveform click
   * Opens comment modal at clicked timestamp
   */
  const handleWaveformClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, trackId: string) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const timestamp = percentage * maxDuration

      openCommentModal(trackId, timestamp, { x: e.clientX, y: e.clientY })
    },
    [maxDuration, openCommentModal]
  )

  /**
   * Reload a track's audio
   * Used after section changes or retake activation
   */
  const reloadTrackAudio = useCallback(
    async (trackId: string) => {
      const track = tracks.find((t) => t.id === trackId)
      if (!track) return

      // Get active take using active_take_id
      const activeTake = track.takes?.find((t) => t.id === track.active_take_id)

      if (!activeTake?.audio_url) return

      const mixerSettings = track.mixer_settings
      const volume =
        mixerSettings?.volume !== undefined ? mixerSettings.volume / 100 : 0.8
      const pan = mixerSettings?.pan !== undefined ? mixerSettings.pan / 100 : 0

      // Load track audio (simple, no comping)
      audioEngine.loadTrack(trackId, activeTake.audio_url, volume, pan)
    },
    [tracks, audioEngine]
  )

  return {
    handleUploadSuccess,
    handleWaveformReady,
    handleWaveformClick,
    reloadTrackAudio,
  }
}
