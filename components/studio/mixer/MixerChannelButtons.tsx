/**
 * Mixer Channel Buttons Component
 *
 * Displays Import/Solo/Mute buttons in a compact row.
 * Buttons are visually connected with rounded corners on edges only.
 */

import { Upload } from 'lucide-react'

export interface MixerChannelButtonsProps {
  isMuted: boolean
  isSoloed: boolean
  onImport: () => void
  onSoloToggle: () => void
  onMuteToggle: () => void
  onStopPropagation: (e: React.MouseEvent) => void
}

export function MixerChannelButtons({
  isMuted,
  isSoloed,
  onImport,
  onSoloToggle,
  onMuteToggle,
  onStopPropagation,
}: MixerChannelButtonsProps) {
  return (
    <div className="h-7 px-2 flex items-center justify-center border-b border-zinc-900">
      {/* Import button (left rounded corners) */}
      <button
        onClick={(e) => {
          onStopPropagation(e)
          onImport()
        }}
        className="flex-1 h-5 flex items-center justify-center bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors rounded-l-[2px] outline outline-1 outline-black"
        title="Import audio"
      >
        <Upload className="w-3 h-3" />
      </button>

      {/* Solo button (no rounded corners) */}
      <button
        onClick={(e) => {
          onStopPropagation(e)
          onSoloToggle()
        }}
        className={`
          flex-1 h-5 flex items-center justify-center text-[10px] font-bold transition-all outline outline-1 outline-black
          ${
            isSoloed
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
          }
        `}
      >
        S
      </button>

      {/* Mute button (right rounded corners) */}
      <button
        onClick={(e) => {
          onStopPropagation(e)
          onMuteToggle()
        }}
        className={`
          flex-1 h-5 flex items-center justify-center text-[10px] font-bold transition-all rounded-r-[2px] outline outline-1 outline-black
          ${
            isMuted
              ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/50'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
          }
        `}
      >
        M
      </button>
    </div>
  )
}
