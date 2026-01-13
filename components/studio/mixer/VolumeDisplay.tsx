/**
 * Volume Display Component
 *
 * Displays peak and volume levels in dB format.
 * Shows audio peak on left, fader volume on right.
 */

import { levelToDb, volumeToDb } from './utils'

export interface VolumeDisplayProps {
  audioPeak: number
  volume: number
}

export function VolumeDisplay({ audioPeak, volume }: VolumeDisplayProps) {
  return (
    <div className="h-5 px-2 flex items-center justify-between text-[10px] font-mono border-b border-zinc-900">
      <span className="text-zinc-500">{levelToDb(audioPeak)}</span>
      <span className="text-[#9363f7] font-semibold">{volumeToDb(volume)}</span>
    </div>
  )
}
