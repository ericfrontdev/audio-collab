'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { VUMeterBar } from './VUMeterBar'

interface MasterChannelProps {
  volume: number // 0-100
  pan: number // -100 to 100
  isMuted: boolean
  audioLevel?: number // 0-100
  audioPeak?: number // 0-100
  onVolumeChange: (volume: number) => void
  onPanChange: (pan: number) => void
  onMuteToggle: () => void
}

export function MasterChannel({
  volume,
  pan,
  isMuted,
  audioLevel = 0,
  audioPeak = 0,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
}: MasterChannelProps) {
  const [isHoveringFader, setIsHoveringFader] = useState(false)
  const [isHoveringPan, setIsHoveringPan] = useState(false)
  const [isDraggingFader, setIsDraggingFader] = useState(false)
  const [isDraggingPan, setIsDraggingPan] = useState(false)

  const faderRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragStartX = useRef(0)
  const dragStartValue = useRef(0)

  // Convert level (0-100) to dB for display
  const levelToDb = (level: number): string => {
    if (level === 0) return '-∞'
    // Convert 0-100 scale to dB (assuming 100 = 0dB, 0 = -∞dB)
    // Using logarithmic scale: dB = 20 * log10(level/100)
    const db = 20 * Math.log10(level / 100)
    return db.toFixed(1)
  }

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
    onVolumeChange(Math.round(newVolume))

    e.preventDefault()
  }, [volume, onVolumeChange])

  const handleFaderMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingFader || !faderRef.current) return

    const rect = faderRef.current.getBoundingClientRect()
    const deltaY = dragStartY.current - e.clientY
    const deltaPercentage = (deltaY / rect.height) * 100
    const newVolume = Math.max(0, Math.min(100, dragStartValue.current + deltaPercentage))

    onVolumeChange(Math.round(newVolume))
  }, [isDraggingFader, onVolumeChange])

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
    onPanChange(Math.round(newPan))

    e.preventDefault()
  }, [pan, onPanChange])

  const handlePanMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingPan || !panRef.current) return

    const rect = panRef.current.getBoundingClientRect()
    const deltaX = e.clientX - dragStartX.current
    const deltaPercentage = (deltaX / rect.width) * 200
    const newPan = Math.max(-100, Math.min(100, dragStartValue.current + deltaPercentage))

    onPanChange(Math.round(newPan))
  }, [isDraggingPan, onPanChange])

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

  return (
    <div
      className="relative flex flex-col h-full w-24 flex-shrink-0 bg-zinc-950 border-r border-l border-zinc-900"
      style={{
        borderTop: `3px solid #9363f7`,
      }}
    >
      {/* Master Header */}
      <div className="relative h-16 px-2 flex items-center justify-center border-b border-zinc-900">
        <div className="flex-1 min-w-0 text-center">
          <span className="text-xs text-white font-medium">
            MASTER
          </span>
        </div>
      </div>

      {/* Mute Button (no solo for master) */}
      <div className="h-7 px-2 flex items-center justify-center border-b border-zinc-900">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMuteToggle()
          }}
          className={`
            flex-1 h-5 flex items-center justify-center text-[10px] font-bold transition-all rounded-[2px] outline outline-1 outline-black
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
        <span className="text-zinc-500">{levelToDb(audioPeak)}</span>
        <span className="text-[#9363f7] font-semibold">{volumeToDb(volume)}</span>
      </div>

      {/* Fader Section */}
      <div className="flex-1 flex px-2 pb-1 pt-1">
        {/* Left section: Graduations + VU Meter */}
        <div className="flex">
          {/* dB Scale with tick marks (matched to linear fader) - multiples of 2 */}
          <div className="relative w-5 h-full text-[10px] text-zinc-500 font-mono select-none">
            {/* 0 dB (vol=100) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '0%', transform: 'translateY(-50%)' }}>
              <span>0</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* -2 dB (vol=79.43) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '20.57%', transform: 'translateY(-50%)' }}>
              <span className="text-[8px]">-2</span>
              <div className="w-0.5 h-px bg-zinc-700" />
            </div>
            {/* -4 dB (vol=63.10) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '36.90%', transform: 'translateY(-50%)' }}>
              <span className="text-[8px]">-4</span>
              <div className="w-0.5 h-px bg-zinc-700" />
            </div>
            {/* -6 dB (vol=50.12) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '49.88%', transform: 'translateY(-50%)' }}>
              <span className="text-[9px]">-6</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* -8 dB (vol=39.81) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '60.19%', transform: 'translateY(-50%)' }}>
              <span className="text-[8px]">-8</span>
              <div className="w-0.5 h-px bg-zinc-700" />
            </div>
            {/* -10 dB (vol=31.62) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '68.38%', transform: 'translateY(-50%)' }}>
              <span className="text-[8px]">-10</span>
              <div className="w-0.5 h-px bg-zinc-700" />
            </div>
            {/* -12 dB (vol=25.12) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '74.88%', transform: 'translateY(-50%)' }}>
              <span className="text-[9px]">-12</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* -14 dB (vol=19.95) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '80.05%', transform: 'translateY(-50%)' }}>
              <span className="text-[8px]">-14</span>
              <div className="w-0.5 h-px bg-zinc-700" />
            </div>
            {/* -16 dB (vol=15.85) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '84.15%', transform: 'translateY(-50%)' }}>
              <span className="text-[8px]">-16</span>
              <div className="w-0.5 h-px bg-zinc-700" />
            </div>
            {/* -18 dB (vol=12.59) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '87.41%', transform: 'translateY(-50%)' }}>
              <span className="text-[9px]">-18</span>
              <div className="w-1 h-px bg-zinc-600" />
            </div>
            {/* -20 dB (vol=10.00) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ top: '90.00%', transform: 'translateY(-50%)' }}>
              <span className="text-[8px]">-20</span>
              <div className="w-0.5 h-px bg-zinc-700" />
            </div>
            {/* ∞ dB (vol=0) */}
            <div className="absolute flex items-center justify-end gap-0.5 w-full" style={{ bottom: '4px' }}>
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
        style={{ backgroundColor: '#9363f7' }}
      />
    </div>
  )
}
