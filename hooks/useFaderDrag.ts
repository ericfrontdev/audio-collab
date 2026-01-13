/**
 * Fader Drag Hook
 *
 * Handles vertical fader dragging for volume control in mixer channels.
 * Manages drag state, mouse events, and volume calculations.
 */

import { useState, useRef, useCallback, useEffect } from 'react'

export interface UseFaderDragOptions {
  volume: number
  trackId: string
  onVolumeChange: (trackId: string, volume: number) => void
}

export interface UseFaderDragReturn {
  faderRef: React.RefObject<HTMLDivElement>
  isHovering: boolean
  isDragging: boolean
  setIsHovering: (hovering: boolean) => void
  handleMouseDown: (e: React.MouseEvent) => void
}

export function useFaderDrag({
  volume,
  trackId,
  onVolumeChange,
}: UseFaderDragOptions): UseFaderDragReturn {
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const faderRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragStartValue = useRef(0)

  /**
   * Handle initial mouse down on fader
   * Sets drag state and immediately updates volume based on click position
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!faderRef.current) return

      setIsDragging(true)
      dragStartY.current = e.clientY
      dragStartValue.current = volume

      // Calculate volume based on click position
      const rect = faderRef.current.getBoundingClientRect()
      const clickY = e.clientY - rect.top
      const percentage = 100 - (clickY / rect.height) * 100
      const newVolume = Math.max(0, Math.min(100, percentage))
      onVolumeChange(trackId, Math.round(newVolume))

      e.preventDefault()
    },
    [volume, trackId, onVolumeChange]
  )

  /**
   * Handle mouse move during drag
   * Calculates delta and updates volume continuously
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !faderRef.current) return

      const rect = faderRef.current.getBoundingClientRect()
      const deltaY = dragStartY.current - e.clientY
      const deltaPercentage = (deltaY / rect.height) * 100
      const newVolume = Math.max(
        0,
        Math.min(100, dragStartValue.current + deltaPercentage)
      )

      onVolumeChange(trackId, Math.round(newVolume))
    },
    [isDragging, trackId, onVolumeChange]
  )

  /**
   * Handle mouse up to end drag
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  /**
   * Attach global mouse event listeners during drag
   * Cleans up listeners when drag ends
   */
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return {
    faderRef,
    isHovering,
    isDragging,
    setIsHovering,
    handleMouseDown,
  }
}
