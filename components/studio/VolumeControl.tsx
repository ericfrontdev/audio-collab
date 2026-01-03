'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface VolumeControlProps {
  value: number // 0-100
  onChange: (value: number) => void
  color?: string
  className?: string
}

export function VolumeControl({
  value,
  onChange,
  color = '#9363f7', // Not used anymore - always use purple
  className = '',
}: VolumeControlProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragStartValue = useRef(0)

  // Always use purple, not track color
  const purpleVivid = '#9363f7'
  const purpleMuted = '#6b46c1'
  const purplePale = '#9363f733' // 20% opacity

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return

      setIsDragging(true)
      dragStartX.current = e.clientX
      dragStartValue.current = value

      // Also update immediately on click
      const rect = containerRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = (clickX / rect.width) * 100
      const newValue = Math.max(0, Math.min(100, percentage))
      onChange(Math.round(newValue))

      e.preventDefault()
    },
    [value, onChange]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const deltaX = e.clientX - dragStartX.current
      const deltaPercentage = (deltaX / rect.width) * 100
      const newValue = Math.max(0, Math.min(100, dragStartValue.current + deltaPercentage))

      onChange(Math.round(newValue))
    },
    [isDragging, onChange]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

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

  return (
    <div
      ref={containerRef}
      className={`relative h-5 bg-black border border-black rounded-[2px] cursor-ew-resize ${className}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Fill below fader (purple pale) */}
      <div
        className="absolute top-0 bottom-0 left-0 rounded-[1px] transition-all"
        style={{
          width: `${value}%`,
          backgroundColor: purplePale,
        }}
      />

      {/* Fader line (vertical, stays purple) */}
      <div
        className="absolute top-0 bottom-0 transition-all"
        style={{
          left: `${value}%`,
          transform: 'translateX(-50%)',
          width: isHovering || isDragging ? '4px' : '2px',
          backgroundColor: isHovering || isDragging ? purpleVivid : purpleMuted,
          boxShadow:
            isHovering || isDragging ? `0 0 8px ${purpleVivid}80` : 'none',
        }}
      />
    </div>
  )
}
