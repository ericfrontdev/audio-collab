'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Trash2, Upload } from 'lucide-react'
import { VUMeterBar } from './VUMeterBar'

interface MixerChannelProps {
  trackId: string
  trackName: string
  trackColor: string
  volume: number // 0-100
  pan: number // -100 to 100
  isMuted: boolean
  isSoloed: boolean
  isSelected: boolean
  audioLevel?: number
  audioPeak?: number
  onVolumeChange: (trackId: string, volume: number) => void
  onPanChange: (trackId: string, pan: number) => void
  onMuteToggle: (trackId: string) => void
  onSoloToggle: (trackId: string) => void
  onSelect: (trackId: string) => void
  onDelete: (trackId: string, trackName: string) => void
  onImport: (trackId: string) => void
  uploaderUsername?: string
}

export function MixerChannel({
  trackId,
  trackName,
  trackColor,
  volume,
  pan,
  isMuted,
  isSoloed,
  isSelected,
  audioLevel = 0,
  audioPeak = 0,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onSelect,
  onDelete,
  onImport,
  uploaderUsername,
}: MixerChannelProps) {
  const [isHoveringFader, setIsHoveringFader] = useState(false)
  const [isHoveringPan, setIsHoveringPan] = useState(false)
  const [isDraggingFader, setIsDraggingFader] = useState(false)
  const [isDraggingPan, setIsDraggingPan] = useState(false)
  const [peak, setPeak] = useState(0)

  const faderRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragStartX = useRef(0)
  const dragStartValue = useRef(0)

  // Convert volume (0-100) to dB
  const volumeToDb = (vol: number): string => {
    if (vol === 0) return '-∞'
    const db = 20 * Math.log10(vol / 100)
    return db.toFixed(1)
  }

  // Calculate fader position (0 = bottom, 100 = top)
  const faderPosition = volume

  // Handle fader drag
  const handleFaderMouseDown = useCallback((e: React.MouseEvent) => {
    if (!faderRef.current) return

    setIsDraggingFader(true)
    dragStartY.current = e.clientY
    dragStartValue.current = volume

    const rect = faderRef.current.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const percentage = 100 - (clickY / rect.height) * 100
    const newVolume = Math.max(0, Math.min(100, percentage))
    onVolumeChange(trackId, Math.round(newVolume))

    e.preventDefault()
  }, [volume, trackId, onVolumeChange])

  const handleFaderMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingFader || !faderRef.current) return

    const rect = faderRef.current.getBoundingClientRect()
    const deltaY = dragStartY.current - e.clientY
    const deltaPercentage = (deltaY / rect.height) * 100
    const newVolume = Math.max(0, Math.min(100, dragStartValue.current + deltaPercentage))

    onVolumeChange(trackId, Math.round(newVolume))
  }, [isDraggingFader, trackId, onVolumeChange])

  const handleFaderMouseUp = useCallback(() => {
    setIsDraggingFader(false)
  }, [])

  // Handle pan drag
  const handlePanMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panRef.current) return

    setIsDraggingPan(true)
    dragStartX.current = e.clientX
    dragStartValue.current = pan

    const rect = panRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = (clickX / rect.width) * 200 - 100
    const newPan = Math.max(-100, Math.min(100, percentage))
    onPanChange(trackId, Math.round(newPan))

    e.preventDefault()
  }, [pan, trackId, onPanChange])

  const handlePanMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingPan || !panRef.current) return

    const rect = panRef.current.getBoundingClientRect()
    const deltaX = e.clientX - dragStartX.current
    const deltaPercentage = (deltaX / rect.width) * 200
    const newPan = Math.max(-100, Math.min(100, dragStartValue.current + deltaPercentage))

    onPanChange(trackId, Math.round(newPan))
  }, [isDraggingPan, trackId, onPanChange])

  const handlePanMouseUp = useCallback(() => {
    setIsDraggingPan(false)
  }, [])

  // Global mouse events
  useEffect(() => {
    if (isDraggingFader) {
      window.addEventListener('mousemove', handleFaderMouseMove)
      window.addEventListener('mouseup', handleFaderMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleFaderMouseMove)
        window.removeEventListener('mouseup', handleFaderMouseUp)
      }
    }
  }, [isDraggingFader, handleFaderMouseMove, handleFaderMouseUp])

  useEffect(() => {
    if (isDraggingPan) {
      window.addEventListener('mousemove', handlePanMouseMove)
      window.addEventListener('mouseup', handlePanMouseUp)
      return () => {
        window.removeEventListener('mousemove', handlePanMouseMove)
        window.removeEventListener('mouseup', handlePanMouseUp)
      }
    }
  }, [isDraggingPan, handlePanMouseMove, handlePanMouseUp])

  // TODO: Peak should be connected to actual audio analysis, not volume fader

  return (
    <div
      className={`
        relative flex flex-col h-full w-24 flex-shrink-0
        bg-zinc-950 border-r border-zinc-900
        transition-colors
        ${isSelected ? 'bg-zinc-900' : 'hover:bg-zinc-900/50'}
      `}
      onClick={() => onSelect(trackId)}
      style={{
        borderTop: `3px solid ${trackColor}`,
      }}
    >
      {/* Track Name Header */}
      <div className="relative h-16 px-2 flex items-center justify-center gap-2 border-b border-zinc-900 group">
        <div className="flex-1 min-w-0 text-center">
          <span className="text-xs text-white font-medium truncate block">
            {trackName}
          </span>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(trackId, trackName)
          }}
          className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Import/Solo/Mute Buttons (collés ensemble) */}
      <div className="h-7 px-2 flex items-center justify-center border-b border-zinc-900">
        {/* Import button (coins gauches arrondis) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onImport(trackId)
          }}
          className="flex-1 h-5 flex items-center justify-center bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors rounded-l-[2px] outline outline-1 outline-black"
          title="Import audio"
        >
          <Upload className="w-3 h-3" />
        </button>

        {/* Solo button (pas de coins arrondis) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSoloToggle(trackId)
          }}
          className={`
            flex-1 h-5 flex items-center justify-center text-[10px] font-bold transition-all outline outline-1 outline-black
            ${
              isSoloed
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
            }
          `}
        >
          S
        </button>

        {/* Mute button (coins droits arrondis) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMuteToggle(trackId)
          }}
          className={`
            flex-1 h-5 flex items-center justify-center text-[10px] font-bold transition-all rounded-r-[2px] outline outline-1 outline-black
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

      {/* Pan Control */}
      <div
        ref={panRef}
        className="relative h-5 mx-2 my-2 bg-zinc-900 rounded-[2px] cursor-ew-resize overflow-hidden"
        onMouseDown={handlePanMouseDown}
        onMouseEnter={() => setIsHoveringPan(true)}
        onMouseLeave={() => setIsHoveringPan(false)}
      >
        {/* Pan fill from center */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Left fill */}
          {pan < 0 && (
            <div
              className="absolute h-full bg-[#9363f7]/30"
              style={{
                right: '50%',
                width: `${Math.abs(pan) / 2}%`,
              }}
            />
          )}

          {/* Right fill */}
          {pan > 0 && (
            <div
              className="absolute h-full bg-[#9363f7]/30"
              style={{
                left: '50%',
                width: `${pan / 2}%`,
              }}
            />
          )}

          {/* Pan indicator line */}
          <div
            className={`
              absolute top-0 bottom-0 bg-[#9363f7] transition-all
              ${isHoveringPan || isDraggingPan ? 'w-1' : 'w-0.5'}
            `}
            style={{
              left: `${(pan + 100) / 2}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>

      {/* Peak/Volume Row */}
      <div className="h-5 px-2 flex items-center justify-between text-[10px] font-mono border-b border-zinc-900">
        <span className="text-zinc-500">{volumeToDb(peak)}</span>
        <span className="text-[#9363f7] font-semibold">{volumeToDb(volume)}</span>
      </div>

      {/* Fader Section */}
      <div className="flex-1 flex px-2 pb-1 pt-1">
        {/* Left section: Graduations + VU Meter */}
        <div className="flex">
          {/* dB Scale with tick marks (logarithmic spacing) */}
          <div className="relative w-5 h-full text-[10px] text-zinc-500 font-mono select-none">
            {/* 0 dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '5%' }}>
              <span>0</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* 6 dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '15%' }}>
              <span>6</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* 12 dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '25%' }}>
              <span>12</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* 18 dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '35%' }}>
              <span>18</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* 24 dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '45%' }}>
              <span>24</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* 30 dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '55%' }}>
              <span>30</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* 36 dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '65%' }}>
              <span>36</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* 42 dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '73%' }}>
              <span>42</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* 48 dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '81%' }}>
              <span>48</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* 60 dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '89%' }}>
              <span>60</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* ∞ dB */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '97%' }}>
              <span>∞</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
          </div>

          {/* VU Meter */}
          <VUMeterBar level={audioLevel} peak={audioPeak} width={12} className="rounded-[2px]" />
        </div>

        {/* Right section: Fader */}
        <div className="flex-1 flex flex-col ml-1">
          <div
            ref={faderRef}
            className="relative flex-1 bg-black border border-black rounded-[2px] cursor-ns-resize overflow-hidden"
            onMouseDown={handleFaderMouseDown}
            onMouseEnter={() => setIsHoveringFader(true)}
            onMouseLeave={() => setIsHoveringFader(false)}
          >
            {/* Fill below fader */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-[#9363f733] transition-all rounded-[1px]"
              style={{
                height: `${faderPosition}%`,
              }}
            />

            {/* Fader line (horizontal) */}
            <div
              className={`
                absolute left-0 right-0 transition-all
                ${
                  isHoveringFader || isDraggingFader
                    ? 'bg-[#9363f7] h-1 shadow-lg shadow-[#9363f7]/50'
                    : 'bg-[#6b46c1] h-0.5'
                }
              `}
              style={{
                bottom: `${faderPosition}%`,
                transform: 'translateY(50%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Track color strip at bottom */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: trackColor }}
      />
    </div>
  )
}
