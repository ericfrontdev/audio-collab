/**
 * Mixer Channel Sortable Hook
 *
 * Handles drag-and-drop sorting functionality for mixer channels.
 * Wraps @dnd-kit/sortable with computed styles and sortable props.
 */

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface SortableProps {
  attributes: ReturnType<typeof useSortable>['attributes']
  listeners: ReturnType<typeof useSortable>['listeners']
  setNodeRef: ReturnType<typeof useSortable>['setNodeRef']
}

export interface UseMixerChannelSortableReturn {
  sortableProps: SortableProps
  style: {
    transform: string | undefined
    transition: string | undefined
    opacity: number
  }
  isDragging: boolean
}

export function useMixerChannelSortable(
  trackId: string
): UseMixerChannelSortableReturn {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trackId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return {
    sortableProps: {
      attributes,
      listeners,
      setNodeRef,
    },
    style,
    isDragging,
  }
}
