'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MixerChannel } from './MixerChannel'
import { MasterChannel } from './MasterChannel'

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
  takes?: TakeWithUploader[]
  mixer_settings?: MixerSettings | null
}

interface MixerViewProps {
  tracks: TrackWithDetails[]
  selectedTrackId: string | null
  trackVolumes: Map<string, number>
  trackPans: Map<string, number>
  trackMutes: Set<string>
  trackSolos: Set<string>
  trackAudioLevels: Map<string, { level: number; peak: number }>
  masterVolume: number
  masterPan: number
  masterMute: boolean
  onTrackSelect: (trackId: string) => void
  onVolumeChange: (trackId: string, volume: number) => void
  onPanChange: (trackId: string, pan: number) => void
  onMuteToggle: (trackId: string) => void
  onSoloToggle: (trackId: string) => void
  onDeleteTrack: (trackId: string, trackName: string) => void
  onImport: (trackId: string) => void
  onMasterVolumeChange: (volume: number) => void
  onMasterPanChange: (pan: number) => void
  onMasterMuteToggle: () => void
  onAddTrack: () => void
}

export function MixerView({
  tracks,
  selectedTrackId,
  trackVolumes,
  trackPans,
  trackMutes,
  trackSolos,
  trackAudioLevels,
  masterVolume,
  masterPan,
  masterMute,
  onTrackSelect,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onDeleteTrack,
  onImport,
  onMasterVolumeChange,
  onMasterPanChange,
  onMasterMuteToggle,
  onAddTrack,
}: MixerViewProps) {
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
            <div className="flex h-full">
              {tracks.map((track) => {
                const activeTake = track.takes?.find((t) => t.is_active) || track.takes?.[0]
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
                    audioLevel={trackAudioLevels.get(track.id)?.level ?? 0}
                    audioPeak={trackAudioLevels.get(track.id)?.peak ?? 0}
                    onVolumeChange={onVolumeChange}
                    onPanChange={onPanChange}
                    onMuteToggle={onMuteToggle}
                    onSoloToggle={onSoloToggle}
                    onSelect={onTrackSelect}
                    onDelete={onDeleteTrack}
                    onImport={onImport}
                    uploaderUsername={uploader?.username}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Master Channel - Fixed */}
        <div className="flex-shrink-0">
          <MasterChannel
            volume={masterVolume}
            pan={masterPan}
            isMuted={masterMute}
            onVolumeChange={onMasterVolumeChange}
            onPanChange={onMasterPanChange}
            onMuteToggle={onMasterMuteToggle}
          />
        </div>
      </div>
    </div>
  )
}
