'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CanvasWaveform, CanvasWaveformRef } from './CanvasWaveform'

// Helper function to lighten/pale a hex color by mixing with white
function lightenColor(hex: string, amount: number = 0.9): string {
  // Remove # if present
  const color = hex.replace('#', '')

  // Convert to RGB
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)

  // Lighten by mixing with white (255)
  const newR = Math.round(r + (255 - r) * amount)
  const newG = Math.round(g + (255 - g) * amount)
  const newB = Math.round(b + (255 - b) * amount)

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG
    .toString(16)
    .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
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

interface WaveformTrackRowProps {
  trackId: string
  trackColor: string
  activeTake?: TakeWithUploader
  loadedDuration: number
  maxDuration: number
  comments?: CommentWithProfile[]
  currentUserId?: string
  onWaveformReady: (duration: number) => void
  waveformRef: (ref: CanvasWaveformRef | null) => void
  onClick?: (e: React.MouseEvent<HTMLDivElement>, trackId: string) => void
}

export function WaveformTrackRow({
  trackId,
  trackColor,
  activeTake,
  loadedDuration,
  maxDuration,
  comments,
  currentUserId,
  onWaveformReady,
  waveformRef,
  onClick,
}: WaveformTrackRowProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  // Calculate percentage width based on loaded duration vs maxDuration
  const widthPercentage =
    loadedDuration > 0 && maxDuration > 0
      ? (loadedDuration / maxDuration) * 100
      : 100

  // Notify parent when waveform canvas gets duration
  useEffect(() => {
    if (
      activeTake &&
      activeTake.waveform_data &&
      activeTake.waveform_data.length > 0
    ) {
      // Calculate duration from peaks (100 peaks per second)
      const calculatedDuration = activeTake.waveform_data.length / 100

      // Only call if duration has changed to avoid infinite loop
      if (calculatedDuration !== loadedDuration) {
        onWaveformReady(calculatedDuration)
      }
    }
  }, [activeTake, loadedDuration]) // Remove onWaveformReady from dependencies

  return (
    <div
      className="relative h-[70px] border-b border-zinc-800 py-2 cursor-pointer w-full"
      style={{
        backgroundColor: `${trackColor}40`,
      }}
      onClick={(e) => onClick?.(e, trackId)}
    >
      {/* Center baseline that continues after waveform */}
      <div
        className="absolute right-0"
        style={{
          left: `${widthPercentage}%`,
          top: 'calc(50% - 1px)',
          height: '2px',
          backgroundColor: trackColor,
        }}
      />

      {activeTake &&
      activeTake.waveform_data &&
      activeTake.waveform_data.length > 0 ? (
        <div
          className="h-full relative"
          style={{
            width: `${widthPercentage}%`,
          }}
        >
          <CanvasWaveform
            ref={waveformRef}
            key={activeTake.id}
            peaks={activeTake.waveform_data}
            trackColor={trackColor}
            height={54}
            duration={loadedDuration || activeTake.waveform_data.length / 100}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <span className="text-xs text-zinc-600">
            {activeTake ? 'Loading waveform...' : 'No audio'}
          </span>
        </div>
      )}

      {/* Comment bubbles */}
      {maxDuration > 0 &&
        comments?.map((comment) => (
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
    </div>
  )
}
