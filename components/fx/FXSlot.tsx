'use client'

import { useState } from 'react'
import { Power, Settings, RefreshCw, X } from 'lucide-react'
import type { FXType } from './FXDropdown'

interface FXSlotProps {
  type: FXType
  bypassed: boolean
  onBypass: () => void
  onSettings: () => void
  onSwap: () => void
  onRemove?: () => void // Optional for backward compatibility
}

export function FXSlot({ type, bypassed, onBypass, onSettings, onSwap, onRemove }: FXSlotProps) {
  const [isHovered, setIsHovered] = useState(false)

  const typeLabels: Record<Exclude<FXType, 'none'>, string> = {
    eq: 'EQ',
    compressor: 'Comp',
    reverb: 'Reverb'
  }

  const typeColors: Record<Exclude<FXType, 'none'>, string> = {
    eq: 'bg-cyan-500',
    compressor: 'bg-orange-500',
    reverb: 'bg-purple-500'
  }

  if (type === 'none') return null

  const bgColor = bypassed ? 'bg-gray-600' : typeColors[type]
  const label = typeLabels[type]

  return (
    <div
      className={`
        relative w-full h-8 rounded ${bgColor}
        flex items-center justify-center
        transition-all duration-150 cursor-pointer
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isHovered ? (
        // Show label when not hovered
        <span className="text-xs font-medium text-white">{label}</span>
      ) : (
        // Show buttons when hovered (3 or 4 depending on onRemove)
        <div className="flex items-center gap-0.5 w-full h-full">
          {/* Bypass button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onBypass()
            }}
            className="flex-1 h-full flex items-center justify-center hover:bg-black/20 transition-colors"
            title="Bypass"
          >
            <Power className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Settings button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSettings()
            }}
            className="flex-1 h-full flex items-center justify-center hover:bg-black/20 transition-colors border-x border-black/20"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Swap button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSwap()
            }}
            className={`flex-1 h-full flex items-center justify-center hover:bg-black/20 transition-colors ${onRemove ? 'border-r border-black/20' : ''}`}
            title="Change Effect"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Delete button (only shown if onRemove is provided) */}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="flex-1 h-full flex items-center justify-center hover:bg-red-600/50 transition-colors"
              title="Remove Effect"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
