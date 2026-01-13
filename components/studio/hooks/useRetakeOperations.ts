/**
 * Retake Operations Hook
 *
 * Manages retake/take operations within tracks.
 */

import { useCallback } from 'react'
import { toast } from 'react-toastify'
import type { Track } from '@/lib/stores/useStudioStore'
import { useStudioStore } from '@/lib/stores'
import {
  toggleRetakeFolder,
  activateRetake,
  deactivateRetake,
} from '@/app/actions/studio/retakes'
import { deleteTake } from '@/app/actions/studio/takes'

interface DeleteRetakeConfirmationState {
  isOpen: boolean
  trackId: string
  takeId: string
  retakeNumber: number
}

export interface UseRetakeOperationsProps {
  tracks: Track[]
  loadedAudioUrlsRef: React.MutableRefObject<Map<string, string>>
  deleteRetakeConfirmation: DeleteRetakeConfirmationState
  updateTrackInStore: (id: string, updates: Partial<Track>) => void
  openDeleteRetakeConfirmation: (
    trackId: string,
    takeId: string,
    retakeNumber: number
  ) => void
  closeDeleteRetakeConfirmation: () => void
  loadStudioData: (silent?: boolean) => Promise<void>
}

export interface UseRetakeOperationsReturn {
  handleToggleTakes: (trackId: string) => Promise<void>
  handleRetakeActivated: (
    trackId: string,
    takeId: string,
    isCurrentlyActive: boolean
  ) => Promise<void>
  handleDeleteRetake: (trackId: string, takeId: string, retakeNumber: number) => void
  confirmDeleteRetake: () => Promise<void>
  cancelDeleteRetake: () => void
}

export function useRetakeOperations({
  tracks,
  loadedAudioUrlsRef,
  deleteRetakeConfirmation,
  updateTrackInStore,
  openDeleteRetakeConfirmation,
  closeDeleteRetakeConfirmation,
  loadStudioData,
}: UseRetakeOperationsProps): UseRetakeOperationsReturn {
  /**
   * Toggle retake folder open/closed
   */
  const handleToggleTakes = async (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId)
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

  /**
   * Activate or deactivate a retake
   * If clicking on already active retake, deactivate and return to original
   */
  const handleRetakeActivated = useCallback(
    async (trackId: string, takeId: string, isCurrentlyActive: boolean) => {
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
    },
    [loadStudioData, loadedAudioUrlsRef]
  )

  /**
   * Open delete retake confirmation modal
   */
  const handleDeleteRetake = (
    trackId: string,
    takeId: string,
    retakeNumber: number
  ) => {
    openDeleteRetakeConfirmation(trackId, takeId, retakeNumber)
  }

  /**
   * Confirm and execute retake deletion
   */
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

  /**
   * Cancel retake deletion
   */
  const cancelDeleteRetake = () => {
    closeDeleteRetakeConfirmation()
  }

  return {
    handleToggleTakes,
    handleRetakeActivated,
    handleDeleteRetake,
    confirmDeleteRetake,
    cancelDeleteRetake,
  }
}
