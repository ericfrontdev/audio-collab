'use client'

import { useState, useRef } from 'react'
import { WaveformTrackRow } from './WaveformTrackRow'
import { CompedSectionOverlay } from './CompedSectionOverlay'
import { CompedSection } from '@/lib/types/studio'
import { CanvasWaveformRef } from './CanvasWaveform'

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

interface CompableWaveformRowProps {
  trackId: string
  trackColor: string
  activeTake?: TakeWithUploader
  loadedDuration: number
  maxDuration: number
  comments?: CommentWithProfile[]
  currentUserId?: string
  isRetake: boolean
  isActive: boolean
  compedSections?: CompedSection[]
  onWaveformReady: (duration: number) => void
  waveformRef: (ref: CanvasWaveformRef | null) => void
  onClick?: (e: React.MouseEvent<HTMLDivElement>, trackId: string) => void
  onSectionCreated?: (startTime: number, endTime: number) => void
  onSectionDeleted?: (sectionId: string) => void
  readOnly?: boolean
}

export function CompableWaveformRow({
  trackId,
  trackColor,
  activeTake,
  loadedDuration,
  maxDuration,
  comments,
  currentUserId,
  isRetake,
  isActive,
  compedSections = [],
  onWaveformReady,
  waveformRef,
  onClick,
  onSectionCreated,
  onSectionDeleted,
  readOnly = false,
}: CompableWaveformRowProps) {
  const [swipeStart, setSwipeStart] = useState<number | null>(null)
  const [swipeEnd, setSwipeEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [cursorY, setCursorY] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly || !isRetake || isActive || !onSectionCreated) return

    // Ignore clicks on buttons (delete section buttons)
    const target = e.target as HTMLElement
    if (target.closest('button')) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height

    // Zone supérieure = swipe (au-dessus 50% height)
    if (y < height / 2) {
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const time = percentage * maxDuration

      setSwipeStart(time)
      setSwipeEnd(time)
      setIsDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
      e.stopPropagation() // Prevent comment click
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    setCursorY(y)

    if (!isDragging || swipeStart === null) return

    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const currentTime = percentage * maxDuration

    setSwipeEnd(currentTime)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging && swipeStart !== null && swipeEnd !== null) {
      const start = Math.min(swipeStart, swipeEnd)
      const end = Math.max(swipeStart, swipeEnd)

      // Minimum 0.5s pour éviter clics accidentels
      if (end - start > 0.5 && onSectionCreated) {
        onSectionCreated(start, end)
      }
    }

    setIsDragging(false)
    setSwipeStart(null)
    setSwipeEnd(null)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // Determine cursor style based on Y position
  const height = containerRef.current?.getBoundingClientRect().height || 70
  // If cursor hasn't moved yet (cursorY === 0), assume we're in swipe zone for retakes
  const isInSwipeZone = cursorY === 0 ? true : cursorY < height / 2
  const cursorStyle = isRetake && !isActive && !readOnly && isInSwipeZone
    ? 'cursor-col-resize'
    : 'cursor-pointer'

  // Calculate gray color for inactive tracks (both original and retakes)
  const displayColor = !isActive ? '#71717a' : trackColor // zinc-600 when inactive

  // Show subtle hint when hovering over swipe zone (only on inactive retakes)
  const showSwipeHint = isRetake && !isActive && !readOnly && isInSwipeZone && cursorY > 0

  return (
    <div
      ref={containerRef}
      className={`relative ${cursorStyle} transition-all duration-200`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        setCursorY(0)
        if (isDragging) {
          handlePointerUp({
            currentTarget: containerRef.current,
            pointerId: 0,
          } as any)
        }
      }}
    >
      {/* Swipe zone indicator (subtle gradient on top half when hovering) */}
      {showSwipeHint && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none transition-opacity duration-200"
          style={{
            height: '50%',
            background: `linear-gradient(to bottom, ${trackColor}08, transparent)`,
          }}
        />
      )}
      {/* Base waveform */}
      <WaveformTrackRow
        trackId={trackId}
        trackColor={displayColor}
        activeTake={activeTake}
        loadedDuration={loadedDuration}
        maxDuration={maxDuration}
        comments={comments}
        currentUserId={currentUserId}
        onWaveformReady={onWaveformReady}
        waveformRef={waveformRef}
        onClick={onClick}
      />

      {/* Comped sections overlay (only if this is a retake with sections) */}
      {isRetake && compedSections && compedSections.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="relative h-full pointer-events-auto">
            <CompedSectionOverlay
              sections={compedSections}
              duration={maxDuration}
              trackColor={trackColor}
              onDelete={onSectionDeleted}
              readOnly={readOnly}
            />
          </div>
        </div>
      )}

      {/* Swipe preview overlay (while dragging) */}
      {isDragging && swipeStart !== null && swipeEnd !== null && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none border-2 border-dashed animate-pulse"
          style={{
            left: `${(Math.min(swipeStart, swipeEnd) / maxDuration) * 100}%`,
            width: `${
              (Math.abs(swipeEnd - swipeStart) / maxDuration) * 100
            }%`,
            backgroundColor: `${trackColor}30`,
            borderColor: trackColor,
            boxShadow: `0 0 10px ${trackColor}50, inset 0 0 20px ${trackColor}20`,
            transition: 'width 0.05s ease-out, left 0.05s ease-out',
          }}
        />
      )}

      {/* Grayed sections overlay for original track (corresponding to retake sections) */}
      {!isRetake && compedSections && compedSections.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {compedSections.map((section) => {
            const leftPercent = (section.start_time / maxDuration) * 100
            const widthPercent =
              ((section.end_time - section.start_time) / maxDuration) * 100

            return (
              <div
                key={section.id}
                className="absolute top-0 bottom-0 transition-all duration-300"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: 'rgba(63, 63, 70, 0.7)', // zinc-700/70
                  borderLeft: '1px solid rgba(63, 63, 70, 0.9)',
                  borderRight: '1px solid rgba(63, 63, 70, 0.9)',
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
