/**
 * Mixer Channel Header Component
 *
 * Displays track name with inline rename support, drag handle, and delete button.
 */

import { Trash2, GripVertical } from 'lucide-react'
import type { SortableProps } from '@/hooks/useMixerChannelSortable'

export interface MixerChannelHeaderProps {
  trackName: string
  isRenaming: boolean
  editingName: string
  inputRef: React.RefObject<HTMLInputElement | null>
  sortableProps: SortableProps
  onEditingNameChange: (name: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onBlur: () => void
  onDelete: () => void
  onStopPropagation: (e: React.MouseEvent) => void
}

export function MixerChannelHeader({
  trackName,
  isRenaming,
  editingName,
  inputRef,
  sortableProps,
  onEditingNameChange,
  onKeyDown,
  onBlur,
  onDelete,
  onStopPropagation,
}: MixerChannelHeaderProps) {
  return (
    <div className="relative h-16 px-2 flex flex-col items-center justify-center gap-1 border-b border-zinc-900 group">
      {/* Grip handle - horizontal centered */}
      <button
        {...sortableProps.attributes}
        {...sortableProps.listeners}
        className="flex items-center justify-center h-5 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-white transition-colors"
        onClick={onStopPropagation}
        title="Drag to reorder"
      >
        <GripVertical className="w-7 h-5 rotate-90" />
      </button>

      {/* Track name display/input */}
      <div className="w-full px-1 flex items-center justify-center">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            className="w-full text-xs text-white font-medium bg-zinc-800 border border-primary rounded px-1 py-0.5 outline-none text-center"
            onClick={onStopPropagation}
          />
        ) : (
          <span className="text-xs text-white font-medium truncate block">
            {trackName}
          </span>
        )}
      </div>

      {/* Delete button - appears on hover */}
      {!isRenaming && (
        <button
          onClick={(e) => {
            onStopPropagation(e)
            onDelete()
          }}
          className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
