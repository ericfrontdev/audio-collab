'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectTrack } from '@/lib/types/studio'

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

interface TrackWithDetails extends ProjectTrack {
  takes?: TakeWithUploader[]
}

interface TrackListProps {
  tracks: TrackWithDetails[]
  selectedTrackId: string | null
  trackVolumes: Map<string, number>
  trackMutes: Set<string>
  trackSolos: Set<string>
  primaryColor: string
  onTrackSelect: (trackId: string) => void
  onVolumeChange: (trackId: string, volume: number) => void
  onMuteToggle: (trackId: string) => void
  onSoloToggle: (trackId: string) => void
  onDeleteTrack: (trackId: string, trackName: string) => void
  onAddTrack: () => void
}

export function TrackList({
  tracks,
  selectedTrackId,
  trackVolumes,
  trackMutes,
  trackSolos,
  primaryColor,
  onTrackSelect,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onDeleteTrack,
  onAddTrack,
}: TrackListProps) {
  return (
    <div className="w-48 lg:w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col flex-shrink-0">
      <div className="px-2 sm:px-3 py-3.5 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white">Tracks</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {tracks.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-3">No tracks yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`relative group rounded-lg transition-colors h-28 ${
                  selectedTrackId === track.id
                    ? 'bg-zinc-800'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <div
                  onClick={() => onTrackSelect(track.id)}
                  className="w-full h-full text-left px-2 sm:px-3 py-2 flex flex-col justify-center"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: track.color }}
                      />
                      <span
                        className={`text-sm font-medium truncate ${
                          selectedTrackId === track.id
                            ? 'text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        {track.name}
                      </span>
                    </div>
                    {(() => {
                      const activeTake =
                        track.takes?.find((t) => t.is_active) ||
                        track.takes?.[0]
                      const uploader = activeTake?.uploader
                      if (uploader) {
                        return (
                          <span className="text-[10px] text-gray-400 bg-zinc-800 px-2 py-0.5 rounded-full flex-shrink-0 mr-6">
                            @
                            {uploader.username ||
                              uploader.display_name ||
                              'unknown'}
                          </span>
                        )
                      }
                      return null
                    })()}
                  </div>

                  {/* Volume Slider */}
                  <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={trackVolumes.get(track.id) || 80}
                      onChange={(e) =>
                        onVolumeChange(track.id, Number(e.target.value))
                      }
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      style={{
                        background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${
                          trackVolumes.get(track.id) || 80
                        }%, #3f3f46 ${
                          trackVolumes.get(track.id) || 80
                        }%, #3f3f46 100%)`,
                      }}
                    />
                  </div>

                  {/* M and S Buttons */}
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onMuteToggle(track.id)
                      }}
                      className={`flex-1 px-2 py-1 text-xs font-bold rounded transition-colors ${
                        trackMutes.has(track.id)
                          ? 'bg-yellow-600 text-white'
                          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      }`}
                    >
                      M
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSoloToggle(track.id)
                      }}
                      className={`flex-1 px-2 py-1 text-xs font-bold rounded transition-colors ${
                        trackSolos.has(track.id)
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      }`}
                    >
                      S
                    </button>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteTrack(track.id, track.name)
                  }}
                  className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                  title="Delete track"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-2 sm:p-4 border-t border-zinc-800">
        <Button onClick={onAddTrack} className="w-full text-xs sm:text-sm" size="sm">
          <Plus className="w-4 h-4 mr-1 sm:mr-2" />
          Add Track
        </Button>
      </div>
    </div>
  )
}
