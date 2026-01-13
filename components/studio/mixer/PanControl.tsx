/**
 * Pan Control Component
 *
 * Horizontal pan slider with visual fill from center and indicator line.
 * Pan range: -100 (left) to +100 (right), center at 0.
 */

export interface PanControlProps {
  pan: number
  panRef: React.RefObject<HTMLDivElement | null>
  isHovering: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function PanControl({
  pan,
  panRef,
  isHovering,
  isDragging,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: PanControlProps) {
  return (
    <div
      ref={panRef}
      className="relative h-5 mx-2 my-2 bg-zinc-900 rounded-[2px] cursor-ew-resize overflow-hidden"
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Pan fill from center */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Left fill (pan < 0) */}
        {pan < 0 && (
          <div
            className="absolute h-full bg-[#9363f7]/30"
            style={{
              right: '50%',
              width: `${Math.abs(pan) / 2}%`,
            }}
          />
        )}

        {/* Right fill (pan > 0) */}
        {pan > 0 && (
          <div
            className="absolute h-full bg-[#9363f7]/30"
            style={{
              left: '50%',
              width: `${pan / 2}%`,
            }}
          />
        )}

        {/* Pan indicator line */}
        <div
          className={`
            absolute top-0 bottom-0 bg-[#9363f7]
            ${isHovering || isDragging ? 'w-1' : 'w-0.5'}
          `}
          style={{
            left: `${(pan + 100) / 2}%`,
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    </div>
  )
}
