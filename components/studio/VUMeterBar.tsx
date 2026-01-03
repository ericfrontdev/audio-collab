'use client'

import { useEffect, useRef } from 'react'

interface VUMeterBarProps {
  level: number // 0-100
  peak: number // 0-100
  width?: number
  className?: string
}

export function VUMeterBar({ level, peak, width = 12, className = '' }: VUMeterBarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const height = canvas.height
    const w = canvas.width

    // Clear canvas
    ctx.clearRect(0, 0, w, height)

    // Background
    ctx.fillStyle = '#18181b' // zinc-900
    ctx.fillRect(0, 0, w, height)

    // Calculate bar height (inverted - 0 is at bottom)
    const barHeight = (level / 100) * height
    const peakY = height - (peak / 100) * height

    // Draw level bars with gradient colors
    const gradient = ctx.createLinearGradient(0, height, 0, 0)

    // Green zone (0-70%)
    gradient.addColorStop(0, '#22c55e') // green-500
    gradient.addColorStop(0.7, '#22c55e')

    // Yellow zone (70-85%)
    gradient.addColorStop(0.7, '#eab308') // yellow-500
    gradient.addColorStop(0.85, '#eab308')

    // Red zone (85-100%)
    gradient.addColorStop(0.85, '#ef4444') // red-500
    gradient.addColorStop(1, '#ef4444')

    ctx.fillStyle = gradient
    ctx.fillRect(0, height - barHeight, w, barHeight)

    // Draw peak indicator line
    if (peak > 0) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, peakY - 1, w, 2)
    }

    // Draw scale lines
    ctx.strokeStyle = '#27272a' // zinc-800
    ctx.lineWidth = 1

    // Logarithmic scale positions matching the ruler
    const scalePositions = [
      { pos: 0.05, label: '0' },
      { pos: 0.15, label: '6' },
      { pos: 0.25, label: '12' },
      { pos: 0.35, label: '18' },
      { pos: 0.45, label: '24' },
      { pos: 0.55, label: '30' },
      { pos: 0.65, label: '36' },
      { pos: 0.73, label: '42' },
      { pos: 0.81, label: '48' },
      { pos: 0.89, label: '60' },
    ]

    scalePositions.forEach(({ pos }) => {
      const y = pos * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    })
  }, [level, peak, width])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={300}
      className={className}
      style={{ width: `${width}px`, height: '100%' }}
    />
  )
}
