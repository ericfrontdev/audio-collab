/**
 * Studio Handlers Hook (Orchestrator)
 *
 * Composes specialized domain hooks to provide a unified handler API.
 * This is a thin orchestrator that delegates to domain-specific hooks.
 */

import { useStudioStore, useMixerStore, useUIStore } from '@/lib/stores'
import type { Track } from '@/lib/stores/useStudioStore'
import { useTrackOperations } from './useTrackOperations'
import { useRetakeOperations } from './useRetakeOperations'
import { useAudioHandlers } from './useAudioHandlers'
import { useMasterControls } from './useMasterControls'
import { useInteractionHandlers } from './useInteractionHandlers'

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
  // Extract store actions once (shared by specialized hooks)
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

  // Compose specialized domain hooks
  const trackOps = useTrackOperations({
    projectId: props.projectId,
    tracks: props.tracks,
    selectedTrackId,
    contextMenu: props.contextMenu,
    deleteConfirmation: props.deleteConfirmation,
    setTracks,
    updateTrackInStore,
    removeTrackFromStore,
    setSelectedTrackId,
    setRenamingTrackHeaderId,
    setRenamingMixerChannelId,
    setUploadModalOpen: props.setUploadModalOpen,
    openDeleteConfirmation: props.openDeleteConfirmation,
    closeDeleteConfirmation: props.closeDeleteConfirmation,
    openContextMenu: props.openContextMenu,
    loadStudioData: props.loadStudioData,
  })

  const retakeOps = useRetakeOperations({
    tracks: props.tracks,
    loadedAudioUrlsRef: props.loadedAudioUrlsRef,
    deleteRetakeConfirmation: props.deleteRetakeConfirmation,
    updateTrackInStore,
    openDeleteRetakeConfirmation: props.openDeleteRetakeConfirmation,
    closeDeleteRetakeConfirmation: props.closeDeleteRetakeConfirmation,
    loadStudioData: props.loadStudioData,
  })

  const audioHandlers = useAudioHandlers({
    projectId: props.projectId,
    tracks: props.tracks,
    maxDuration: props.maxDuration,
    audioEngine: props.audioEngine,
    loadedAudioUrlsRef: props.loadedAudioUrlsRef,
    updateTrackInStore,
    setTrackDurations: props.setTrackDurations,
    openCommentModal: props.openCommentModal,
  })

  const masterControls = useMasterControls({
    audioEngine: props.audioEngine,
    masterMute,
    setMasterVolume,
    setMasterPan,
    setMasterMute,
  })

  const interactionHandlers = useInteractionHandlers({
    tracks: props.tracks,
    commentModal: props.commentModal,
    setDraggingFile: props.setDraggingFile,
    setDroppedFile: props.setDroppedFile,
    setUploadModalOpen: props.setUploadModalOpen,
    openContextMenu: props.openContextMenu,
    addCommentToStore: props.addCommentToStore,
  })

  // Return flattened API (maintains backward compatibility)
  return {
    ...trackOps,
    ...retakeOps,
    ...audioHandlers,
    ...masterControls,
    ...interactionHandlers,
  }
}
