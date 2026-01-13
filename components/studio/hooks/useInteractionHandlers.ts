/**
 * Interaction Handlers Hook
 *
 * Manages user interactions: drag-drop, context menus, and comments.
 */

import { useCallback } from 'react'
import { toast } from 'react-toastify'
import type { Track } from '@/lib/stores/useStudioStore'
import { addTrackComment } from '@/app/actions/studio/comments'

interface CommentModalState {
  isOpen: boolean
  trackId: string
  timestamp: number
  position: { x: number; y: number }
}

export interface UseInteractionHandlersProps {
  tracks: Track[]
  commentModal: CommentModalState
  setDraggingFile: (dragging: boolean) => void
  setDroppedFile: (file: File | null) => void
  setUploadModalOpen: (open: boolean) => void
  openContextMenu: (
    trackId: string,
    trackName: string,
    trackColor: string,
    position: { x: number; y: number },
    source: 'track' | 'mixer'
  ) => void
  addCommentToStore: (trackId: string, comment: any) => void
}

export interface UseInteractionHandlersReturn {
  handleTrackContextMenu: (e: React.MouseEvent, trackId: string) => void
  handleMixerContextMenu: (e: React.MouseEvent, trackId: string) => void
  handleCommentSubmit: (text: string, timestamp: number) => Promise<void>
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
}

export function useInteractionHandlers({
  tracks,
  commentModal,
  setDraggingFile,
  setDroppedFile,
  setUploadModalOpen,
  openContextMenu,
  addCommentToStore,
}: UseInteractionHandlersProps): UseInteractionHandlersReturn {
  /**
   * Open context menu on track header right-click
   */
  const handleTrackContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault()
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return

    openContextMenu(trackId, track.name, track.color, { x: e.clientX, y: e.clientY }, 'track')
  }

  /**
   * Open context menu on mixer channel right-click
   */
  const handleMixerContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault()
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return

    openContextMenu(trackId, track.name, track.color, { x: e.clientX, y: e.clientY }, 'mixer')
  }

  /**
   * Submit comment to track at timestamp
   */
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

  /**
   * Handle file drag over studio
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDraggingFile(true)
    },
    [setDraggingFile]
  )

  /**
   * Handle file drag leave studio
   */
  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDraggingFile(false)
    },
    [setDraggingFile]
  )

  /**
   * Handle file drop on studio
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDraggingFile(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        setDroppedFile(file)
        setUploadModalOpen(true)
      }
    },
    [setDraggingFile, setDroppedFile, setUploadModalOpen]
  )

  return {
    handleTrackContextMenu,
    handleMixerContextMenu,
    handleCommentSubmit,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
