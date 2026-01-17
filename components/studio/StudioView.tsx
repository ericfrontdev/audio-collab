'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Upload as UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadTrackModal } from './UploadTrackModal'
import { getProjectStudioData } from '@/app/actions/studio/data'
import { updateMixerSettings } from '@/app/actions/studio/mixer'
import { ProjectTrack } from '@/lib/types/studio'
import type { Track } from '@/lib/stores/useStudioStore'
import { toast } from 'react-toastify'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AddCommentModal } from './AddCommentModal'
import { TransportControls } from './TransportControls'
import { TrackHeaderList } from './TrackHeaderList'
import { WaveformTrackRow } from './WaveformTrackRow'
import { TrackContextMenu } from './TrackContextMenu'
import { MixerView } from './MixerView'
import { TimelineRuler } from './TimelineRuler'
import { useStudioTracks } from './hooks/useStudioTracks'
import { useStudioTimeline } from './hooks/useStudioTimeline'
import { useStudioHandlers } from './hooks/useStudioHandlers'
import { useTranslations } from 'next-intl'
import { useStudioStore, usePlaybackStore, useMixerStore, useUIStore } from '@/lib/stores'
import { useAudioEngine } from '@/hooks/useAudioEngine'

interface StudioViewProps {
  projectId: string
  projectTitle: string
  currentUserId?: string
  ownerId?: string
  locale?: string
  readOnly?: boolean
}

interface TakeWithUploader {
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

interface CommentWithProfile {
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

interface MixerSettings {
  id: string
  track_id: string
  volume: number
  pan: number
  solo: boolean
  mute: boolean
  created_at: string
  updated_at: string
}

export function StudioView({ projectId, projectTitle, currentUserId, ownerId, locale, readOnly = false }: StudioViewProps) {
  const t = useTranslations('studio.confirmDialog')

  // Helper: Check if a take is the active take for its track
  const isTakeActive = (track: Track, takeId: string) => {
    return track.active_take_id === takeId
  }

  // Zustand stores
  const tracks = useStudioStore((state) => state.tracks)
  const setTracks = useStudioStore((state) => state.setTracks)
  const updateTrackInStore = useStudioStore((state) => state.updateTrack)
  const removeTrackFromStore = useStudioStore((state) => state.removeTrack)
  const addCommentToStore = useStudioStore((state) => state.addComment)
  const setProjectInfo = useStudioStore((state) => state.setProjectInfo)
  const isStudioLoading = useStudioStore((state) => state.isLoading)
  const setStudioLoading = useStudioStore((state) => state.setLoading)

  const selectedTrackId = useUIStore((state) => state.selectedTrackId)
  const setSelectedTrackId = useUIStore((state) => state.setSelectedTrackId)
  const isUploadModalOpen = useUIStore((state) => state.isUploadModalOpen)
  const setUploadModalOpen = useUIStore((state) => state.setUploadModalOpen)
  const deleteConfirmation = useUIStore((state) => state.deleteConfirmation)
  const openDeleteConfirmation = useUIStore((state) => state.openDeleteConfirmation)
  const closeDeleteConfirmation = useUIStore((state) => state.closeDeleteConfirmation)
  const deleteRetakeConfirmation = useUIStore((state) => state.deleteRetakeConfirmation)
  const openDeleteRetakeConfirmation = useUIStore((state) => state.openDeleteRetakeConfirmation)
  const closeDeleteRetakeConfirmation = useUIStore((state) => state.closeDeleteRetakeConfirmation)
  const commentModal = useUIStore((state) => state.commentModal)
  const openCommentModal = useUIStore((state) => state.openCommentModal)
  const closeCommentModal = useUIStore((state) => state.closeCommentModal)
  const contextMenu = useUIStore((state) => state.contextMenu)
  const openContextMenu = useUIStore((state) => state.openContextMenu)
  const closeContextMenu = useUIStore((state) => state.closeContextMenu)
  const renamingTrackHeaderId = useUIStore((state) => state.renamingTrackHeaderId)
  const setRenamingTrackHeaderId = useUIStore((state) => state.setRenamingTrackHeaderId)
  const renamingMixerChannelId = useUIStore((state) => state.renamingMixerChannelId)
  const setRenamingMixerChannelId = useUIStore((state) => state.setRenamingMixerChannelId)
  const isMixerOpen = useUIStore((state) => state.isMixerOpen)
  const setMixerOpen = useUIStore((state) => state.setMixerOpen)
  const isDraggingFile = useUIStore((state) => state.isDraggingFile)
  const setDraggingFile = useUIStore((state) => state.setDraggingFile)
  const droppedFile = useUIStore((state) => state.droppedFile)
  const setDroppedFile = useUIStore((state) => state.setDroppedFile)

  const masterVolume = useMixerStore((state) => state.masterVolume)
  const setMasterVolume = useMixerStore((state) => state.setMasterVolume)
  const masterPan = useMixerStore((state) => state.masterPan)
  const setMasterPan = useMixerStore((state) => state.setMasterPan)
  const masterMute = useMixerStore((state) => state.masterMute)
  const setMasterMute = useMixerStore((state) => state.setMasterMute)
  const trackAudioLevels = useMixerStore((state) => state.trackLevels)
  const setTrackLevel = useMixerStore((state) => state.setTrackLevel)

  // Local state (not in stores)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentUser, setCurrentUser] = useState<{
    id?: string
    avatar_url?: string | null
  } | null>(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const primaryColor = '#9363f7'
  const [masterAudioLevel, setMasterAudioLevel] = useState({ level: 0, peak: 0 })

  // Track loaded durations (from audio files, not database)
  const [trackDurations, setTrackDurations] = useState<Map<string, number>>(new Map())

  // Calculate maxDuration from trackDurations (instant, no waiting for Tone.js)
  const maxDuration = trackDurations.size > 0
    ? Math.max(...Array.from(trackDurations.values()))
    : 0

  // Custom hooks
  const audioEngine = useAudioEngine()

  // Get playback state from store
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const currentTime = usePlaybackStore((state) => state.currentTime)

  // Waveform refs (for seeking)
  const waveformRefsRef = useRef<Map<string, any>>(new Map())

  // Callback to save mixer settings to database
  const handleMixerSettingsChange = useCallback(async (trackId: string, settings: {
    volume?: number
    pan?: number
    solo?: boolean
    mute?: boolean
  }) => {
    console.log('🎛️ Saving mixer settings for track:', trackId, settings)
    const result = await updateMixerSettings(trackId, settings)
    console.log('🎛️ Save result:', result)
    if (!result.success) {
      console.error('❌ Failed to save mixer settings:', result.error)
      toast.error('Failed to save mixer settings')
    } else {
      console.log('✅ Mixer settings saved successfully')
    }
  }, [])

  const timeline = useStudioTimeline({
    maxDuration: maxDuration,
    waveformRefs: waveformRefsRef,
    onSeek: audioEngine.handleSeek,
  })

  // Check orientation on mobile
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768
      const isPortraitMode = window.innerHeight > window.innerWidth
      setIsPortrait(isMobile && isPortraitMode)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  // Load studio data
  const loadStudioData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    const result = await getProjectStudioData(projectId)
    if (result.success && result.tracks) {
      console.log('📦 Loaded tracks data:', result.tracks.map(t => ({
        id: t.id,
        name: t.name,
        active_take_id: t.active_take_id,
        takes: t.takes?.map((tk: any) => ({ id: tk.id }))
      })))
      // Force a complete re-render by creating new object references
      const tracksWithTimestamp = result.tracks.map(t => ({
        ...t,
        _refreshKey: Date.now()
      }))
      setTracks(tracksWithTimestamp as Track[])
      // Set project info in store
      setProjectInfo(projectId, projectTitle, ownerId, currentUserId)
      // Only set selectedTrackId on initial load if there's no track selected
      if (!selectedTrackId && result.tracks && result.tracks.length > 0) {
        setSelectedTrackId(result.tracks[0].id)
      }
      // Force complete UI refresh
      setRefreshKey(prev => prev + 1)
    }
    if (!silent) setIsLoading(false)
  }, [projectId, projectTitle, ownerId, currentUserId, selectedTrackId, setTracks, setProjectInfo, setSelectedTrackId])

  useEffect(() => {
    loadStudioData()

    const loadUserProfile = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle()
        setCurrentUser({
          id: user.id,
          avatar_url: profile?.avatar_url,
        })
      }
    }
    loadUserProfile()
  }, [projectId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in input/textarea
      if (
        e.target instanceof HTMLElement &&
        !['INPUT', 'TEXTAREA'].includes(e.target.tagName)
      ) {
        if (e.code === 'Space') {
          e.preventDefault()
          audioEngine.handlePlayPause()
        }

        if (e.code === 'Enter') {
          e.preventDefault()
          audioEngine.handleStop()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [audioEngine.handlePlayPause, audioEngine.handleStop])

  // Track the loaded audio URLs to avoid reloading unnecessarily
  const loadedAudioUrlsRef = useRef<Map<string, string>>(new Map())

  // Load tracks into Tone.js players when tracks data changes
  useEffect(() => {
    // Get current track IDs
    const currentTrackIds = new Set(tracks.map(t => t.id))

    // Remove tracks that no longer exist in the tracks array
    loadedAudioUrlsRef.current.forEach((url, trackId) => {
      if (!currentTrackIds.has(trackId)) {
        console.log('🗑️ Removing deleted track:', trackId)
        audioEngine.removeTrack(trackId)
        loadedAudioUrlsRef.current.delete(trackId)
      }
    })

    // Load or update existing tracks
    tracks.forEach((track) => {
      // Get active take using active_take_id
      const activeTake = track.takes?.find((t) => t.id === track.active_take_id)

      if (activeTake?.audio_url) {
        // Only reload if the audio URL has changed
        const currentUrl = loadedAudioUrlsRef.current.get(track.id)
        if (currentUrl !== activeTake.audio_url) {
          console.log(`🔄 Reloading audio for track ${track.name}:`, {
            from: currentUrl,
            to: activeTake.audio_url,
            activeTakeId: track.active_take_id
          })

          // Load audio (starts at neutral values, will be synced from store)
          console.log('🎵 [StudioView] Loading audio:', {
            trackId: track.id,
            audioUrl: activeTake.audio_url,
          })
          audioEngine.loadTrack(track.id, activeTake.audio_url)

          loadedAudioUrlsRef.current.set(track.id, activeTake.audio_url)
          console.log('✅ Track load initiated')
        } else {
          console.log(`⏭️ Skipping reload for track ${track.name} (URL unchanged)`)
        }
      } else {
        // Remove track if no audio
        if (loadedAudioUrlsRef.current.has(track.id)) {
          audioEngine.removeTrack(track.id)
          loadedAudioUrlsRef.current.delete(track.id)
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks])

  // ============================================================================
  // SINGLE SOURCE OF TRUTH: Initialize mixer store from DB, sync to AudioEngine
  // ============================================================================

  // Step 1: Initialize mixer store from database values when tracks change
  useEffect(() => {
    console.log('📊 [StudioView] Initializing mixer store from DB')
    const { initializeTrack } = useMixerStore.getState()

    tracks.forEach(track => {
      const mixerSettings = track.mixer_settings
      const volumePercent = mixerSettings?.volume !== undefined ? mixerSettings.volume : 80
      const panPercent = mixerSettings?.pan !== undefined ? mixerSettings.pan : 0

      initializeTrack(track.id, {
        volume: volumePercent,
        pan: panPercent,
        mute: mixerSettings?.mute || false,
        solo: mixerSettings?.solo || false,
        fx: {
          type: 'none',
          bypassed: false,
          eq: { enabled: true, low: 0.5, mid: 0.5, high: 0.5 },
          compressor: { enabled: true, threshold: 0.5, ratio: 0.2, attack: 0.01, release: 0.25, makeupGain: 0.5 },
          reverb: { enabled: true, decay: 0.15, wet: 0.3 }
        },
        fxChain: [] // New multi-effect chain (empty by default)
      })
    })
  }, [tracks])

  // Step 2: Sync mixer store to AudioEngine (store -> Tone.js)
  const mixerTracks = useMixerStore((state) => state.tracks)

  useEffect(() => {
    console.log('🔄 [StudioView] Syncing mixer store to AudioEngine')

    // Check if any tracks are soloed
    const soloedTracks: string[] = []
    mixerTracks.forEach((settings, trackId) => {
      if (settings.solo) soloedTracks.push(trackId)
    })
    const hasSolos = soloedTracks.length > 0

    // Sync each track
    mixerTracks.forEach((settings, trackId) => {
      // Apply solo logic: if any track is soloed, mute non-soloed tracks
      const shouldMute = hasSolos
        ? !soloedTracks.includes(trackId) || settings.mute
        : settings.mute

      console.log(`  🎛️ Track ${trackId}:`, {
        volume: settings.volume,
        pan: settings.pan,
        mute: settings.mute,
        solo: settings.solo,
        effectiveMute: shouldMute,
        fx: settings.fx.type,
        fxChain: settings.fxChain?.length ?? 0
      })
      audioEngine.executeVolumeChange(trackId, settings.volume / 100)
      audioEngine.executePanChange(trackId, settings.pan / 100)
      audioEngine.executeMuteChange(trackId, shouldMute)
      // Sync FX - use new chain if available, fallback to legacy
      if (settings.fxChain && settings.fxChain.length > 0) {
        audioEngine.executeFXChainUpdate(trackId, settings.fxChain)
      } else {
        audioEngine.executeFXChange(trackId, settings.fx)
      }
    })

    // Sync master
    console.log('  🎚️ Master:', { volume: masterVolume, pan: masterPan, mute: masterMute })
    audioEngine.executeMasterVolumeChange(masterVolume)
    audioEngine.executeMasterPanChange(masterPan)
    audioEngine.executeMasterMuteChange(masterMute)
  }, [mixerTracks, masterVolume, masterPan, masterMute, audioEngine])

  // Extract all handlers to custom hook
  const handlers = useStudioHandlers({
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
  })

  // Destructure handlers for easier access
  const {
    handleUploadSuccess,
    handleAddTrack,
    handleImport,
    handleToggleTakes,
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
  } = handlers

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading studio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Portrait Mode Warning */}
      {isPortrait && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-primary rounded-2xl rotate-0 transition-transform duration-500 animate-pulse" />
              <div className="absolute inset-0 border-4 border-primary/30 rounded-2xl rotate-90" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Rotation requise</h2>
            <p className="text-gray-400 text-lg mb-2">
              Veuillez tourner votre appareil en mode paysage pour utiliser le studio.
            </p>
            <p className="text-gray-500 text-sm">
              Le studio nécessite plus d'espace horizontal pour afficher correctement les
              waveforms et la timeline.
            </p>
          </div>
        </div>
      )}

      {/* Header with Transport Controls */}
      <TransportControls
        projectName={projectTitle}
        isPlaying={isPlaying}
        currentTime={currentTime}
        hasTracksLoaded={tracks.length > 0}
        isMixerOpen={isMixerOpen}
        onPlayPause={audioEngine.handlePlayPause}
        onStop={audioEngine.handleStop}
        onToggleMixer={() => setMixerOpen(!isMixerOpen)}
        readOnly={readOnly}
      />

      {/* Read-Only Mode Banner */}
      {readOnly && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2">
          <p className="text-sm text-yellow-400 text-center font-medium">
            👁️ View-Only Mode - You're viewing this studio in read-only mode. Join the project to edit and collaborate.
          </p>
        </div>
      )}

      {/* Main Studio Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Track Headers */}
        <TrackHeaderList
          tracks={tracks}
          onImport={handleImport}
          onToggleTakes={handleToggleTakes}
          onAddTrack={handleAddTrack}
          onContextMenu={handleTrackContextMenu}
          onTrackRename={handleTrackRename}
          onTracksReorder={handleTracksReorder}
          onRetakeActivated={handleRetakeActivated}
          onDeleteRetake={handleDeleteRetake}
          readOnly={readOnly}
        />

        {/* Center: Timeline & Waveforms */}
        <div className="flex-1 flex flex-col bg-zinc-900/80">
          {tracks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
                  <UploadIcon className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No tracks yet</h3>
                <p className="text-gray-400 mb-6">
                  {readOnly ? 'This project has no audio tracks yet' : 'Upload your first audio track to get started'}
                </p>
                {!readOnly && (
                  <Button onClick={() => setUploadModalOpen(true)}>
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Upload Track
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Timeline container - fits to screen width */}
              <div className="relative h-full flex flex-col">
                {/* Single unified playhead */}
                <div className="absolute inset-0 pointer-events-none z-40">
                  {maxDuration > 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white"
                      style={{
                        left: `${(currentTime / maxDuration) * 100}%`,
                      }}
                    />
                  )}
                </div>

                {/* Timeline Ruler */}
                <TimelineRuler
                  ref={timeline.timelineRef}
                  maxDuration={maxDuration}
                  isDragging={timeline.isDraggingPlayhead}
                  onMouseDown={timeline.handleTimelineMouseDown}
                  onTouchStart={timeline.handleTimelineTouchStart}
                />

                {/* Waveforms container */}
                <div className="flex-1 overflow-y-auto">
                  {tracks.map((track) => {
                      // OPTION A: Original always stays on top, retakes below
                      // Sort all takes by creation date (oldest first)
                      const allTakesSorted = [...(track.takes || [])].sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                      )

                      // Original = first take created (always on top)
                      const originalTake = allTakesSorted[0]

                      // Retakes = all other takes (always below, sorted by creation)
                      const retakes = allTakesSorted.slice(1)
                      const isExpanded = track.is_retake_folder_open || false

                      // Check if original is active (for coloring)
                      const isOriginalActive = originalTake ? isTakeActive(track, originalTake.id) : false

                      // Create a unique key that changes when active state changes or on refresh
                      const trackKey = `${track.id}-${refreshKey}`

                      return (
                        <div key={trackKey} className="relative">
                          {/* Original track waveform (always on top) */}
                          <WaveformTrackRow
                            trackId={track.id}
                            trackColor={track.color}
                            activeTake={originalTake}
                            loadedDuration={trackDurations.get(track.id) || 0}
                            maxDuration={maxDuration}
                            comments={track.comments}
                            currentUserId={currentUserId}
                            isRetake={false}
                            isActive={isOriginalActive}
                            onWaveformReady={(duration) => handleWaveformReady(track.id, duration)}
                            waveformRef={(ref) => {
                              if (ref) {
                                waveformRefsRef.current.set(track.id, ref)
                              } else {
                                waveformRefsRef.current.delete(track.id)
                              }
                            }}
                            onClick={handleWaveformClick}
                          />

                          {/* Retake waveforms (if expanded) */}
                          {isExpanded && retakes.map((retake, idx) => {
                            return (
                              <WaveformTrackRow
                                key={retake.id}
                                trackId={track.id}
                                trackColor={track.color}
                                activeTake={retake}
                                loadedDuration={trackDurations.get(track.id) || 0}
                                maxDuration={maxDuration}
                                comments={undefined} // Retakes don't have separate comments
                                currentUserId={currentUserId}
                                isRetake={true}
                                isActive={isTakeActive(track, retake.id)}
                                onWaveformReady={() => {}} // Don't update duration for retakes
                                waveformRef={() => {}} // Retakes don't need refs
                                onClick={undefined} // Retakes don't open comment modal
                              />
                            )
                          })}
                        </div>
                      )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadTrackModal
        projectId={projectId}
        existingTracks={tracks}
        isOpen={isUploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false)
          setDroppedFile(null)
        }}
        onSuccess={handleUploadSuccess}
        droppedFile={droppedFile}
        targetTrackId={selectedTrackId}
      />

      {/* Delete Track Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title={t('deleteTrack.title')}
        message={t('deleteTrack.message', { trackName: deleteConfirmation.trackName })}
        confirmText={t('deleteTrack.confirm')}
        cancelText={t('deleteTrack.cancel')}
        variant="danger"
        onConfirm={confirmDeleteTrack}
        onCancel={cancelDeleteTrack}
      />

      {/* Delete Retake Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteRetakeConfirmation.isOpen}
        title={t('deleteRetake.title')}
        message={t('deleteRetake.message', { retakeNumber: deleteRetakeConfirmation.retakeNumber })}
        confirmText={t('deleteRetake.confirm')}
        cancelText={t('deleteRetake.cancel')}
        variant="danger"
        onConfirm={confirmDeleteRetake}
        onCancel={cancelDeleteRetake}
      />

      {/* Add Comment Modal */}
      <AddCommentModal
        isOpen={commentModal.isOpen}
        position={commentModal.position}
        timestamp={commentModal.timestamp}
        userAvatar={currentUser?.avatar_url}
        onSubmit={handleCommentSubmit}
        onClose={closeCommentModal}
      />

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <TrackContextMenu
          trackId={contextMenu.trackId}
          trackName={contextMenu.trackName}
          trackColor={contextMenu.trackColor}
          position={contextMenu.position}
          onClose={closeContextMenu}
          onRename={contextMenu.source === 'mixer' ? handleRenameFromMixer : handleRenameFromTrack}
          onColorChange={handleColorChange}
          onDuplicate={handleDuplicate}
          onDelete={(trackId) => {
            const track = tracks.find(t => t.id === trackId)
            if (track) {
              handleDeleteTrack(trackId, track.name)
            }
          }}
        />
      )}

      {/* Mixer Overlay */}
      {isMixerOpen && (
        <div className="fixed bottom-0 left-0 right-0 h-[60vh] bg-zinc-900 border-t border-zinc-800 shadow-2xl z-50">
          <MixerView
            onDeleteTrack={handleDeleteTrack}
            onImport={handleImport}
            onContextMenu={handleMixerContextMenu}
            onTrackRename={handleTrackRename}
            onTracksReorder={handleTracksReorder}
            onAddTrack={handleAddTrack}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  )
}
