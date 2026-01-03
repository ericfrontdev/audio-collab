'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TrackHeader } from './TrackHeader'

interface TrackWithDetails {
  id: string
  name: string
  color: string
  takes?: any[]
}

interface TrackHeaderListProps {
  tracks: TrackWithDetails[]
  selectedTrackId: string | null
  trackVolumes: Map<string, number>
  trackMutes: Set<string>
  trackSolos: Set<string>
  trackAudioLevels?: Map<string, { level: number; peak: number }>
  renamingTrackId: string | null
  onTrackSelect: (trackId: string) => void
  onVolumeChange: (trackId: string, volume: number) => void
  onMuteToggle: (trackId: string) => void
  onSoloToggle: (trackId: string) => void
  onImport: (trackId: string) => void
  onToggleTakes: (trackId: string) => void
  onAddTrack: () => void
  onContextMenu: (e: React.MouseEvent, trackId: string) => void
  onTrackRename: (trackId: string, newName: string) => void
  onCancelRename: () => void
}

export function TrackHeaderList({
  tracks,
  selectedTrackId,
  trackVolumes,
  trackMutes,
  trackSolos,
  trackAudioLevels,
  renamingTrackId,
  onTrackSelect,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onImport,
  onToggleTakes,
  onAddTrack,
  onContextMenu,
  onTrackRename,
  onCancelRename,
}: TrackHeaderListProps) {
  return (
    <div className="flex flex-col w-52 flex-shrink-0 bg-zinc-900/80 border-r border-zinc-800">
      {/* Header */}
      <div className="h-10 md:h-12 px-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50">
        <h2 className="text-xs font-semibold text-white tracking-wide">TRACKS</h2>
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

      {/* Track list - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <p className="text-sm text-zinc-500 mb-3">No tracks</p>
              <Button onClick={onAddTrack} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Track
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {tracks.map((track) => (
              <TrackHeader
                key={track.id}
                trackId={track.id}
                trackName={track.name}
                trackColor={track.color}
                volume={trackVolumes.get(track.id) ?? 80}
                isMuted={trackMutes.has(track.id)}
                isSoloed={trackSolos.has(track.id)}
                isSelected={selectedTrackId === track.id}
                isRenaming={renamingTrackId === track.id}
                takesCount={track.takes?.length ?? 0}
                audioLevel={trackAudioLevels?.get(track.id)?.level}
                audioPeak={trackAudioLevels?.get(track.id)?.peak}
                onVolumeChange={onVolumeChange}
                onMuteToggle={onMuteToggle}
                onSoloToggle={onSoloToggle}
                onSelect={onTrackSelect}
                onImport={onImport}
                onToggleTakes={onToggleTakes}
                onContextMenu={onContextMenu}
                onRename={onTrackRename}
                onCancelRename={onCancelRename}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
