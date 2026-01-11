'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { VUMeter } from './VUMeter'
import { VolumeControl } from './VolumeControl'
import { RetakeActivateButton } from './RetakeActivateButton'
import { useTranslations } from 'next-intl'

interface RetakeTrackHeaderProps {
  trackId: string
  takeId: string
  retakeNumber: number
  trackName: string
  trackColor: string
  volume: number
  isMuted: boolean
  isSoloed: boolean
  isSelected: boolean
  isActive: boolean
  audioLevel?: number
  audioPeak?: number
  onVolumeChange: (trackId: string, volume: number) => void
  onMuteToggle: (trackId: string) => void
  onSoloToggle: (trackId: string) => void
  onSelect: (trackId: string) => void
  onImport: (trackId: string) => void
  onActivate: () => void
  onDeleteRetake: (takeId: string) => void
  onContextMenu: (e: React.MouseEvent, trackId: string) => void
  readOnly?: boolean
}

export function RetakeTrackHeader({
  trackId,
  takeId,
  retakeNumber,
  trackName,
  trackColor,
  volume,
  isMuted,
  isSoloed,
  isSelected,
  isActive,
  audioLevel,
  audioPeak,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onSelect,
  onImport,
  onActivate,
  onDeleteRetake,
  onContextMenu,
  readOnly = false,
}: RetakeTrackHeaderProps) {
  const t = useTranslations('studio.trackHeader')

  // Determine background and text colors based on active state
  const bgColor = isActive
    ? (isSelected ? 'bg-zinc-800/60' : 'bg-zinc-900/60')
    : 'bg-zinc-800/40'

  const waveformColor = isActive ? trackColor : '#71717a' // zinc-600

  return (
    <div
      className={`
        relative flex w-60 h-[70px] flex-shrink-0
        border-r border-b border-zinc-800
        transition-all duration-200 ease-in-out
        ${bgColor} ${isSelected && !isActive ? 'hover:bg-zinc-800/40' : ''}
        ${isActive ? 'shadow-sm' : 'opacity-90'}
      `}
      onClick={() => onSelect(trackId)}
      onContextMenu={(e) => {
        // Disable context menu for retakes to prevent accidental track deletion
        e.preventDefault()
        e.stopPropagation()
      }}
      style={{
        ...(isActive && { boxShadow: `inset 0 0 0 1px ${trackColor}20` })
      }}
    >
      {/* Left section: 8px spacer (no grip for retakes) */}
      <div className="w-2 flex-shrink-0" />

      {/* Main content area (2 rows) */}
      <div className="flex-1 flex flex-col">
        {/* Row 1: Retake label + Activate button + Import + Solo + Mute */}
        <div className="h-8 px-2 flex items-center gap-2">
          {/* Retake label */}
          <span className={`flex-1 text-[10px] font-bold tracking-wide truncate min-w-0 ${
            isActive ? 'text-white' : 'text-zinc-500'
          }`}>
            RETAKE #{retakeNumber}
          </span>

          {/* Activate button */}
          {!readOnly && (
            <RetakeActivateButton
              isActive={isActive}
              onActivate={onActivate}
            />
          )}

          {/* Import button */}
          {!readOnly && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onImport(trackId)
              }}
              className="w-6 h-6 flex items-center justify-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors outline outline-1 outline-black"
              title={t('importAudio')}
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Solo button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSoloToggle(trackId)
            }}
            className={`
              w-6 h-6 flex items-center justify-center text-[11px] font-bold rounded-sm transition-all outline outline-1 outline-black
              ${
                isSoloed
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
              }
            `}
            disabled={readOnly}
          >
            S
          </button>

          {/* Mute button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMuteToggle(trackId)
            }}
            className={`
              w-6 h-6 flex items-center justify-center text-[11px] font-bold rounded-sm transition-all outline outline-1 outline-black
              ${
                isMuted
                  ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/50'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
              }
            `}
            disabled={readOnly}
          >
            M
          </button>
        </div>

        {/* Row 2: Waveform icon + Fader + Delete button */}
        <div className="flex-1 px-2 pb-2 flex items-center gap-2">
          {/* Waveform icon */}
          <div className={`w-5 h-5 flex items-center justify-center ${
            isActive ? 'text-zinc-600' : 'text-zinc-700'
          }`}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 14 14"
              fill="currentColor"
            >
              <rect x="0" y="6" width="1" height="2" />
              <rect x="2" y="4" width="1" height="6" />
              <rect x="4" y="2" width="1" height="10" />
              <rect x="6" y="5" width="1" height="4" />
              <rect x="8" y="3" width="1" height="8" />
              <rect x="10" y="4" width="1" height="6" />
              <rect x="12" y="6" width="1" height="2" />
            </svg>
          </div>

          {/* Volume fader */}
          <div className="flex-1 max-w-[130px]">
            <VolumeControl
              value={volume}
              onChange={(newVolume) => onVolumeChange(trackId, newVolume)}
              color={waveformColor}
              className="w-full"
            />
          </div>

          {/* Delete retake button */}
          {!readOnly && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDeleteRetake(takeId)
              }}
              className="w-6 h-6 flex items-center justify-center rounded-sm bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors outline outline-1 outline-black"
              title="Delete retake"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* VU Meter (right side, full height) */}
      <VUMeter
        level={audioLevel}
        peak={audioPeak}
      />
    </div>
  )
}
