/**
 * Track Rename Hook
 *
 * Handles inline renaming of mixer channel tracks with keyboard support.
 * Manages input state, focus/select logic, and blur prevention during setup.
 */

import { useState, useRef, useEffect, useCallback } from 'react'

export interface UseTrackRenameOptions {
  trackId: string
  trackName: string
  isRenaming: boolean
  onRename: (trackId: string, newName: string) => void
  onCancelRename: () => void
}

export interface UseTrackRenameReturn {
  editingName: string
  setEditingName: (name: string) => void
  inputRef: React.RefObject<HTMLInputElement>
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleBlur: () => void
}

export function useTrackRename({
  trackId,
  trackName,
  isRenaming,
  onRename,
  onCancelRename,
}: UseTrackRenameOptions): UseTrackRenameReturn {
  const [editingName, setEditingName] = useState(trackName)
  const inputRef = useRef<HTMLInputElement>(null)
  const allowBlur = useRef<boolean>(false)

  /**
   * When rename mode starts:
   * 1. Reset editing name to current track name
   * 2. Focus and select the input after a delay (for flex layout)
   * 3. Prevent blur until input is fully ready
   */
  useEffect(() => {
    if (isRenaming) {
      setEditingName(trackName)
      allowBlur.current = false

      // Focus and select with delay for new flex layout
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()

        // Allow blur after input is fully ready
        setTimeout(() => {
          allowBlur.current = true
        }, 100)
      }, 50)
    }
  }, [isRenaming, trackName])

  /**
   * Handle keyboard shortcuts:
   * - Enter: Confirm rename
   * - Escape: Cancel rename and revert to original name
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onRename(trackId, editingName)
      } else if (e.key === 'Escape') {
        setEditingName(trackName)
        onCancelRename()
      }
    },
    [trackId, trackName, editingName, onRename, onCancelRename]
  )

  /**
   * Handle input blur
   * Only process if blur is allowed (after input is ready)
   */
  const handleBlur = useCallback(() => {
    if (allowBlur.current) {
      onRename(trackId, editingName)
    }
  }, [trackId, editingName, onRename])

  return {
    editingName,
    setEditingName,
    inputRef,
    handleKeyDown,
    handleBlur,
  }
}
