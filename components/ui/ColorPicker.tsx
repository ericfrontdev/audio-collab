'use client'

const COLORS = [
  // Row 1
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
  // Row 2
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  // Row 3
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#fb7185', '#fda4af',
  // Row 4
  '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a', '#059669',
  // Row 5
  '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
  // Row 6
  '#9333ea', '#c026d3', '#db2777', '#be123c', '#e11d48', '#f87171',
]

interface ColorPickerProps {
  selectedColor?: string
  onSelect: (color: string) => void
  onClose?: () => void
}

export function ColorPicker({ selectedColor, onSelect, onClose }: ColorPickerProps) {
  return (
    <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800 shadow-xl">
      <div className="grid grid-cols-6 gap-1 mb-2">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => {
              onSelect(color)
              onClose?.()
            }}
            className={`
              w-7 h-7 rounded-[2px] transition-all
              hover:scale-110 hover:shadow-lg
              ${selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''}
            `}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-1"
        >
          Close
        </button>
      )}
    </div>
  )
}
