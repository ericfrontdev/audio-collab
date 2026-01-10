'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Layers, GripVertical } from 'lucide-react'
import { VUMeter } from './VUMeter'
import { VolumeControl } from './VolumeControl'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('studio.trackHeader')
  const [isHovering, setIsHovering] = useState(false)
  const [editingName, setEditingName] = useState(trackName)
  const inputRef = useRef<HTMLInputElement>(null)
  const allowBlur = useRef<boolean>(false)

  // DnD hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trackId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  // Reset editing name when starting to rename
  useEffect(() => {
    if (isRenaming) {
      setEditingName(trackName)
      allowBlur.current = false
      // Focus and select the input with a slight delay
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
        // Allow blur after input is fully ready
        setTimeout(() => {
          allowBlur.current = true
        }, 100)
      }, 50)
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
      ref={setNodeRef}
      style={{ ...style, borderLeft: `3px solid ${trackColor}` }}
      className={`
        relative flex w-60 h-[70px] flex-shrink-0
        border-r border-b border-zinc-800
        transition-colors
        ${isSelected ? 'bg-zinc-800/60' : 'bg-zinc-900/60 hover:bg-zinc-800/40'}
      `}
      onClick={() => onSelect(trackId)}
      onContextMenu={(e) => onContextMenu(e, trackId)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Grip handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-8 h-full cursor-grab active:cursor-grabbing text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 flex-shrink-0 transition-colors"
        onClick={(e) => e.stopPropagation()}
        title={t('dragToReorder')}
      >
        <GripVertical className="w-5 h-5" />
      </button>

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
              onBlur={() => {
                // Only process blur if we've allowed it (after input is ready)
                if (allowBlur.current) {
                  onRename(trackId, editingName)
                }
              }}
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
            className="w-6 h-6 flex items-center justify-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors outline outline-1 outline-black"
            title={t('importAudio')}
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

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
          >
            M
          </button>
        </div>

        {/* Row 2: Waveform icon + Fader + Stack button */}
        <div className="flex-1 px-2 pb-2 flex items-center gap-2">
          {/* Waveform icon */}
          <div className="w-5 h-5 flex items-center justify-center text-zinc-600">
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
              color={trackColor}
              className="w-full"
            />
          </div>

          {/* Takes stack button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (takesCount > 0) {
                onToggleTakes(trackId)
              }
            }}
            disabled={takesCount === 0}
            className={`
              w-6 h-6 flex items-center justify-center rounded-sm transition-colors relative outline outline-1 outline-black
              ${
                takesCount === 0
                  ? 'bg-zinc-900/50 text-zinc-700 cursor-not-allowed opacity-40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white cursor-pointer'
              }
            `}
            title={takesCount === 0 ? t('noRetakes') : `${t('takes')} (${takesCount})`}
          >
            <Layers className="w-3.5 h-3.5" />
            {takesCount > 1 && (
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
