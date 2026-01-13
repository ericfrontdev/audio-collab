/**
 * Track Operations Hook
 *
 * Manages all CRUD operations on tracks: create, read, update, delete,
 * duplicate, reorder, rename, color change.
 */

import { toast } from 'react-toastify'
import type { Track } from '@/lib/stores/useStudioStore'
import { useStudioStore } from '@/lib/stores'
import {
  deleteTrack,
  createEmptyTrack,
  updateTrackName,
  updateTrackColor,
  duplicateTrack,
  reorderTracks,
} from '@/app/actions/studio/tracks'

interface ContextMenuState {
  isOpen: boolean
  trackId: string
  trackName: string
  trackColor: string
  position: { x: number; y: number }
  source: 'track' | 'mixer' | null
}

interface DeleteConfirmationState {
  isOpen: boolean
  trackId: string
  trackName: string
}

export interface UseTrackOperationsProps {
  projectId: string
  tracks: Track[]
  selectedTrackId: string | null
  contextMenu: ContextMenuState
  deleteConfirmation: DeleteConfirmationState
  setTracks: (tracks: Track[]) => void
  updateTrackInStore: (id: string, updates: Partial<Track>) => void
  removeTrackFromStore: (id: string) => void
  setSelectedTrackId: (id: string | null) => void
  setRenamingTrackHeaderId: (id: string | null) => void
  setRenamingMixerChannelId: (id: string | null) => void
  setUploadModalOpen: (open: boolean) => void
  openDeleteConfirmation: (trackId: string, trackName: string) => void
  closeDeleteConfirmation: () => void
  openContextMenu: (
    trackId: string,
    trackName: string,
    trackColor: string,
    position: { x: number; y: number },
    source: 'track' | 'mixer'
  ) => void
  loadStudioData: (silent?: boolean) => Promise<void>
}

export interface UseTrackOperationsReturn {
  handleAddTrack: () => Promise<void>
  handleImport: (trackId: string) => void
  handleRenameFromTrack: (trackId: string) => void
  handleRenameFromMixer: (trackId: string) => void
  handleTrackRename: (trackId: string, newName: string) => Promise<void>
  handleCancelRename: () => void
  handleTracksReorder: (trackIds: string[]) => Promise<void>
  handleColorChange: (trackId: string, color: string) => Promise<void>
  handleDuplicate: (trackId: string) => Promise<void>
  handleDeleteTrack: (trackId: string, trackName: string) => void
  confirmDeleteTrack: () => Promise<void>
  cancelDeleteTrack: () => void
}

export function useTrackOperations({
  projectId,
  tracks,
  selectedTrackId,
  contextMenu,
  deleteConfirmation,
  setTracks,
  updateTrackInStore,
  removeTrackFromStore,
  setSelectedTrackId,
  setRenamingTrackHeaderId,
  setRenamingMixerChannelId,
  setUploadModalOpen,
  openDeleteConfirmation,
  closeDeleteConfirmation,
  openContextMenu,
  loadStudioData,
}: UseTrackOperationsProps): UseTrackOperationsReturn {
  /**
   * Create new empty track
   */
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

  /**
   * Open upload modal for track
   */
  const handleImport = (trackId: string) => {
    setSelectedTrackId(trackId)
    setUploadModalOpen(true)
  }

  /**
   * Start rename from track header
   */
  const handleRenameFromTrack = (trackId: string) => {
    setRenamingTrackHeaderId(trackId)
  }

  /**
   * Start rename from mixer channel
   */
  const handleRenameFromMixer = (trackId: string) => {
    setRenamingMixerChannelId(trackId)
  }

  /**
   * Execute track rename
   */
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

  /**
   * Cancel rename operation
   */
  const handleCancelRename = () => {
    setRenamingTrackHeaderId(null)
    setRenamingMixerChannelId(null)
  }

  /**
   * Reorder tracks via drag-drop
   */
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

  /**
   * Change track color
   */
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

  /**
   * Duplicate track with all takes
   */
  const handleDuplicate = async (trackId: string) => {
    const result = await duplicateTrack(trackId)
    if (result.success) {
      toast.success('Track duplicated')
      loadStudioData()
    } else {
      toast.error(result.error || 'Failed to duplicate track')
    }
  }

  /**
   * Open delete track confirmation modal
   */
  const handleDeleteTrack = (trackId: string, trackName: string) => {
    openDeleteConfirmation(trackId, trackName)
  }

  /**
   * Confirm and execute track deletion
   */
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

  /**
   * Cancel track deletion
   */
  const cancelDeleteTrack = () => {
    closeDeleteConfirmation()
  }

  return {
    handleAddTrack,
    handleImport,
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
  }
}
