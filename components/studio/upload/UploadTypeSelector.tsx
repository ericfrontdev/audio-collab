/**
 * Upload Type Selector
 *
 * Radio buttons for selecting upload type (new track or add take).
 */

export interface UploadTypeSelectorProps {
  uploadType: 'new-track' | 'add-take'
  onChange: (type: 'new-track' | 'add-take') => void
  disabled?: boolean
  existingTracksCount: number
  labels: {
    uploadType: string
    newTrack: string
    newTrackDesc: string
    addTake: string
    addTakeDesc: string
    createFirstTrack: string
  }
}

export function UploadTypeSelector({
  uploadType,
  onChange,
  disabled = false,
  existingTracksCount,
  labels,
}: UploadTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-3">
        {labels.uploadType}
      </label>
      <div className="flex gap-4">
        {/* New Track Option */}
        <label className="flex-1">
          <input
            type="radio"
            name="uploadType"
            value="new-track"
            checked={uploadType === 'new-track'}
            onChange={(e) => onChange(e.target.value as 'new-track')}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-zinc-700 cursor-pointer peer-checked:border-primary peer-checked:bg-primary/10 hover:border-zinc-600 transition-all">
            <div className="text-sm font-medium text-white">{labels.newTrack}</div>
            <div className="text-xs text-gray-400 mt-1">{labels.newTrackDesc}</div>
          </div>
        </label>

        {/* Add Take Option */}
        <label className="flex-1">
          <input
            type="radio"
            name="uploadType"
            value="add-take"
            checked={uploadType === 'add-take'}
            onChange={(e) => onChange(e.target.value as 'add-take')}
            disabled={disabled || existingTracksCount === 0}
            className="sr-only peer"
          />
          <div className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-zinc-700 cursor-pointer peer-checked:border-primary peer-checked:bg-primary/10 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed hover:border-zinc-600 transition-all">
            <div className="text-sm font-medium text-white">{labels.addTake}</div>
            <div className="text-xs text-gray-400 mt-1">{labels.addTakeDesc}</div>
          </div>
        </label>
      </div>

      {/* Helper text when no tracks exist */}
      {existingTracksCount === 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {labels.createFirstTrack}
        </p>
      )}
    </div>
  )
}
