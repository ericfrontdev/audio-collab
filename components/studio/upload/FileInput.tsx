/**
 * File Input
 *
 * File upload input with clear button and file info display.
 */

import { Upload, X } from 'lucide-react'
import { AUDIO_CONSTRAINTS } from '@/lib/types/studio'

export interface FileInputProps {
  selectedFile: File | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  disabled?: boolean
  labels: {
    audioFile: string
    required: string
    chooseFile: string
    supportedFormats: string
    fileSize: string
  }
  maxSizeMB: number
}

export function FileInput({
  selectedFile,
  onChange,
  onClear,
  disabled = false,
  labels,
  maxSizeMB,
}: FileInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        {labels.audioFile} <span className="text-red-500">{labels.required}</span>
      </label>
      <div className="flex items-center gap-3">
        {/* File input label */}
        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-zinc-700 hover:border-primary/50 cursor-pointer transition-colors">
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">
            {selectedFile ? selectedFile.name : labels.chooseFile}
          </span>
          <input
            type="file"
            accept={AUDIO_CONSTRAINTS.SUPPORTED_FORMATS.join(',')}
            onChange={onChange}
            disabled={disabled}
            className="hidden"
          />
        </label>

        {/* Clear button */}
        {selectedFile && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            aria-label="Clear file"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Helper text */}
      <p className="mt-2 text-xs text-gray-500">
        {labels.supportedFormats.replace('{maxSize}', maxSizeMB.toString())}
      </p>

      {/* File size display */}
      {selectedFile && (
        <div className="mt-2 text-xs text-gray-400">
          {labels.fileSize} {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
        </div>
      )}
    </div>
  )
}
