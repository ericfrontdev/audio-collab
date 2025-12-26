'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload as UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadTrackModal } from './UploadTrackModal'
import { getProjectStudioData, deleteTrack, addTrackComment } from '@/app/actions/studio'
import { ProjectTrack } from '@/lib/types/studio'
import { toast } from 'react-toastify'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AddCommentModal } from './AddCommentModal'
import { TransportControls } from './TransportControls'
import { TrackList } from './TrackList'
import { TimelineRuler } from './TimelineRuler'
import { WaveformTrack } from './WaveformTrack'
import { useStudioPlayback } from './hooks/useStudioPlayback'
import { useStudioTracks } from './hooks/useStudioTracks'
import { useStudioTimeline } from './hooks/useStudioTimeline'

interface StudioViewProps {
  projectId: string
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
}

export function StudioView({ projectId }: StudioViewProps) {
  const [tracks, setTracks] = useState<TrackWithDetails[]>([])
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    trackId: string
    trackName: string
  }>({ isOpen: false, trackId: '', trackName: '' })
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean
    trackId: string
    timestamp: number
    position: { x: number; y: number }
  }>({ isOpen: false, trackId: '', timestamp: 0, position: { x: 0, y: 0 } })
  const [currentUser, setCurrentUser] = useState<{
    avatar_url?: string | null
  } | null>(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const primaryColor = '#9363f7'

  // Custom hooks
  const playback = useStudioPlayback()
  const trackControls = useStudioTracks(playback.waveformRefs)
  const timeline = useStudioTimeline({
    maxDuration: playback.maxDuration,
    waveformRefs: playback.waveformRefs,
    setCurrentTime: playback.setCurrentTime,
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
  const loadStudioData = async () => {
    setIsLoading(true)
    const result = await getProjectStudioData(projectId)
    if (result.success && result.tracks) {
      setTracks(result.tracks as TrackWithDetails[])
      if (result.tracks.length > 0 && !selectedTrackId) {
        setSelectedTrackId(result.tracks[0].id)
      }
    }
    setIsLoading(false)
  }

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
        setCurrentUser(profile)
      }
    }
    loadUserProfile()
  }, [projectId])

  const handleUploadSuccess = () => {
    loadStudioData()
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

  const handleWaveformClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, trackId: string) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const timestamp = percentage * playback.maxDuration

      setCommentModal({
        isOpen: true,
        trackId,
        timestamp,
        position: { x: e.clientX, y: e.clientY },
      })
    },
    [playback.maxDuration]
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
        isPlaying={playback.isPlaying}
        currentTime={playback.currentTime}
        hasTracksLoaded={tracks.length > 0}
        onPlayPause={playback.handlePlayPause}
        onStop={playback.handleStop}
      />

      {/* Main Studio Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Track List */}
        <TrackList
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          trackVolumes={trackControls.trackVolumes}
          trackMutes={trackControls.trackMutes}
          trackSolos={trackControls.trackSolos}
          primaryColor={primaryColor}
          onTrackSelect={setSelectedTrackId}
          onVolumeChange={trackControls.handleVolumeChange}
          onMuteToggle={trackControls.handleMuteToggle}
          onSoloToggle={trackControls.handleSoloToggle}
          onDeleteTrack={handleDeleteTrack}
          onAddTrack={() => setIsUploadModalOpen(true)}
        />

        {/* Center: Timeline & Waveforms */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          {tracks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
                  <UploadIcon className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No tracks yet</h3>
                <p className="text-gray-400 mb-6">
                  Upload your first audio track to get started
                </p>
                <Button onClick={() => setIsUploadModalOpen(true)}>
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Upload Track
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Single unified playhead */}
              <div className="absolute inset-0 pointer-events-none z-40">
                {playback.maxDuration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white"
                    style={{
                      left: `${(playback.currentTime / playback.maxDuration) * 100}%`,
                    }}
                  />
                )}
              </div>

              {/* Timeline Ruler */}
              <TimelineRuler
                ref={timeline.timelineRef}
                maxDuration={playback.maxDuration}
                isDragging={timeline.isDraggingPlayhead}
                onMouseDown={timeline.handleTimelineMouseDown}
                onTouchStart={timeline.handleTimelineTouchStart}
              />

              {/* Tracks & Waveforms */}
              <div className="flex-1 overflow-auto relative">
                <div className="py-4 space-y-3">
                  {tracks.map((track) => (
                    <WaveformTrack
                      key={track.id}
                      track={track}
                      isSelected={selectedTrackId === track.id}
                      isMuted={trackControls.trackMutes.has(track.id)}
                      maxDuration={playback.maxDuration}
                      primaryColor={primaryColor}
                      onTrackSelect={setSelectedTrackId}
                      onWaveformClick={handleWaveformClick}
                      onWaveformReady={playback.handleWaveformReady}
                      onTimeUpdate={playback.handleTimeUpdate}
                      waveformRef={(ref) => {
                        if (ref) {
                          playback.waveformRefs.current.set(track.id, ref)
                        } else {
                          playback.waveformRefs.current.delete(track.id)
                        }
                      }}
                    />
                  ))}
                </div>

                {/* Drag & Drop Zone */}
                <div className="p-4">
                  <div
                    className={`h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                      isDraggingFile
                        ? 'border-primary bg-primary/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    onClick={() => setIsUploadModalOpen(true)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <UploadIcon
                        className={`w-6 h-6 mx-auto mb-2 ${
                          isDraggingFile ? 'text-primary' : 'text-gray-600'
                        }`}
                      />
                      <p
                        className={`text-sm ${
                          isDraggingFile ? 'text-primary' : 'text-gray-500'
                        }`}
                      >
                        {isDraggingFile
                          ? 'Drop file here'
                          : 'Drag and Drop here or choose file'}
                      </p>
                    </div>
                  </div>
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
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Track"
        message={`Are you sure you want to delete "${deleteConfirmation.trackName}"? This will permanently delete the track and all its audio files.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteTrack}
        onCancel={cancelDeleteTrack}
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
    </div>
  )
}
