/**
 * dB Scale Component
 *
 * Displays logarithmic dB scale with graduation marks for fader visualization.
 * Uses precomputed DB_SCALE_MARKS for positioning.
 */

import { DB_SCALE_MARKS } from './utils'

export interface DbScaleProps {
  className?: string
}

export function DbScale({ className = '' }: DbScaleProps) {
  return (
    <div
      className={`relative w-5 h-full text-[10px] text-zinc-500 font-mono select-none ${className}`}
    >
      {/* Graduation marks */}
      {DB_SCALE_MARKS.map((mark) => (
        <div
          key={mark.db}
          className="absolute flex items-center justify-end gap-0.5 w-full"
          style={{
            top: `${mark.volumePercent}%`,
            transform: 'translateY(-50%)',
          }}
        >
          <span className={mark.size === 'small' ? 'text-[8px]' : ''}>
            {mark.db}
          </span>
          <div
            className={`h-px ${
              mark.size === 'large' ? 'w-1 bg-zinc-600' : 'w-0.5 bg-zinc-700'
            }`}
          />
        </div>
      ))}

      {/* Infinity mark at bottom */}
      <div
        className="absolute flex items-center justify-end gap-0.5 w-full"
        style={{ bottom: '4px' }}
      >
        <span>∞</span>
        <div className="w-1 h-px bg-zinc-600" />
      </div>
    </div>
  )
}
