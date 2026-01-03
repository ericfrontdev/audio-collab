'use client'

import { forwardRef } from 'react'

interface TimelineRulerProps {
  maxDuration: number
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void
}

export const TimelineRuler = forwardRef<HTMLDivElement, TimelineRulerProps>(
  ({ maxDuration, isDragging, onMouseDown, onTouchStart }, ref) => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getTimelineData = (duration: number) => {
      if (duration === 0) return { markers: [], ticks: [] }

      // Determine interval for major markers
      let majorInterval: number
      if (duration <= 60) {
        majorInterval = 10 // Every 10 seconds
      } else if (duration <= 180) {
        majorInterval = 30 // Every 30 seconds
      } else if (duration <= 600) {
        majorInterval = 60 // Every minute
      } else {
        majorInterval = 120 // Every 2 minutes
      }

      const markers: Array<{ time: number; label: string; position: number }> = []
      const ticks: Array<{ time: number; position: number; major: boolean }> = []

      // Generate major markers
      for (let time = 0; time <= duration; time += majorInterval) {
        const position = (time / duration) * 100
        markers.push({ time, label: formatTime(time), position })
      }

      // Generate tick marks every second
      for (let time = 0; time <= duration; time += 1) {
        const position = (time / duration) * 100
        const major = time % 10 === 0
        ticks.push({ time, position, major })
      }

      return { markers, ticks }
    }

    const { markers, ticks } = getTimelineData(maxDuration)

    return (
      <div
        ref={ref}
        className="h-10 md:h-12 border-b border-zinc-800 bg-zinc-900/30 flex-shrink-0 relative cursor-pointer select-none touch-none"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      >
        <div className="h-full relative">
          {/* Tick marks */}
          {ticks.map((tick, i) => (
            <div
              key={i}
              className="absolute top-0 w-px"
              style={{
                left: `${tick.position}%`,
                height: tick.major ? '20px' : '10px',
                backgroundColor: tick.major ? '#71717a' : '#52525b',
              }}
            />
          ))}

          {/* Time markers */}
          {markers.map((marker, i) => (
            <span
              key={i}
              className="absolute top-6 text-sm text-white -translate-x-1/2"
              style={{ left: `${marker.position}%` }}
            >
              {marker.label}
            </span>
          ))}
        </div>
      </div>
    )
  }
)

TimelineRuler.displayName = 'TimelineRuler'
