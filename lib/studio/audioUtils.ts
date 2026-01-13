/**
 * Audio Processing Utilities
 *
 * Functions for audio waveform generation and analysis.
 */

/**
 * Generate waveform peaks from audio file
 * Generates a fixed number of peaks per second for consistent visual scaling
 *
 * @param file - Audio file to process
 * @param peaksPerSecond - Number of peaks to generate per second (default: 100)
 * @returns Array of peak values (0-1 range)
 */
export async function generateWaveformPeaks(
  file: File,
  peaksPerSecond: number = 100
): Promise<number[]> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

  try {
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const rawData = audioBuffer.getChannelData(0) // Get first channel
    const duration = audioBuffer.duration

    // Generate peaks based on duration, not sample count
    // This ensures consistent visual scaling regardless of sample rate
    const peaksCount = Math.floor(duration * peaksPerSecond)
    const samplesPerPeak = rawData.length / peaksCount
    const peaks: number[] = []

    for (let i = 0; i < peaksCount; i++) {
      const start = Math.floor(i * samplesPerPeak)
      const end = Math.floor((i + 1) * samplesPerPeak)
      let max = 0

      for (let j = start; j < end && j < rawData.length; j++) {
        const abs = Math.abs(rawData[j])
        if (abs > max) max = abs
      }

      peaks.push(max)
    }

    return peaks
  } finally {
    await audioContext.close()
  }
}
