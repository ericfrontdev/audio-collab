/**
 * Upload Modal Header
 *
 * Header section for the upload track modal with title and close button.
 */

import { X } from 'lucide-react'

export interface UploadModalHeaderProps {
  title: string
  targetTrackName?: string | null
  forTrackLabel?: string
  onClose: () => void
  disabled?: boolean
}

export function UploadModalHeader({
  title,
  targetTrackName,
  forTrackLabel,
  onClose,
  disabled = false,
}: UploadModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {targetTrackName && forTrackLabel && (
          <p className="text-sm text-zinc-400 mt-1">
            {forTrackLabel} <span className="text-white font-medium">{targetTrackName}</span>
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        disabled={disabled}
        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
