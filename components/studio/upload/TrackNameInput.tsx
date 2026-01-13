/**
 * Track Name Input
 *
 * Input field for entering a new track name.
 */

export interface TrackNameInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  labels: {
    trackName: string
    required: string
    placeholder: string
  }
  maxLength?: number
}

export function TrackNameInput({
  value,
  onChange,
  disabled = false,
  labels,
  maxLength = 100,
}: TrackNameInputProps) {
  return (
    <div>
      <label htmlFor="trackName" className="block text-sm font-medium text-white mb-2">
        {labels.trackName} <span className="text-red-500">{labels.required}</span>
      </label>
      <input
        type="text"
        id="trackName"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={labels.placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
        maxLength={maxLength}
      />
    </div>
  )
}
