/**
 * Track Selector
 *
 * Dropdown for selecting an existing track when adding a take.
 */

export interface Track {
  id: string
  name: string
}

export interface TrackSelectorProps {
  value: string
  onChange: (trackId: string) => void
  tracks: Track[]
  disabled?: boolean
  labels: {
    selectTrack: string
    required: string
    chooseTrack: string
  }
}

export function TrackSelector({
  value,
  onChange,
  tracks,
  disabled = false,
  labels,
}: TrackSelectorProps) {
  return (
    <div>
      <label htmlFor="trackSelect" className="block text-sm font-medium text-white mb-2">
        {labels.selectTrack} <span className="text-red-500">{labels.required}</span>
      </label>
      <select
        id="trackSelect"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
      >
        <option value="">{labels.chooseTrack}</option>
        {tracks.map((track) => (
          <option key={track.id} value={track.id}>
            {track.name}
          </option>
        ))}
      </select>
    </div>
  )
}
