/**
 * Fader Section Component
 *
 * Complete fader section with dB scale, VU meter, and volume fader.
 * Displays audio levels and allows vertical drag to adjust volume.
 */

import { VUMeterBar } from '../VUMeterBar'
import { DbScale } from './DbScale'

export interface FaderSectionProps {
  volume: number
  audioLevel: number
  audioPeak: number
  faderRef: React.RefObject<HTMLDivElement | null>
  isHovering: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function FaderSection({
  volume,
  audioLevel,
  audioPeak,
  faderRef,
  isHovering,
  isDragging,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: FaderSectionProps) {
  // Fader position (0 = bottom, 100 = top)
  const faderPosition = volume

  return (
    <div className="flex-1 flex px-2 pb-1 pt-1">
      {/* Left section: Graduations + VU Meter */}
      <div className="flex">
        {/* dB Scale with tick marks */}
        <DbScale />

        {/* VU Meter */}
        <VUMeterBar
          level={audioLevel}
          peak={audioPeak}
          width={12}
          className="rounded-[2px]"
        />
      </div>

      {/* Right section: Fader */}
      <div className="flex-1 flex flex-col ml-1">
        <div
          ref={faderRef}
          className="relative flex-1 bg-black border border-black rounded-[2px] cursor-ns-resize overflow-hidden"
          onMouseDown={onMouseDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* Fill below fader */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#9363f733] rounded-[1px]"
            style={{
              height: `${faderPosition}%`,
            }}
          />

          {/* Fader line (horizontal) */}
          <div
            className={`
              absolute left-0 right-0
              ${
                isHovering || isDragging
                  ? 'bg-[#9363f7] h-1 shadow-lg shadow-[#9363f7]/50'
                  : 'bg-[#6b46c1] h-0.5'
              }
            `}
            style={{
              bottom: `${faderPosition}%`,
              transform: 'translateY(50%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
