import { useCallback } from 'react'
import { toast } from 'react-toastify'
import { useStudioStore, useMixerStore, useUIStore } from '@/lib/stores'
import type { Track } from '@/lib/stores/useStudioStore'
import {
  deleteTrack,
  createEmptyTrack,
  updateTrackName,
  updateTrackColor,
  duplicateTrack,
  reorderTracks,
} from '@/app/actions/studio/tracks'
import { addTrackComment } from '@/app/actions/studio/comments'
import { deleteTake } from '@/app/actions/studio/takes'
import { toggleRetakeFolder } from '@/app/actions/studio/compedSections'
import { activateRetake, deactivateRetake } from '@/app/actions/studio/retakes'
import { getProjectStudioData } from '@/app/actions/studio/data'

interface UseStudioHandlersProps {
  projectId: string
  tracks: Track[]
  maxDuration: number
  audioEngine: any // TODO: Type this properly
  loadedAudioUrlsRef: React.MutableRefObject<Map<string, string>>
  loadStudioData: (silent?: boolean) => Promise<void>
  // Modal state setters
  setUploadModalOpen: (open: boolean) => void
  setDroppedFile: (file: File | null) => void
  setDraggingFile: (dragging: boolean) => void
  setTrackDurations: React.Dispatch<React.SetStateAction<Map<string, number>>>
  // Context menu handlers
  openContextMenu: (
    trackId: string,
    trackName: string,
    trackColor: string,
    position: { x: number; y: number },
    source: 'track' | 'mixer'
  ) => void
  // Comment modal handlers
  openCommentModal: (
    trackId: string,
    timestamp: number,
    position: { x: number; y: number }
  ) => void
  commentModal: {
    isOpen: boolean
    trackId: string
    timestamp: number
    position: { x: number; y: number }
  }
  addCommentToStore: (trackId: string, comment: any) => void
  // Delete confirmation handlers
  openDeleteConfirmation: (trackId: string, trackName: string) => void
  closeDeleteConfirmation: () => void
  deleteConfirmation: {
    isOpen: boolean
    trackId: string
    trackName: string
  }
  // Delete retake confirmation handlers
  openDeleteRetakeConfirmation: (trackId: string, takeId: string, retakeNumber: number) => void
  closeDeleteRetakeConfirmation: () => void
  deleteRetakeConfirmation: {
    isOpen: boolean
    trackId: string
    takeId: string
    retakeNumber: number
  }
  // Context menu state
  contextMenu: {
    isOpen: boolean
    trackId: string
    trackName: string
    trackColor: string
    position: { x: number; y: number }
    source: 'track' | 'mixer' | null
  }
}

export function useStudioHandlers(props: UseStudioHandlersProps) {
  const {
    projectId,
    tracks,
    maxDuration,
    audioEngine,
    loadedAudioUrlsRef,
    loadStudioData,
    setUploadModalOpen,
    setDroppedFile,
    setDraggingFile,
    setTrackDurations,
    openContextMenu,
    openCommentModal,
    commentModal,
    addCommentToStore,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    deleteConfirmation,
    openDeleteRetakeConfirmation,
    closeDeleteRetakeConfirmation,
    deleteRetakeConfirmation,
    contextMenu,
  } = props

  // Store actions
  const setTracks = useStudioStore((state) => state.setTracks)
  const updateTrackInStore = useStudioStore((state) => state.updateTrack)
  const removeTrackFromStore = useStudioStore((state) => state.removeTrack)
  const selectedTrackId = useUIStore((state) => state.selectedTrackId)
  const setSelectedTrackId = useUIStore((state) => state.setSelectedTrackId)
  const setRenamingTrackHeaderId = useUIStore((state) => state.setRenamingTrackHeaderId)
  const setRenamingMixerChannelId = useUIStore((state) => state.setRenamingMixerChannelId)
  const setMasterVolume = useMixerStore((state) => state.setMasterVolume)
  const setMasterPan = useMixerStore((state) => state.setMasterPan)
  const setMasterMute = useMixerStore((state) => state.setMasterMute)
  const masterMute = useMixerStore((state) => state.masterMute)

  const handleUploadSuccess = async (trackId: string) => {
    // Fetch the updated track data
    const result = await getProjectStudioData(projectId)
    if (result.success && result.tracks) {
      const updatedTrack = result.tracks.find(t => t.id === trackId)
      if (updatedTrack) {
        // Check if this is a new track or an existing one
        const existingTrack = tracks.find(track => track.id === trackId)
        if (existingTrack) {
          // Update existing track, but preserve local UI state
          updateTrackInStore(trackId, {
            ...(updatedTrack as Track),
            // Preserve folder open state (don't auto-open on upload)
            is_retake_folder_open: existingTrack.is_retake_folder_open || false
          })
        } else {
          // Add new track (folder closed by default)
          const addTrackToStore = useStudioStore.getState().addTrack
          addTrackToStore({
            ...(updatedTrack as Track),
            is_retake_folder_open: false
          })
        }
      }
    }
  }

  const handleAddTrack = async () => {
    const result = await createEmptyTrack(projectId)
    if (result.success && result.track) {
      toast.success('Track created')
      // Add the new track to the state with proper structure
      const newTrack: Track = {
        ...result.track,
        takes: [],
        comments: [],
        mixer_settings: null,
        is_retake_folder_open: false,
      }
      setTracks([...tracks, newTrack])
      setSelectedTrackId(result.track.id)
    } else {
      toast.error(result.error || 'Failed to create track')
    }
  }

  const handleImport = (trackId: string) => {
    setSelectedTrackId(trackId)
    setUploadModalOpen(true)
  }

  const handleToggleTakes = async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    const newState = !track.is_retake_folder_open

    // Optimistic update
    updateTrackInStore(trackId, { is_retake_folder_open: newState })

    // Update server
    const result = await toggleRetakeFolder(trackId, newState)
    if (!result.success) {
      toast.error(result.error || 'Failed to toggle retake folder')
      loadStudioData() // Revert on error
    }
  }

  // Helper to reload a track's audio (used after section changes)
  const reloadTrackAudio = useCallback(async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    // Get active take using active_take_id
    const activeTake = track.takes?.find((t) => t.id === track.active_take_id)

    if (!activeTake?.audio_url) return

    const mixerSettings = track.mixer_settings
    const volume = mixerSettings?.volume !== undefined ? mixerSettings.volume / 100 : 0.8
    const pan = mixerSettings?.pan !== undefined ? mixerSettings.pan / 100 : 0

    // Load track audio (simple, no comping)
    audioEngine.loadTrack(trackId, activeTake.audio_url, volume, pan)
  }, [tracks, audioEngine])

  const handleRetakeActivated = useCallback(async (trackId: string, takeId: string, isCurrentlyActive: boolean) => {
    // If clicking on an already active retake, deactivate it and return to original
    if (isCurrentlyActive) {
      console.log('🔄 Deactivating retake and returning to original')
      const result = await deactivateRetake(trackId)
      if (result.success) {
        toast.success('Returned to original take')
        // Force reload by clearing the loaded URL cache
        loadedAudioUrlsRef.current.delete(trackId)
        await loadStudioData(true) // Silent reload
      } else {
        toast.error(result.error || 'Failed to deactivate retake')
      }
      return
    }

    // Normal activation
    console.log('🎵 Activating retake:', { trackId, takeId })
    const result = await activateRetake(trackId, takeId)

    if (result.success) {
      toast.success('Retake activated')
      // Force reload by clearing the loaded URL cache
      loadedAudioUrlsRef.current.delete(trackId)
      await loadStudioData(true) // Silent reload
    } else {
      toast.error(result.error || 'Failed to activate retake')
    }
  }, [loadStudioData, loadedAudioUrlsRef])

  const handleTrackContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault()
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    openContextMenu(
      trackId,
      track.name,
      track.color,
      { x: e.clientX, y: e.clientY },
      'track'
    )
  }

  const handleMixerContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault()
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    openContextMenu(
      trackId,
      track.name,
      track.color,
      { x: e.clientX, y: e.clientY },
      'mixer'
    )
  }

  const handleRenameFromTrack = (trackId: string) => {
    setRenamingTrackHeaderId(trackId)
  }

  const handleRenameFromMixer = (trackId: string) => {
    setRenamingMixerChannelId(trackId)
  }

  const handleTrackRename = async (trackId: string, newName: string) => {
    if (!newName.trim()) {
      setRenamingTrackHeaderId(null)
      setRenamingMixerChannelId(null)
      return
    }

    // Optimistic update
    updateTrackInStore(trackId, { name: newName })
    setRenamingTrackHeaderId(null)
    setRenamingMixerChannelId(null)

    // Update server
    const result = await updateTrackName(trackId, newName)
    if (!result.success) {
      toast.error(result.error || 'Failed to rename track')
      loadStudioData()
    }
  }

  const handleCancelRename = () => {
    setRenamingTrackHeaderId(null)
    setRenamingMixerChannelId(null)
  }

  const handleTracksReorder = async (trackIds: string[]) => {
    // Optimistic update - reorder tracks locally
    const reorderTracksInStore = useStudioStore.getState().reorderTracks
    reorderTracksInStore(trackIds)

    // Update server in background
    const result = await reorderTracks(projectId, trackIds)
    if (!result.success) {
      toast.error(result.error || 'Failed to reorder tracks')
      loadStudioData() // Revert on error
    }
  }

  const handleColorChange = async (trackId: string, color: string) => {
    // Optimistic update - update local state immediately
    updateTrackInStore(trackId, { color })

    // Update context menu color too
    if (contextMenu.trackId === trackId) {
      openContextMenu(
        contextMenu.trackId,
        contextMenu.trackName,
        color, // Updated color
        contextMenu.position,
        contextMenu.source!
      )
    }

    // Update server in background
    const result = await updateTrackColor(trackId, color)
    if (!result.success) {
      // Revert on error
      toast.error(result.error || 'Failed to update color')
      loadStudioData()
    }
  }

  const handleDuplicate = async (trackId: string) => {
    const result = await duplicateTrack(trackId)
    if (result.success) {
      toast.success('Track duplicated')
      loadStudioData()
    } else {
      toast.error(result.error || 'Failed to duplicate track')
    }
  }

  const handleDeleteTrack = (trackId: string, trackName: string) => {
    openDeleteConfirmation(trackId, trackName)
  }

  const confirmDeleteTrack = async () => {
    const { trackId, trackName } = deleteConfirmation
    closeDeleteConfirmation()

    const result = await deleteTrack(trackId)
    if (result.success) {
      removeTrackFromStore(trackId)
      if (selectedTrackId === trackId) {
        setSelectedTrackId(null)
      }
      toast.success(`Track "${trackName}" deleted successfully`)
    } else {
      toast.error(result.error || 'Failed to delete track')
    }
  }

  const cancelDeleteTrack = () => {
    closeDeleteConfirmation()
  }

  const handleDeleteRetake = (trackId: string, takeId: string, retakeNumber: number) => {
    openDeleteRetakeConfirmation(trackId, takeId, retakeNumber)
  }

  const confirmDeleteRetake = async () => {
    const { trackId, takeId, retakeNumber } = deleteRetakeConfirmation
    closeDeleteRetakeConfirmation()

    const result = await deleteTake(takeId)
    if (result.success) {
      // Update tracks state to remove the deleted take
      const removeTakeFromStore = useStudioStore.getState().removeTake
      removeTakeFromStore(trackId, takeId)
      toast.success(`Retake #${retakeNumber} deleted successfully`)
    } else {
      toast.error(result.error || 'Failed to delete retake')
    }
  }

  const cancelDeleteRetake = () => {
    closeDeleteRetakeConfirmation()
  }

  // Master channel handlers
  const handleMasterVolumeChange = (volume: number) => {
    setMasterVolume(volume)
    audioEngine.setMasterVolume(volume)
  }

  const handleMasterPanChange = (pan: number) => {
    setMasterPan(pan)
    audioEngine.setMasterPan(pan)
  }

  const handleMasterMuteToggle = () => {
    const newMute = !masterMute
    setMasterMute(newMute)
    audioEngine.setMasterMute(newMute)
  }

  // Handle waveform ready - store the loaded duration
  const handleWaveformReady = useCallback((trackId: string, duration: number) => {
    setTrackDurations((prev) => {
      const newMap = new Map(prev)
      newMap.set(trackId, duration)
      return newMap
    })
  }, [setTrackDurations])

  const handleWaveformClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, trackId: string) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const timestamp = percentage * maxDuration

      openCommentModal(
        trackId,
        timestamp,
        { x: e.clientX, y: e.clientY }
      )
    },
    [maxDuration, openCommentModal]
  )

  const handleCommentSubmit = useCallback(
    async (text: string, timestamp: number) => {
      const result = await addTrackComment(commentModal.trackId, timestamp, text)
      if (result.success && result.comment) {
        toast.success('Comment added!')
        addCommentToStore(commentModal.trackId, result.comment)
      } else {
        toast.error(result.error || 'Failed to add comment')
      }
    },
    [commentModal.trackId, addCommentToStore]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingFile(true)
  }, [setDraggingFile])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingFile(false)
  }, [setDraggingFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingFile(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      setDroppedFile(file)
      setUploadModalOpen(true)
    }
  }, [setDraggingFile, setDroppedFile, setUploadModalOpen])

  return {
    handleUploadSuccess,
    handleAddTrack,
    handleImport,
    handleToggleTakes,
    reloadTrackAudio,
    handleRetakeActivated,
    handleTrackContextMenu,
    handleMixerContextMenu,
    handleRenameFromTrack,
    handleRenameFromMixer,
    handleTrackRename,
    handleCancelRename,
    handleTracksReorder,
    handleColorChange,
    handleDuplicate,
    handleDeleteTrack,
    confirmDeleteTrack,
    cancelDeleteTrack,
    handleDeleteRetake,
    confirmDeleteRetake,
    cancelDeleteRetake,
    handleMasterVolumeChange,
    handleMasterPanChange,
    handleMasterMuteToggle,
    handleWaveformReady,
    handleWaveformClick,
    handleCommentSubmit,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
