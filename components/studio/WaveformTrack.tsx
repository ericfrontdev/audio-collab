'use client'

import Image from 'next/image'
import { WaveformDisplay, WaveformDisplayRef } from './WaveformDisplay'
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

interface TrackWithDetails extends ProjectTrack {
  takes?: TakeWithUploader[]
  comments?: CommentWithProfile[]
}

interface WaveformTrackProps {
  track: TrackWithDetails
  isSelected: boolean
  isMuted: boolean
  maxDuration: number
  primaryColor: string
  onTrackSelect: (trackId: string) => void
  onWaveformClick: (e: React.MouseEvent<HTMLDivElement>, trackId: string) => void
  onWaveformReady: (duration: number) => void
  onTimeUpdate: (time: number) => void
  waveformRef: (ref: WaveformDisplayRef | null) => void
}

export function WaveformTrack({
  track,
  isSelected,
  isMuted,
  maxDuration,
  primaryColor,
  onTrackSelect,
  onWaveformClick,
  onWaveformReady,
  onTimeUpdate,
  waveformRef,
}: WaveformTrackProps) {
  const activeTake = track.takes?.find((t) => t.is_active) || track.takes?.[0]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={`rounded-lg border overflow-hidden cursor-pointer hover:border-zinc-700 transition-colors ${
        isSelected ? 'border-primary' : 'border-zinc-800'
      }`}
      onClick={() => onTrackSelect(track.id)}
    >
      <div className="h-28 bg-zinc-900/30 py-2 relative">
        {activeTake ? (
          <>
            <div className={`relative ${isMuted ? 'opacity-30' : ''}`}>
              <WaveformDisplay
                ref={waveformRef}
                audioUrl={activeTake.audio_url}
                trackId={track.id}
                trackColor={primaryColor}
                height={96}
                onReady={onWaveformReady}
                onTimeUpdate={onTimeUpdate}
              />
            </div>

            {/* Muted overlay */}
            {isMuted && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-700">
                  <span className="text-xs text-gray-400 font-medium">
                    🔇 Muted
                  </span>
                </div>
              </div>
            )}

            {/* Click overlay for adding comments */}
            <div
              className="absolute inset-0 cursor-text z-10"
              onClick={(e) => {
                e.stopPropagation()
                onWaveformClick(e, track.id)
              }}
              title="Click to add a comment"
            />

            {/* Comment bubbles */}
            {maxDuration > 0 &&
              track.comments?.map((comment) => (
                <div
                  key={comment.id}
                  className="absolute z-20 group"
                  style={{
                    left: `${(comment.timestamp / maxDuration) * 100}%`,
                    bottom: '8px',
                    transform: 'translateX(-50%)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Avatar bubble */}
                  <div className="relative">
                    {comment.profile?.avatar_url ? (
                      <Image
                        src={comment.profile.avatar_url}
                        alt={comment.profile.username || 'User'}
                        width={20}
                        height={20}
                        className="rounded-full border border-white shadow-lg hover:scale-110 transition-transform cursor-pointer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-semibold hover:scale-110 transition-transform cursor-pointer">
                        {comment.profile?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}

                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-30">
                      <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-zinc-700 whitespace-nowrap max-w-xs">
                        <div className="font-semibold mb-1">
                          @
                          {comment.profile?.username ||
                            comment.profile?.display_name ||
                            'Unknown'}
                        </div>
                        <div className="text-gray-300 max-w-[250px] break-words whitespace-normal">
                          {comment.text}
                        </div>
                        <div className="text-gray-500 text-[10px] mt-1">
                          {formatTime(comment.timestamp)}
                        </div>
                        {/* Arrow pointing down */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-700" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">No audio uploaded</span>
          </div>
        )}
      </div>
    </div>
  )
}
