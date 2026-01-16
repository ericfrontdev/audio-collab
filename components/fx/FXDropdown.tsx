'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export type FXType = 'eq' | 'compressor' | 'reverb' | 'none'

interface FXDropdownProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: FXType) => void
  position?: { x: number; y: number }
}

export function FXDropdown({ isOpen, onClose, onSelect, position }: FXDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelect = (type: FXType) => {
    onSelect(type)
    onClose()
  }

  const dropdown = (
    <div
      ref={dropdownRef}
      className="fixed z-50 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
      style={position ? { left: position.x, top: position.y } : {}}
    >
      {/* No Effect */}
      <button
        onClick={() => handleSelect('none')}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
      >
        No Effect
      </button>

      {/* Separator */}
      <div className="h-px bg-gray-600 my-1" />

      {/* Effects */}
      <button
        onClick={() => handleSelect('eq')}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
      >
        <span className="text-cyan-400">●</span> EQ
      </button>
      <button
        onClick={() => handleSelect('compressor')}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
      >
        <span className="text-orange-400">●</span> Compressor
      </button>
      <button
        onClick={() => handleSelect('reverb')}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
      >
        <span className="text-purple-400">●</span> Reverb
      </button>
    </div>
  )

  return createPortal(dropdown, document.body)
}
