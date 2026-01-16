'use client'

import { useEffect, useRef, useState } from 'react'

interface FXKnobProps {
  label: string
  value: number // 0-1
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}

export function FXKnob({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  unit = ''
}: FXKnobProps) {
  const [isDragging, setIsDragging] = useState(false)
  const knobRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const startValueRef = useRef(0)

  // Convert 0-1 value to degrees (-135 to 135)
  const rotation = -135 + (value * 270)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startYRef.current = e.clientY
    startValueRef.current = value
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY
      const sensitivity = 0.005
      let newValue = startValueRef.current + (deltaY * sensitivity)

      // Clamp between 0-1
      newValue = Math.max(0, Math.min(1, newValue))

      onChange(newValue)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onChange])

  // Format display value
  const displayValue = () => {
    const actualValue = min + (value * (max - min))
    return `${actualValue.toFixed(1)}${unit}`
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Knob */}
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        className="relative w-16 h-16 cursor-pointer select-none"
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-gray-600 bg-gray-800">
          {/* Track background */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#374151"
              strokeWidth="3"
              strokeDasharray="175"
              strokeDashoffset="0"
              strokeLinecap="round"
            />
          </svg>

          {/* Value indicator */}
          <div
            className="absolute inset-[6px] rounded-full bg-gray-900 border border-gray-700"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.1s'
            }}
          >
            {/* Pointer */}
            <div className="absolute top-1 left-1/2 w-0.5 h-3 bg-purple-500 -ml-[1px] rounded-full" />
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-xs text-gray-300 font-mono mt-0.5">{displayValue()}</div>
      </div>
    </div>
  )
}
