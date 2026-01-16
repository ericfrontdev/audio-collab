'use client'

import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { FXSlot } from './FXSlot'
import { FXDropdown, type FXType } from './FXDropdown'

interface FXZoneProps {
  currentEffect: FXType
  bypassed: boolean
  onEffectChange: (type: FXType) => void
  onBypassToggle: () => void
  onOpenSettings: () => void
}

export function FXZone({
  currentEffect,
  bypassed,
  onEffectChange,
  onBypassToggle,
  onOpenSettings
}: FXZoneProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })
  const zoneRef = useRef<HTMLDivElement>(null)

  const handleZoneClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentEffect === 'none') {
      const rect = zoneRef.current?.getBoundingClientRect()
      if (rect) {
        setDropdownPosition({
          x: rect.left,
          y: rect.bottom + 4
        })
        setIsDropdownOpen(true)
      }
    }
  }

  const handleSwap = () => {
    const rect = zoneRef.current?.getBoundingClientRect()
    if (rect) {
      setDropdownPosition({
        x: rect.left,
        y: rect.bottom + 4
      })
      setIsDropdownOpen(true)
    }
  }

  return (
    <div ref={zoneRef} className="relative w-full">
      {currentEffect === 'none' ? (
        // Empty state - click to add effect
        <button
          onClick={handleZoneClick}
          className="
            w-full h-8 rounded border border-dashed border-gray-600
            flex items-center justify-center
            hover:border-gray-500 hover:bg-gray-800/50
            transition-all duration-150
            group
          "
        >
          <Plus className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
        </button>
      ) : (
        // Effect loaded
        <FXSlot
          type={currentEffect}
          bypassed={bypassed}
          onBypass={onBypassToggle}
          onSettings={onOpenSettings}
          onSwap={handleSwap}
        />
      )}

      <FXDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        onSelect={onEffectChange}
        position={dropdownPosition}
      />
    </div>
  )
}
