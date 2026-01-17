'use client'

import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { FXSlot } from './FXSlot'
import { FXDropdown, type FXType } from './FXDropdown'
import type { FXSlot as FXSlotType } from '@/lib/stores/useMixerStore'

interface FXChainZoneProps {
  fxChain: FXSlotType[]
  onAddSlot: (type: FXType) => string // Returns the created slot ID
  onRemoveSlot: (slotId: string) => void
  onToggleBypass: (slotId: string) => void
  onOpenSettings: (slotId: string) => void
  onChangeType: (slotId: string, type: FXType) => void
}

export function FXChainZone({
  fxChain,
  onAddSlot,
  onRemoveSlot,
  onToggleBypass,
  onOpenSettings,
  onChangeType
}: FXChainZoneProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })
  const [currentSlotId, setCurrentSlotId] = useState<string | null>(null)
  const zoneRef = useRef<HTMLDivElement>(null)

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = zoneRef.current?.getBoundingClientRect()
    if (rect) {
      setDropdownPosition({
        x: rect.left,
        y: rect.bottom + 4
      })
      setCurrentSlotId(null) // Adding new slot
      setIsDropdownOpen(true)
    }
  }

  const handleSwap = (slotId: string) => {
    const rect = zoneRef.current?.getBoundingClientRect()
    if (rect) {
      setDropdownPosition({
        x: rect.left,
        y: rect.bottom + 4
      })
      setCurrentSlotId(slotId) // Swapping existing slot
      setIsDropdownOpen(true)
    }
  }

  const handleDropdownSelect = (type: FXType) => {
    if (type === 'none') {
      // "No Effect" in multi-effect chain means remove the slot
      if (currentSlotId) {
        onRemoveSlot(currentSlotId)
      }
      setIsDropdownOpen(false)
      return
    }

    if (currentSlotId) {
      // Swapping existing slot type
      onChangeType(currentSlotId, type)
      onOpenSettings(currentSlotId) // Open settings after changing type
    } else {
      // Adding new slot
      const newSlotId = onAddSlot(type)
      onOpenSettings(newSlotId) // Open settings for newly created slot
    }
    setIsDropdownOpen(false)
  }

  return (
    <div ref={zoneRef} className="relative w-full flex flex-col gap-1">
      {/* Render existing FX slots */}
      {fxChain
        .sort((a, b) => a.order - b.order)
        .map((slot) => (
          <FXSlot
            key={slot.id}
            type={slot.type}
            bypassed={slot.bypassed}
            onBypass={() => onToggleBypass(slot.id)}
            onSettings={() => onOpenSettings(slot.id)}
            onSwap={() => handleSwap(slot.id)}
          />
        ))}

      {/* Show "Add Effect" button if less than 3 slots */}
      {fxChain.length < 3 && (
        <button
          onClick={handleAddClick}
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
      )}

      <FXDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        onSelect={handleDropdownSelect}
        position={dropdownPosition}
      />
    </div>
  )
}
