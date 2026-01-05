'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Layers } from 'lucide-react'
import { VUMeter } from './VUMeter'
import { VolumeControl } from './VolumeControl'

interface TrackHeaderProps {
  trackId: string
  trackName: string
  trackColor: string
  volume: number
  isMuted: boolean
  isSoloed: boolean
  isSelected: boolean
  isRenaming: boolean
  takesCount: number
  audioLevel?: number
  audioPeak?: number
  onVolumeChange: (trackId: string, volume: number) => void
  onMuteToggle: (trackId: string) => void
  onSoloToggle: (trackId: string) => void
  onSelect: (trackId: string) => void
  onImport: (trackId: string) => void
  onToggleTakes: (trackId: string) => void
  onContextMenu: (e: React.MouseEvent, trackId: string) => void
  onRename: (trackId: string, newName: string) => void
  onCancelRename: () => void
}

export function TrackHeader({
  trackId,
  trackName,
  trackColor,
  volume,
  isMuted,
  isSoloed,
  isSelected,
  isRenaming,
  takesCount,
  audioLevel,
  audioPeak,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onSelect,
  onImport,
  onToggleTakes,
  onContextMenu,
  onRename,
  onCancelRename,
}: TrackHeaderProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [editingName, setEditingName] = useState(trackName)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset editing name when starting to rename
  useEffect(() => {
    if (isRenaming) {
      setEditingName(trackName)
      // Focus and select the input on next tick to avoid issues
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isRenaming, trackName])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onRename(trackId, editingName)
    } else if (e.key === 'Escape') {
      setEditingName(trackName)
      onCancelRename()
    }
  }

  return (
    <div
      className={`
        relative flex w-52 h-[70px] flex-shrink-0
        border-r border-b border-zinc-800
        transition-colors
        ${isSelected ? 'bg-zinc-800/60' : 'bg-zinc-900/60 hover:bg-zinc-800/40'}
      `}
      style={{ borderLeft: `3px solid ${trackColor}` }}
      onClick={() => onSelect(trackId)}
      onContextMenu={(e) => onContextMenu(e, trackId)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Main content area (2 rows) */}
      <div className="flex-1 flex flex-col">
        {/* Row 1: Name + Buttons */}
        <div className="h-8 px-2 flex items-center gap-2">
          {/* Track name */}
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => onRename(trackId, editingName)}
              className="flex-1 text-xs text-white font-medium bg-zinc-800 border border-primary rounded px-1 py-0.5 outline-none min-w-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-xs text-white font-medium truncate min-w-0">
              {trackName}
            </span>
          )}

          {/* Import button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onImport(trackId)
            }}
            className="w-5 h-5 flex items-center justify-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors outline outline-1 outline-black"
            title="Import audio"
          >
            <Upload className="w-3 h-3" />
          </button>

          {/* Solo button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSoloToggle(trackId)
            }}
            className={`
              w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-sm transition-all outline outline-1 outline-black
              ${
                isSoloed
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
              }
            `}
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
              w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-sm transition-all outline outline-1 outline-black
              ${
                isMuted
                  ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/50'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
              }
            `}
          >
            M
          </button>
        </div>

        {/* Row 2: Waveform icon + Fader + Stack button */}
        <div className="flex-1 px-2 pb-2 flex items-center gap-2">
          {/* Waveform icon */}
          <div className="w-4 h-4 flex items-center justify-center text-zinc-600">
            <svg
              width="14"
              height="14"
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
          <VolumeControl
            value={volume}
            onChange={(newVolume) => onVolumeChange(trackId, newVolume)}
            color={trackColor}
            className="flex-1"
          />

          {/* Takes stack button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleTakes(trackId)
            }}
            className="w-5 h-5 flex items-center justify-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors relative outline outline-1 outline-black"
            title={`Takes (${takesCount})`}
          >
            <Layers className="w-3 h-3" />
            {takesCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#9363f7] rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                {takesCount}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* VU Meter (right side, full height) */}
      <VUMeter
        trackId={trackId}
        level={audioLevel}
        peak={audioPeak}
        width={10}
        height={70}
        className="border-l border-zinc-900"
      />
    </div>
  )
}
