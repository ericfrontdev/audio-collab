/**
 * Pan Drag Hook
 *
 * Handles horizontal pan dragging for stereo positioning in mixer channels.
 * Manages drag state, mouse events, and pan calculations (-100 to +100).
 */

import { useState, useRef, useCallback, useEffect } from 'react'

export interface UsePanDragOptions {
  pan: number
  trackId: string
  onPanChange: (trackId: string, pan: number) => void
}

export interface UsePanDragReturn {
  panRef: React.RefObject<HTMLDivElement>
  isHovering: boolean
  isDragging: boolean
  setIsHovering: (hovering: boolean) => void
  handleMouseDown: (e: React.MouseEvent) => void
}

export function usePanDrag({
  pan,
  trackId,
  onPanChange,
}: UsePanDragOptions): UsePanDragReturn {
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const panRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragStartValue = useRef(0)

  /**
   * Handle initial mouse down on pan control
   * Sets drag state and immediately updates pan based on click position
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!panRef.current) return

      setIsDragging(true)
      dragStartX.current = e.clientX
      dragStartValue.current = pan

      // Calculate pan based on click position (-100 to +100)
      const rect = panRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = (clickX / rect.width) * 200 - 100
      const newPan = Math.max(-100, Math.min(100, percentage))
      onPanChange(trackId, Math.round(newPan))

      e.preventDefault()
    },
    [pan, trackId, onPanChange]
  )

  /**
   * Handle mouse move during drag
   * Calculates delta and updates pan continuously
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !panRef.current) return

      const rect = panRef.current.getBoundingClientRect()
      const deltaX = e.clientX - dragStartX.current
      const deltaPercentage = (deltaX / rect.width) * 200
      const newPan = Math.max(
        -100,
        Math.min(100, dragStartValue.current + deltaPercentage)
      )

      onPanChange(trackId, Math.round(newPan))
    },
    [isDragging, trackId, onPanChange]
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
    panRef,
    isHovering,
    isDragging,
    setIsHovering,
    handleMouseDown,
  }
}
