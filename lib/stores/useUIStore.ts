import { create } from 'zustand'

/**
 * UI Store
 *
 * Manages all UI-related state: modals, selections, menus, etc.
 * This keeps UI state separate from business logic.
 */

interface ConfirmDialogState {
  isOpen: boolean
  trackId: string
  trackName: string
}

interface DeleteRetakeConfirmState {
  isOpen: boolean
  trackId: string
  takeId: string
  retakeNumber: number
}

interface CommentModalState {
  isOpen: boolean
  trackId: string
  timestamp: number
  position: { x: number; y: number }
}

interface ContextMenuState {
  isOpen: boolean
  trackId: string
  trackName: string
  trackColor: string
  position: { x: number; y: number }
  source: 'track' | 'mixer' | null
}

interface UIState {
  // Track selection
  selectedTrackId: string | null
  renamingTrackHeaderId: string | null
  renamingMixerChannelId: string | null

  // Modals
  isUploadModalOpen: boolean
  deleteConfirmation: ConfirmDialogState
  deleteRetakeConfirmation: DeleteRetakeConfirmState
  commentModal: CommentModalState
  contextMenu: ContextMenuState

  // Panels
  isMixerOpen: boolean

  // Drag & drop
  isDraggingFile: boolean
  droppedFile: File | null

  // Actions - Selection
  setSelectedTrackId: (trackId: string | null) => void
  setRenamingTrackHeaderId: (trackId: string | null) => void
  setRenamingMixerChannelId: (trackId: string | null) => void

  // Actions - Modals
  setUploadModalOpen: (open: boolean) => void
  openDeleteConfirmation: (trackId: string, trackName: string) => void
  closeDeleteConfirmation: () => void
  openDeleteRetakeConfirmation: (trackId: string, takeId: string, retakeNumber: number) => void
  closeDeleteRetakeConfirmation: () => void
  openCommentModal: (trackId: string, timestamp: number, position: { x: number; y: number }) => void
  closeCommentModal: () => void
  openContextMenu: (trackId: string, trackName: string, trackColor: string, position: { x: number; y: number }, source: 'track' | 'mixer') => void
  closeContextMenu: () => void

  // Actions - Panels
  setMixerOpen: (open: boolean) => void

  // Actions - Drag & drop
  setDraggingFile: (dragging: boolean) => void
  setDroppedFile: (file: File | null) => void

  // Reset
  reset: () => void
}

const initialState = {
  selectedTrackId: null,
  renamingTrackHeaderId: null,
  renamingMixerChannelId: null,
  isUploadModalOpen: false,
  deleteConfirmation: {
    isOpen: false,
    trackId: '',
    trackName: '',
  },
  deleteRetakeConfirmation: {
    isOpen: false,
    trackId: '',
    takeId: '',
    retakeNumber: 0,
  },
  commentModal: {
    isOpen: false,
    trackId: '',
    timestamp: 0,
    position: { x: 0, y: 0 },
  },
  contextMenu: {
    isOpen: false,
    trackId: '',
    trackName: '',
    trackColor: '',
    position: { x: 0, y: 0 },
    source: null,
  },
  isMixerOpen: false,
  isDraggingFile: false,
  droppedFile: null,
}

export const useUIStore = create<UIState>((set) => ({
  ...initialState,

  // Selection
  setSelectedTrackId: (trackId) =>
    set({ selectedTrackId: trackId }),

  setRenamingTrackHeaderId: (trackId) =>
    set({ renamingTrackHeaderId: trackId }),

  setRenamingMixerChannelId: (trackId) =>
    set({ renamingMixerChannelId: trackId }),

  // Modals
  setUploadModalOpen: (open) =>
    set({ isUploadModalOpen: open }),

  openDeleteConfirmation: (trackId, trackName) =>
    set({
      deleteConfirmation: {
        isOpen: true,
        trackId,
        trackName,
      },
    }),

  closeDeleteConfirmation: () =>
    set({
      deleteConfirmation: {
        isOpen: false,
        trackId: '',
        trackName: '',
      },
    }),

  openDeleteRetakeConfirmation: (trackId, takeId, retakeNumber) =>
    set({
      deleteRetakeConfirmation: {
        isOpen: true,
        trackId,
        takeId,
        retakeNumber,
      },
    }),

  closeDeleteRetakeConfirmation: () =>
    set({
      deleteRetakeConfirmation: {
        isOpen: false,
        trackId: '',
        takeId: '',
        retakeNumber: 0,
      },
    }),

  openCommentModal: (trackId, timestamp, position) =>
    set({
      commentModal: {
        isOpen: true,
        trackId,
        timestamp,
        position,
      },
    }),

  closeCommentModal: () =>
    set({
      commentModal: {
        isOpen: false,
        trackId: '',
        timestamp: 0,
        position: { x: 0, y: 0 },
      },
    }),

  openContextMenu: (trackId, trackName, trackColor, position, source) =>
    set({
      contextMenu: {
        isOpen: true,
        trackId,
        trackName,
        trackColor,
        position,
        source,
      },
    }),

  closeContextMenu: () =>
    set({
      contextMenu: {
        isOpen: false,
        trackId: '',
        trackName: '',
        trackColor: '',
        position: { x: 0, y: 0 },
        source: null,
      },
    }),

  // Panels
  setMixerOpen: (open) =>
    set({ isMixerOpen: open }),

  // Drag & drop
  setDraggingFile: (dragging) =>
    set({ isDraggingFile: dragging }),

  setDroppedFile: (file) =>
    set({ droppedFile: file }),

  // Reset
  reset: () =>
    set(initialState),
}))
