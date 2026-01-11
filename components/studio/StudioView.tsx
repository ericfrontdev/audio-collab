'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Upload as UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadTrackModal } from './UploadTrackModal'
import { getProjectStudioData } from '@/app/actions/studio/data'
import {
  deleteTrack,
  createEmptyTrack,
  updateTrackName,
  updateTrackColor,
  duplicateTrack,
  reorderTracks,
} from '@/app/actions/studio/tracks'
import { addTrackComment } from '@/app/actions/studio/comments'
import { updateMixerSettings } from '@/app/actions/studio/mixer'
import { deleteTake } from '@/app/actions/studio/takes'
import {
  createCompedSection,
  deleteCompedSection,
  toggleRetakeFolder,
  activateFullRetake,
} from '@/app/actions/studio/compedSections'
import { ProjectTrack, CompedSection } from '@/lib/types/studio'
import { toast } from 'react-toastify'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AddCommentModal } from './AddCommentModal'
import { TransportControls } from './TransportControls'
import { TrackHeaderList } from './TrackHeaderList'
import { WaveformTrackRow } from './WaveformTrackRow'
import { CompableWaveformRow } from './CompableWaveformRow'
import { TrackContextMenu } from './TrackContextMenu'
import { MixerView } from './MixerView'
import { TimelineRuler } from './TimelineRuler'
import { useTonePlayback } from './hooks/useTonePlayback'
import { useStudioTracks } from './hooks/useStudioTracks'
import { useStudioTimeline } from './hooks/useStudioTimeline'
import { useTranslations } from 'next-intl'

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
  is_active: boolean
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

interface TrackWithDetails extends ProjectTrack {
  takes?: TakeWithUploader[]
  comments?: CommentWithProfile[]
  mixer_settings?: MixerSettings | null
  compedSections?: CompedSection[]
  isRetakeFolderOpen?: boolean
}

export function StudioView({ projectId, projectTitle, currentUserId, ownerId, locale, readOnly = false }: StudioViewProps) {
  const t = useTranslations('studio.confirmDialog')

  const [tracks, setTracks] = useState<TrackWithDetails[]>([])
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    trackId: string
    trackName: string
  }>({ isOpen: false, trackId: '', trackName: '' })
  const [deleteRetakeConfirmation, setDeleteRetakeConfirmation] = useState<{
    isOpen: boolean
    trackId: string
    takeId: string
    retakeNumber: number
  }>({ isOpen: false, trackId: '', takeId: '', retakeNumber: 0 })
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean
    trackId: string
    timestamp: number
    position: { x: number; y: number }
  }>({ isOpen: false, trackId: '', timestamp: 0, position: { x: 0, y: 0 } })
  const [currentUser, setCurrentUser] = useState<{
    id?: string
    avatar_url?: string | null
  } | null>(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    trackId: string
    trackName: string
    trackColor: string
    position: { x: number; y: number }
    source: 'track' | 'mixer' | null
  }>({ isOpen: false, trackId: '', trackName: '', trackColor: '', position: { x: 0, y: 0 }, source: null })
  const [renamingTrackHeaderId, setRenamingTrackHeaderId] = useState<string | null>(null)
  const [renamingMixerChannelId, setRenamingMixerChannelId] = useState<string | null>(null)
  const [isMixerOpen, setIsMixerOpen] = useState(false)
  const primaryColor = '#9363f7'

  // Master channel state
  const [masterVolume, setMasterVolume] = useState(80)
  const [masterPan, setMasterPan] = useState(0)
  const [masterMute, setMasterMute] = useState(false)

  // Audio levels for VU meters
  const [trackAudioLevels, setTrackAudioLevels] = useState<Map<string, { level: number; peak: number }>>(new Map())
  const [masterAudioLevel, setMasterAudioLevel] = useState({ level: 0, peak: 0 })

  // Track loaded durations (from audio files, not database)
  const [trackDurations, setTrackDurations] = useState<Map<string, number>>(new Map())

  // Calculate maxDuration from trackDurations (instant, no waiting for Tone.js)
  const maxDuration = trackDurations.size > 0
    ? Math.max(...Array.from(trackDurations.values()))
    : 0

  // Audio level callback for VU meters
  const handleAudioLevel = useCallback((trackId: string, level: number, peak: number) => {
    if (trackId === 'master') {
      setMasterAudioLevel({ level, peak })
    } else {
      setTrackAudioLevels((prev) => {
        const newMap = new Map(prev)
        newMap.set(trackId, { level, peak })
        return newMap
      })
    }
  }, [])

  // Custom hooks
  const playback = useTonePlayback(handleAudioLevel)

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

  // Create initial mixer settings map from database (memoized to prevent infinite loops)
  const initialMixerSettings = useMemo(() => new Map(
    tracks.map(track => [
      track.id,
      {
        volume: track.mixer_settings?.volume ?? 0.8,
        pan: track.mixer_settings?.pan ?? 0,
        solo: track.mixer_settings?.solo ?? false,
        mute: track.mixer_settings?.mute ?? false,
      }
    ])
  ), [tracks])

  const trackControls = useStudioTracks({
    setTrackVolume: playback.setTrackVolume,
    setTrackPan: playback.setTrackPan,
    setTrackMute: playback.setTrackMute,
    trackIds: tracks.map(t => t.id),
    masterVolume,
    masterPan,
    masterMute,
    initialSettings: initialMixerSettings,
    onMixerSettingsChange: handleMixerSettingsChange,
  })
  const timeline = useStudioTimeline({
    maxDuration: maxDuration,
    waveformRefs: playback.waveformRefs,
    onSeek: playback.handleSeek,
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
        takes: t.takes?.map((tk: any) => ({ id: tk.id, is_active: tk.is_active }))
      })))
      // Force a complete re-render by creating new object references
      const tracksWithTimestamp = result.tracks.map(t => ({
        ...t,
        _refreshKey: Date.now()
      }))
      setTracks(tracksWithTimestamp as TrackWithDetails[])
      // Only set selectedTrackId on initial load if there's no track selected
      setSelectedTrackId(prev => {
        if (!prev && result.tracks && result.tracks.length > 0) {
          return result.tracks[0].id
        }
        return prev
      })
      // Force complete UI refresh
      setRefreshKey(prev => prev + 1)
    }
    if (!silent) setIsLoading(false)
  }, [projectId])

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
        playback.removeTrack(trackId)
        loadedAudioUrlsRef.current.delete(trackId)
      }
    })

    // Load or update existing tracks
    tracks.forEach((track) => {
      // Get active takes
      const activeTakes = track.takes?.filter((t) => t.is_active).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) || []
      const allTakes = [...(track.takes || [])].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const activeTake = activeTakes.length > 0 ? activeTakes[0] : allTakes[0]

      if (activeTake?.audio_url) {
        // Only reload if the audio URL has changed
        const currentUrl = loadedAudioUrlsRef.current.get(track.id)
        if (currentUrl !== activeTake.audio_url) {
          const mixerSettings = track.mixer_settings
          const volume = mixerSettings?.volume !== undefined ? mixerSettings.volume / 100 : 0.8
          const pan = mixerSettings?.pan !== undefined ? mixerSettings.pan / 100 : 0

          // Check if this track has comped sections
          const compedSections = track.compedSections || []

          if (compedSections.length > 0) {
            // Build retakes with sections
            const retakesWithSections = track.takes
              ?.filter(t => t.id !== activeTake.id)
              .map(take => ({
                takeId: take.id,
                audioUrl: take.audio_url,
                sections: compedSections.filter(s => s.take_id === take.id)
              }))
              .filter(r => r.sections.length > 0) || []

            // Load with comping
            playback.loadTrackWithRetakes(
              track.id,
              activeTake.id,
              activeTake.audio_url,
              retakesWithSections,
              volume,
              pan
            )
          } else {
            // Load simple (no comping)
            playback.loadTrack(track.id, activeTake.audio_url, volume, pan)
          }

          loadedAudioUrlsRef.current.set(track.id, activeTake.audio_url)
        }
      } else {
        // Remove track if no audio
        if (loadedAudioUrlsRef.current.has(track.id)) {
          playback.removeTrack(track.id)
          loadedAudioUrlsRef.current.delete(track.id)
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks])

  const handleUploadSuccess = async (trackId: string) => {
    // Fetch the updated track data
    const result = await getProjectStudioData(projectId)
    if (result.success && result.tracks) {
      const updatedTrack = result.tracks.find(t => t.id === trackId)
      if (updatedTrack) {
        setTracks(prev => {
          // Check if this is a new track or an existing one
          const trackExists = prev.some(track => track.id === trackId)
          if (trackExists) {
            // Update existing track
            return prev.map(track =>
              track.id === trackId ? updatedTrack as TrackWithDetails : track
            )
          } else {
            // Add new track
            return [...prev, updatedTrack as TrackWithDetails]
          }
        })
      }
    }
  }

  const handleAddTrack = async () => {
    const result = await createEmptyTrack(projectId)
    if (result.success && result.track) {
      toast.success('Track created')
      // Add the new track to the state with proper structure
      const newTrack: TrackWithDetails = {
        ...result.track,
        takes: [],
        comments: [],
        mixer_settings: null,
      }
      setTracks(prev => [...prev, newTrack])
      setSelectedTrackId(result.track.id)
    } else {
      toast.error(result.error || 'Failed to create track')
    }
  }

  const handleImport = (trackId: string) => {
    setSelectedTrackId(trackId)
    setIsUploadModalOpen(true)
  }

  const handleToggleTakes = async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    const newState = !track.isRetakeFolderOpen

    // Optimistic update
    setTracks(prevTracks =>
      prevTracks.map(t =>
        t.id === trackId ? { ...t, isRetakeFolderOpen: newState } : t
      )
    )

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

    // Get active take (original)
    const activeTakes = track.takes?.filter(t => t.is_active).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ) || []
    const allTakes = [...(track.takes || [])].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const activeTake = activeTakes.length > 0 ? activeTakes[0] : allTakes[0]

    if (!activeTake?.audio_url) return

    const mixerSettings = track.mixer_settings
    const volume = mixerSettings?.volume !== undefined ? mixerSettings.volume / 100 : 0.8
    const pan = mixerSettings?.pan !== undefined ? mixerSettings.pan / 100 : 0

    // Check if this track has comped sections
    const compedSections = track.compedSections || []

    if (compedSections.length > 0) {
      // Build retakes with sections
      const retakesWithSections = track.takes
        ?.filter(t => t.id !== activeTake.id)
        .map(take => ({
          takeId: take.id,
          audioUrl: take.audio_url,
          sections: compedSections.filter(s => s.take_id === take.id)
        }))
        .filter(r => r.sections.length > 0) || []

      // Load with comping
      playback.loadTrackWithRetakes(
        trackId,
        activeTake.id,
        activeTake.audio_url,
        retakesWithSections,
        volume,
        pan
      )
    } else {
      // Load simple (no comping)
      playback.loadTrack(trackId, activeTake.audio_url, volume, pan)
    }
  }, [tracks, playback])

  const handleSectionCreated = useCallback(async (trackId: string, takeId: string, startTime: number, endTime: number) => {
    console.log('📝 Creating comped section:', { trackId, takeId, startTime, endTime })
    const result = await createCompedSection(trackId, takeId, startTime, endTime)

    if (result.success && result.section) {
      toast.success('Section added')

      // Get current track state
      const track = tracks.find(t => t.id === trackId)
      if (!track) return

      // Build updated sections list
      const updatedSections = [...(track.compedSections || []), result.section]

      // Optimistic update - add section to track
      setTracks(prevTracks =>
        prevTracks.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              compedSections: updatedSections
            }
          }
          return t
        })
      )

      // Reload audio with the updated sections (don't wait for state update)
      const activeTake = track.takes?.find(t => t.is_active)
      if (!activeTake?.audio_url) return

      const mixerSettings = track.mixer_settings
      const volume = mixerSettings?.volume !== undefined ? mixerSettings.volume / 100 : 0.8
      const pan = mixerSettings?.pan !== undefined ? mixerSettings.pan / 100 : 0

      // Build retakes with sections using the updated sections list
      const retakesWithSections = track.takes
        ?.filter(t => t.id !== activeTake.id)
        .map(take => ({
          takeId: take.id,
          audioUrl: take.audio_url,
          sections: updatedSections.filter(s => s.take_id === take.id)
        }))
        .filter(r => r.sections.length > 0) || []

      // Load with comping
      playback.loadTrackWithRetakes(
        trackId,
        activeTake.id,
        activeTake.audio_url,
        retakesWithSections,
        volume,
        pan
      )
    } else {
      toast.error(result.error || 'Failed to create section')
    }
  }, [tracks, playback])

  const handleSectionDeleted = useCallback(async (trackId: string, sectionId: string) => {
    console.log('🗑️ Deleting comped section:', sectionId)
    const result = await deleteCompedSection(sectionId)

    if (result.success) {
      toast.success('Section removed')

      // Get current track state
      const track = tracks.find(t => t.id === trackId)
      if (!track) return

      // Build updated sections list (without deleted section)
      const updatedSections = (track.compedSections || []).filter(s => s.id !== sectionId)

      // Optimistic update - remove section from track
      setTracks(prevTracks =>
        prevTracks.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              compedSections: updatedSections
            }
          }
          return t
        })
      )

      // Reload audio without this section (don't wait for state update)
      const activeTake = track.takes?.find(t => t.is_active)
      if (!activeTake?.audio_url) return

      const mixerSettings = track.mixer_settings
      const volume = mixerSettings?.volume !== undefined ? mixerSettings.volume / 100 : 0.8
      const pan = mixerSettings?.pan !== undefined ? mixerSettings.pan / 100 : 0

      if (updatedSections.length > 0) {
        // Build retakes with sections using the updated sections list
        const retakesWithSections = track.takes
          ?.filter(t => t.id !== activeTake.id)
          .map(take => ({
            takeId: take.id,
            audioUrl: take.audio_url,
            sections: updatedSections.filter(s => s.take_id === take.id)
          }))
          .filter(r => r.sections.length > 0) || []

        // Load with comping
        playback.loadTrackWithRetakes(
          trackId,
          activeTake.id,
          activeTake.audio_url,
          retakesWithSections,
          volume,
          pan
        )
      } else {
        // No more sections - load simple
        playback.loadTrack(trackId, activeTake.audio_url, volume, pan)
      }
    } else {
      toast.error(result.error || 'Failed to delete section')
    }
  }, [tracks, playback])

  const handleRetakeActivated = useCallback(async (trackId: string, takeId: string, isCurrentlyActive: boolean) => {
    // If clicking on an already active retake, deactivate it and reactivate the original
    if (isCurrentlyActive) {
      console.log('🔄 Deactivating retake and returning to original')
      const track = tracks.find(t => t.id === trackId)
      if (!track || !track.takes) return

      // Find the original take (first created)
      const originalTake = [...track.takes].sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0]

      if (!originalTake) return

      try {
        const result = await activateFullRetake(trackId, originalTake.id)
        if (result.success) {
          toast.success('Returned to original take')
          await loadStudioData(true) // Silent reload
        } else {
          toast.error(result.error || 'Failed to deactivate retake')
        }
      } catch (error) {
        console.error('❌ Exception in deactivating retake:', error)
        toast.error('An error occurred')
      }
      return
    }

    // Normal activation
    console.log('🎵 Activating full retake:', { trackId, takeId })

    try {
      const result = await activateFullRetake(trackId, takeId)
      console.log('✅ Retake activation result:', result)

      if (result.success) {
        toast.success('Retake activated')
        console.log('🔄 Reloading studio data...')
        await loadStudioData(true) // Silent reload
        console.log('✅ Studio data reloaded')
      } else {
        console.error('❌ Activation failed:', result.error)
        toast.error(result.error || 'Failed to activate retake')
      }
    } catch (error) {
      console.error('❌ Exception in handleRetakeActivated:', error)
      toast.error('An error occurred while activating retake')
    }
  }, [loadStudioData, tracks])

  const handleTrackContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault()
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    setContextMenu({
      isOpen: true,
      trackId,
      trackName: track.name,
      trackColor: track.color,
      position: { x: e.clientX, y: e.clientY },
      source: 'track',
    })
  }

  const handleMixerContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault()
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    setContextMenu({
      isOpen: true,
      trackId,
      trackName: track.name,
      trackColor: track.color,
      position: { x: e.clientX, y: e.clientY },
      source: 'mixer',
    })
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
    setTracks((prevTracks) =>
      prevTracks.map((track) =>
        track.id === trackId ? { ...track, name: newName } : track
      )
    )
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
    setTracks((prevTracks) => {
      const trackMap = new Map(prevTracks.map(track => [track.id, track]))
      return trackIds.map(id => trackMap.get(id)!).filter(Boolean)
    })

    // Update server in background
    const result = await reorderTracks(projectId, trackIds)
    if (!result.success) {
      toast.error(result.error || 'Failed to reorder tracks')
      loadStudioData() // Revert on error
    }
  }

  const handleColorChange = async (trackId: string, color: string) => {
    // Optimistic update - update local state immediately
    setTracks((prevTracks) =>
      prevTracks.map((track) =>
        track.id === trackId ? { ...track, color } : track
      )
    )

    // Update context menu color too
    setContextMenu((prev) =>
      prev.trackId === trackId ? { ...prev, trackColor: color } : prev
    )

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
    setDeleteConfirmation({ isOpen: true, trackId, trackName })
  }

  const confirmDeleteTrack = async () => {
    const { trackId, trackName } = deleteConfirmation
    setDeleteConfirmation({ isOpen: false, trackId: '', trackName: '' })

    const result = await deleteTrack(trackId)
    if (result.success) {
      setTracks((prevTracks) => prevTracks.filter((t) => t.id !== trackId))
      if (selectedTrackId === trackId) {
        setSelectedTrackId(null)
      }
      toast.success(`Track "${trackName}" deleted successfully`)
    } else {
      toast.error(result.error || 'Failed to delete track')
    }
  }

  const cancelDeleteTrack = () => {
    setDeleteConfirmation({ isOpen: false, trackId: '', trackName: '' })
  }

  const handleDeleteRetake = (trackId: string, takeId: string, retakeNumber: number) => {
    setDeleteRetakeConfirmation({ isOpen: true, trackId, takeId, retakeNumber })
  }

  const confirmDeleteRetake = async () => {
    const { trackId, takeId, retakeNumber } = deleteRetakeConfirmation
    setDeleteRetakeConfirmation({ isOpen: false, trackId: '', takeId: '', retakeNumber: 0 })

    const result = await deleteTake(takeId)
    if (result.success) {
      // Update tracks state to remove the deleted take
      setTracks((prevTracks) =>
        prevTracks.map((track) => {
          if (track.id === trackId) {
            return {
              ...track,
              takes: track.takes?.filter((t) => t.id !== takeId) || []
            }
          }
          return track
        })
      )
      toast.success(`Retake #${retakeNumber} deleted successfully`)
    } else {
      toast.error(result.error || 'Failed to delete retake')
    }
  }

  const cancelDeleteRetake = () => {
    setDeleteRetakeConfirmation({ isOpen: false, trackId: '', takeId: '', retakeNumber: 0 })
  }

  // Master channel handlers
  const handleMasterVolumeChange = (volume: number) => {
    setMasterVolume(volume)
    playback.setMasterVolume(volume)
  }

  const handleMasterPanChange = (pan: number) => {
    setMasterPan(pan)
    playback.setMasterPan(pan)
  }

  const handleMasterMuteToggle = () => {
    setMasterMute((prev) => {
      const newMute = !prev
      playback.setMasterMute(newMute)
      return newMute
    })
  }

  // Handle waveform ready - store the loaded duration
  const handleWaveformReady = useCallback((trackId: string, duration: number) => {
    setTrackDurations((prev) => {
      const newMap = new Map(prev)
      newMap.set(trackId, duration)
      return newMap
    })
  }, [])

  const handleWaveformClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, trackId: string) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const timestamp = percentage * maxDuration

      setCommentModal({
        isOpen: true,
        trackId,
        timestamp,
        position: { x: e.clientX, y: e.clientY },
      })
    },
    [maxDuration]
  )

  const handleCommentSubmit = useCallback(
    async (text: string, timestamp: number) => {
      const result = await addTrackComment(commentModal.trackId, timestamp, text)
      if (result.success && result.comment) {
        toast.success('Comment added!')
        setTracks((prevTracks) =>
          prevTracks.map((track) => {
            if (track.id === commentModal.trackId && result.comment) {
              return {
                ...track,
                comments: [...(track.comments || []), result.comment],
              }
            }
            return track
          })
        )
      } else {
        toast.error(result.error || 'Failed to add comment')
      }
    },
    [commentModal.trackId]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      setDroppedFile(file)
      setIsUploadModalOpen(true)
    }
  }, [])

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
        isPlaying={playback.isPlaying}
        currentTime={playback.currentTime}
        hasTracksLoaded={tracks.length > 0}
        isMixerOpen={isMixerOpen}
        onPlayPause={playback.handlePlayPause}
        onStop={playback.handleStop}
        onToggleMixer={() => setIsMixerOpen(!isMixerOpen)}
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
          selectedTrackId={selectedTrackId}
          trackVolumes={trackControls.trackVolumes}
          trackMutes={trackControls.trackMutes}
          trackSolos={trackControls.trackSolos}
          trackAudioLevels={trackAudioLevels}
          renamingTrackId={renamingTrackHeaderId}
          onTrackSelect={setSelectedTrackId}
          onVolumeChange={trackControls.handleVolumeChange}
          onMuteToggle={trackControls.handleMuteToggle}
          onSoloToggle={trackControls.handleSoloToggle}
          onImport={handleImport}
          onToggleTakes={handleToggleTakes}
          onAddTrack={handleAddTrack}
          onContextMenu={handleTrackContextMenu}
          onTrackRename={handleTrackRename}
          onCancelRename={handleCancelRename}
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
                  <Button onClick={() => setIsUploadModalOpen(true)}>
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
                        left: `${(playback.currentTime / maxDuration) * 100}%`,
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
                      const isExpanded = track.isRetakeFolderOpen || false

                      // Check if original is active (for coloring)
                      const isOriginalActive = originalTake?.is_active || false

                      // Get comped sections for this track
                      const compedSections = track.compedSections || []

                      // Create a unique key that changes when active state changes or on refresh
                      const trackKey = `${track.id}-${refreshKey}`

                      return (
                        <div key={trackKey} className="relative">
                          {/* Original track waveform (always on top) */}
                          <CompableWaveformRow
                            trackId={track.id}
                            trackColor={track.color}
                            activeTake={originalTake}
                            loadedDuration={trackDurations.get(track.id) || 0}
                            maxDuration={maxDuration}
                            comments={track.comments}
                            currentUserId={currentUserId}
                            isRetake={false}
                            isActive={isOriginalActive}
                            compedSections={compedSections}
                            onWaveformReady={(duration) => handleWaveformReady(track.id, duration)}
                            waveformRef={(ref) => {
                              if (ref) {
                                playback.waveformRefs.current.set(track.id, ref)
                              } else {
                                playback.waveformRefs.current.delete(track.id)
                              }
                            }}
                            onClick={handleWaveformClick}
                            onSectionCreated={undefined} // Original track doesn't create sections
                            onSectionDeleted={(sectionId) => handleSectionDeleted(track.id, sectionId)}
                            readOnly={readOnly}
                          />

                          {/* Retake waveforms (if expanded) */}
                          {isExpanded && retakes.map((retake, idx) => {
                            // Get sections for this retake
                            const retakeSections = compedSections.filter(s => s.take_id === retake.id)

                            return (
                              <CompableWaveformRow
                                key={retake.id}
                                trackId={track.id}
                                trackColor={track.color}
                                activeTake={retake}
                                loadedDuration={trackDurations.get(track.id) || 0}
                                maxDuration={maxDuration}
                                comments={undefined} // Retakes don't have separate comments
                                currentUserId={currentUserId}
                                isRetake={true}
                                isActive={retake.is_active}
                                compedSections={retakeSections}
                                onWaveformReady={() => {}} // Don't update duration for retakes
                                waveformRef={() => {}} // Retakes don't need refs
                                onClick={undefined} // Retakes don't open comment modal
                                onSectionCreated={(startTime, endTime) =>
                                  handleSectionCreated(track.id, retake.id, startTime, endTime)
                                }
                                onSectionDeleted={(sectionId) => handleSectionDeleted(track.id, sectionId)}
                                readOnly={readOnly}
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
          setIsUploadModalOpen(false)
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
        onClose={() => setCommentModal({ ...commentModal, isOpen: false })}
      />

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <TrackContextMenu
          trackId={contextMenu.trackId}
          trackName={contextMenu.trackName}
          trackColor={contextMenu.trackColor}
          position={contextMenu.position}
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
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
            tracks={tracks}
            selectedTrackId={selectedTrackId}
            renamingTrackId={renamingMixerChannelId}
            trackVolumes={trackControls.trackVolumes}
            trackPans={trackControls.trackPans}
            trackMutes={trackControls.trackMutes}
            trackSolos={trackControls.trackSolos}
            trackAudioLevels={trackAudioLevels}
            masterVolume={masterVolume}
            masterPan={masterPan}
            masterMute={masterMute}
            masterAudioLevel={masterAudioLevel}
            onTrackSelect={setSelectedTrackId}
            onVolumeChange={trackControls.handleVolumeChange}
            onPanChange={trackControls.handlePanChange}
            onMuteToggle={trackControls.handleMuteToggle}
            onSoloToggle={trackControls.handleSoloToggle}
            onDeleteTrack={handleDeleteTrack}
            onImport={handleImport}
            onContextMenu={handleMixerContextMenu}
            onTrackRename={handleTrackRename}
            onCancelRename={handleCancelRename}
            onTracksReorder={handleTracksReorder}
            onMasterVolumeChange={handleMasterVolumeChange}
            onMasterPanChange={handleMasterPanChange}
            onMasterMuteToggle={handleMasterMuteToggle}
            onAddTrack={handleAddTrack}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  )
}
