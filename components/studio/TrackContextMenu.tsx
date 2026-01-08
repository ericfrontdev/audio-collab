'use client'

import { useState, useEffect, useRef } from 'react'
import { Edit3, Copy, Trash2 } from 'lucide-react'
import { ColorPicker } from '@/components/ui/ColorPicker'

interface TrackContextMenuProps {
  trackId: string
  trackName: string
  trackColor: string
  position: { x: number; y: number }
  onClose: () => void
  onRename: (trackId: string) => void
  onColorChange: (trackId: string, color: string) => void
  onDuplicate: (trackId: string) => void
  onDelete: (trackId: string) => void
}

export function TrackContextMenu({
  trackId,
  trackName,
  trackColor,
  position,
  onClose,
  onRename,
  onColorChange,
  onDuplicate,
  onDelete,
}: TrackContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [showColorPicker, setShowColorPicker] = useState(true)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const menuEl = menuRef.current

      if (rect.right > window.innerWidth) {
        menuEl.style.left = `${window.innerWidth - rect.width - 10}px`
      }
      if (rect.bottom > window.innerHeight) {
        menuEl.style.top = `${window.innerHeight - rect.height - 10}px`
      }
    }
  }, [])

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        minWidth: '200px',
      }}
    >
      {/* Color Picker */}
      {showColorPicker && (
        <div className="border-b border-zinc-800">
          <ColorPicker
            selectedColor={trackColor}
            onSelect={(color) => {
              onColorChange(trackId, color)
              // Keep color picker open for quick color changes
            }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="py-1">
        <button
          onClick={() => {
            onRename(trackId)
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 flex items-center gap-3"
        >
          <Edit3 className="w-4 h-4" />
          <span>Rename</span>
          <span className="ml-auto text-xs text-zinc-500">⌘R</span>
        </button>

        <button
          onClick={() => {
            onDuplicate(trackId)
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 flex items-center gap-3"
        >
          <Copy className="w-4 h-4" />
          <span>Duplicate</span>
          <span className="ml-auto text-xs text-zinc-500">⌘D</span>
        </button>

        <button
          onClick={() => {
            onDelete(trackId)
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-zinc-800 flex items-center gap-3"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
          <span className="ml-auto text-xs text-zinc-500">⌘⌫</span>
        </button>
      </div>
    </div>
  )
}
