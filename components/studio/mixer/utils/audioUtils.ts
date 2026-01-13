/**
 * Audio Utilities for Mixer Channel
 *
 * Pure functions for audio-related calculations and constants.
 */

/**
 * Convert audio level (0-100) to dB for display
 *
 * @param level - Audio level (0-100)
 * @returns Formatted dB string (e.g., "-6.0", "-∞")
 */
export function levelToDb(level: number): string {
  if (level === 0) return '-∞'
  const db = 20 * Math.log10(level / 100)
  return db.toFixed(1)
}

/**
 * Convert volume (0-100) to dB
 *
 * @param volume - Volume level (0-100)
 * @returns Formatted dB string (e.g., "-6.0", "-∞")
 */
export function volumeToDb(volume: number): string {
  if (volume === 0) return '-∞'
  const db = 20 * Math.log10(volume / 100)
  return db.toFixed(1)
}

/**
 * dB scale graduation marks for visual display on fader
 *
 * Each entry contains:
 * - db: The dB value to display
 * - volumePercent: Position from top (0% = top, 100% = bottom)
 * - size: Visual size of the tick mark ('large' for major marks, 'small' for minor)
 */
export const DB_SCALE_MARKS = [
  { db: 0, volumePercent: 0, size: 'large' as const },
  { db: -2, volumePercent: 20.57, size: 'small' as const },
  { db: -4, volumePercent: 36.9, size: 'small' as const },
  { db: -6, volumePercent: 49.88, size: 'large' as const },
  { db: -8, volumePercent: 60.19, size: 'small' as const },
  { db: -10, volumePercent: 68.38, size: 'small' as const },
  { db: -12, volumePercent: 74.88, size: 'large' as const },
  { db: -14, volumePercent: 80.05, size: 'small' as const },
  { db: -16, volumePercent: 84.15, size: 'small' as const },
  { db: -18, volumePercent: 87.41, size: 'large' as const },
  { db: -20, volumePercent: 90.0, size: 'small' as const },
] as const
