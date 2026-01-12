'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MixerChannel } from './MixerChannel'
import { MasterChannel } from './MasterChannel'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useStudioStore, useUIStore, useMixerStore } from '@/lib/stores'
import { useAudioEngine } from '@/hooks/useAudioEngine'

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

interface MixerSettings {
  id: string
  track_id: string
  volume: number
  pan: number
  solo: boolean
  mute: boolean
}

interface TrackWithDetails {
  id: string
  name: string
  color: string
  active_take_id: string | null
  takes?: TakeWithUploader[]
  mixer_settings?: MixerSettings | null
}

interface MixerViewProps {
  onDeleteTrack: (trackId: string, trackName: string) => void
  onImport: (trackId: string) => void
  onContextMenu: (e: React.MouseEvent, trackId: string) => void
  onTrackRename: (trackId: string, newName: string) => void
  onTracksReorder: (trackIds: string[]) => void
  onAddTrack: () => void
  readOnly?: boolean
}

export function MixerView({
  onDeleteTrack,
  onImport,
  onContextMenu,
  onTrackRename,
  onTracksReorder,
  onAddTrack,
  readOnly,
}: MixerViewProps) {
  // Get data from stores
  const tracks = useStudioStore((state) => state.tracks)
  const selectedTrackId = useUIStore((state) => state.selectedTrackId)
  const setSelectedTrackId = useUIStore((state) => state.setSelectedTrackId)
  const renamingTrackId = useUIStore((state) => state.renamingMixerChannelId)
  const setRenamingMixerChannelId = useUIStore((state) => state.setRenamingMixerChannelId)

  const trackMixerSettings = useMixerStore((state) => state.tracks)
  const trackAudioLevels = useMixerStore((state) => state.trackLevels)
  const masterVolume = useMixerStore((state) => state.masterVolume)
  const masterPan = useMixerStore((state) => state.masterPan)
  const masterMute = useMixerStore((state) => state.masterMute)
  const masterLevel = useMixerStore((state) => state.masterLevel)
  const setTrackVolume = useMixerStore((state) => state.setTrackVolume)
  const setTrackPan = useMixerStore((state) => state.setTrackPan)
  const setTrackMute = useMixerStore((state) => state.setTrackMute)
  const setTrackSolo = useMixerStore((state) => state.setTrackSolo)
  const setMasterVolume = useMixerStore((state) => state.setMasterVolume)
  const setMasterPan = useMixerStore((state) => state.setMasterPan)
  const setMasterMute = useMixerStore((state) => state.setMasterMute)
  const getAllSoloedTracks = useMixerStore((state) => state.getAllSoloedTracks)

  const audioEngine = useAudioEngine()

  // Derived state
  const trackVolumes = new Map(Array.from(trackMixerSettings.entries()).map(([id, settings]) => [id, settings.volume]))
  const trackPans = new Map(Array.from(trackMixerSettings.entries()).map(([id, settings]) => [id, settings.pan]))
  const trackMutes = new Set(Array.from(trackMixerSettings.entries()).filter(([_, settings]) => settings.mute).map(([id]) => id))
  const trackSolos = new Set(Array.from(trackMixerSettings.entries()).filter(([_, settings]) => settings.solo).map(([id]) => id))
  const masterAudioLevel = masterLevel

  // Handlers
  const handleVolumeChange = (trackId: string, volume: number) => {
    setTrackVolume(trackId, volume)
    audioEngine.setTrackVolume(trackId, volume / 100)
  }

  const handlePanChange = (trackId: string, pan: number) => {
    setTrackPan(trackId, pan)
    audioEngine.setTrackPan(trackId, pan / 100)
  }

  const handleMuteToggle = (trackId: string) => {
    const currentSettings = trackMixerSettings.get(trackId)
    const newMute = !currentSettings?.mute
    setTrackMute(trackId, newMute)
    audioEngine.setTrackMute(trackId, newMute)
  }

  const handleSoloToggle = (trackId: string) => {
    const currentSettings = trackMixerSettings.get(trackId)
    const newSolo = !currentSettings?.solo
    setTrackSolo(trackId, newSolo)

    // Apply solo logic to audio engine
    const soloedTracks = getAllSoloedTracks()
    tracks.forEach((track) => {
      const settings = trackMixerSettings.get(track.id)
      const shouldMute = soloedTracks.length > 0 && !soloedTracks.includes(track.id)
      audioEngine.setTrackMute(track.id, settings?.mute || shouldMute)
    })
  }

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

  const handleCancelRename = () => {
    setRenamingMixerChannelId(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((t) => t.id === active.id)
      const newIndex = tracks.findIndex((t) => t.id === over.id)

      const newTracks = arrayMove(tracks, oldIndex, newIndex)
      onTracksReorder(newTracks.map((t) => t.id))
    }
  }
  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50">
        <h2 className="text-xs font-semibold text-white tracking-wide">MIXER</h2>
        <Button
          onClick={onAddTrack}
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {/* Mixer Channels + Master */}
      <div className="flex-1 flex">
        {/* Scrollable Tracks */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          {tracks.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center max-w-xs px-4">
                <p className="text-sm text-zinc-500 mb-3">No tracks</p>
                <Button onClick={onAddTrack} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Track
                </Button>
              </div>
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tracks.map((t) => t.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex h-full">
                  {tracks.map((track) => {
                    const activeTake = track.takes?.find((t) => t.id === track.active_take_id) || track.takes?.[0]
                    const uploader = activeTake?.uploader

                    return (
                      <MixerChannel
                        key={track.id}
                        trackId={track.id}
                        trackName={track.name}
                        trackColor={track.color}
                        volume={trackVolumes.get(track.id) ?? 80}
                        pan={trackPans.get(track.id) ?? 0}
                        isMuted={trackMutes.has(track.id)}
                        isSoloed={trackSolos.has(track.id)}
                        isSelected={selectedTrackId === track.id}
                        isRenaming={renamingTrackId === track.id}
                        audioLevel={trackAudioLevels.get(track.id)?.level ?? 0}
                        audioPeak={trackAudioLevels.get(track.id)?.peak ?? 0}
                        onVolumeChange={handleVolumeChange}
                        onPanChange={handlePanChange}
                        onMuteToggle={handleMuteToggle}
                        onSoloToggle={handleSoloToggle}
                        onSelect={setSelectedTrackId}
                        onDelete={onDeleteTrack}
                        onImport={onImport}
                        onContextMenu={onContextMenu}
                        onRename={onTrackRename}
                        onCancelRename={handleCancelRename}
                        uploaderUsername={uploader?.username}
                      />
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Master Channel - Fixed */}
        <div className="flex-shrink-0">
          <MasterChannel
            volume={masterVolume}
            pan={masterPan}
            isMuted={masterMute}
            audioLevel={masterAudioLevel.level}
            audioPeak={masterAudioLevel.peak}
            onVolumeChange={handleMasterVolumeChange}
            onPanChange={handleMasterPanChange}
            onMuteToggle={handleMasterMuteToggle}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="h-8 border-t border-zinc-800 bg-zinc-900/50" />
    </div>
  )
}
