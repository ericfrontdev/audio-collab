import { useState, useRef, useCallback, useEffect, MutableRefObject } from 'react'
import type { CanvasWaveformRef } from '../CanvasWaveform'

interface UseStudioTimelineProps {
  maxDuration: number
  waveformRefs: MutableRefObject<Map<string, CanvasWaveformRef>>
  onSeek: (time: number) => void
}

export function useStudioTimeline({
  maxDuration,
  waveformRefs,
  onSeek,
}: UseStudioTimelineProps) {
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  const handleTimelineSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const percentage = x / rect.width
      const newTime = percentage * maxDuration

      // Call handleSeek which updates Transport.seconds and syncs waveforms
      onSeek(newTime)
    },
    [maxDuration, onSeek]
  )

  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDraggingPlayhead(true)
      handleTimelineSeek(e)
    },
    [handleTimelineSeek]
  )

  const handleTimelineTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!timelineRef.current || e.touches.length === 0) return
      setIsDraggingPlayhead(true)

      const rect = timelineRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width))
      const percentage = x / rect.width
      const newTime = percentage * maxDuration

      // Call handleSeek which updates Transport.seconds and syncs waveforms
      onSeek(newTime)
    },
    [maxDuration, onSeek]
  )

  // Handle dragging
  useEffect(() => {
    if (!isDraggingPlayhead) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const percentage = x / rect.width
      const newTime = percentage * maxDuration

      // Call handleSeek which updates Transport.seconds and syncs waveforms
      onSeek(newTime)
    }

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingPlayhead, maxDuration, onSeek])

  return {
    isDraggingPlayhead,
    timelineRef,
    handleTimelineMouseDown,
    handleTimelineTouchStart,
  }
}
