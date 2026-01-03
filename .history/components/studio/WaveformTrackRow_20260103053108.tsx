'use client'

import { useState, useEffect } from 'react'
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
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
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

interface WaveformTrackRowProps {
  trackId: string
  trackColor: string
  activeTake?: TakeWithUploader
  loadedDuration: number
  maxDuration: number
  onWaveformReady: (duration: number) => void
  onTimeUpdate: (time: number) => void
  onAudioLevel?: (level: number, peak: number) => void
  waveformRef: (ref: CanvasWaveformRef | null) => void
  onClick?: (e: React.MouseEvent<HTMLDivElement>, trackId: string) => void
}

export function WaveformTrackRow({
  trackId,
  trackColor,
  activeTake,
  loadedDuration,
  maxDuration,
  onWaveformReady,
  onTimeUpdate,
  onAudioLevel,
  waveformRef,
  onClick,
}: WaveformTrackRowProps) {
  // Calculate percentage width based on loaded duration vs maxDuration
  const widthPercentage = loadedDuration > 0 && maxDuration > 0
    ? (loadedDuration / maxDuration) * 100
    : 100

  console.log('📊 Track:', trackId.substring(0, 8), '- LoadedDuration:', loadedDuration.toFixed(2), '/ MaxDuration:', maxDuration.toFixed(2), '= Width:', widthPercentage.toFixed(2), '%')

  // Notify parent when waveform canvas gets duration
  useEffect(() => {
    if (activeTake && activeTake.waveform_data && activeTake.waveform_data.length > 0) {
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
        backgroundColor: `${trackColor}40`
      }}
      onClick={(e) => onClick?.(e, trackId)}
    >
      {/* Center baseline that extends full width */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '50%',
          height: '2px',
          backgroundColor: trackColor,
        }}
      />

      {activeTake && activeTake.waveform_data && activeTake.waveform_data.length > 0 ? (
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
    </div>
  )
}
