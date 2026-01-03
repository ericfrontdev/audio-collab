'use client'

import { useEffect, useRef, useState } from 'react'

interface VUMeterProps {
  trackId?: string
  level?: number // 0-100, optional - if provided, use this instead of internal state
  peak?: number // 0-100, optional - if provided, use this instead of internal state
  width?: number
  height?: number
  showScale?: boolean
  className?: string
}

export function VUMeter({
  trackId,
  level: levelProp,
  peak: peakProp,
  width = 10,
  height = 48,
  showScale = false,
  className = '',
}: VUMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Use props if provided, otherwise use 0
  const level = levelProp ?? 0
  const peak = peakProp ?? 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw meter background
    ctx.fillStyle = '#27272a' // zinc-800
    ctx.fillRect(0, 0, width, height)

    // Calculate level position (inverted, 0 = bottom)
    const levelHeight = (level / 100) * height

    // Draw level gradient (green -> yellow -> red)
    const gradient = ctx.createLinearGradient(0, height, 0, 0)
    gradient.addColorStop(0, '#22c55e') // green
    gradient.addColorStop(0.7, '#eab308') // yellow
    gradient.addColorStop(0.9, '#ef4444') // red

    ctx.fillStyle = gradient
    ctx.fillRect(0, height - levelHeight, width, levelHeight)

    // Draw peak indicator (thin line)
    if (peak > 0) {
      const peakY = height - (peak / 100) * height
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, peakY, width, 1)
    }
  }, [level, peak, width, height])

  return (
    <div
      className={`relative flex items-center ${className}`}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
      />
    </div>
  )
}
