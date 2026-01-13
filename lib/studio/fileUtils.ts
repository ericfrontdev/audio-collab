/**
 * File Utilities
 *
 * Helper functions for file operations and formatting.
 */

import { AUDIO_CONSTRAINTS } from '@/lib/types/studio'

/**
 * Extract file extension from filename
 *
 * @param filename - The filename to parse
 * @returns File extension including the dot (e.g., ".wav")
 */
export function extractFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex !== -1 ? filename.slice(lastDotIndex) : ''
}

/**
 * Format file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "12.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get max file size in human-readable format from constraints
 *
 * @returns Max file size string (e.g., "500 MB")
 */
export function getMaxFileSizeDisplay(): string {
  return formatFileSize(AUDIO_CONSTRAINTS.MAX_FILE_SIZE)
}

/**
 * Get accepted audio file types string for file input
 *
 * @returns Comma-separated list of MIME types
 */
export function getAcceptedAudioTypes(): string {
  return AUDIO_CONSTRAINTS.ACCEPTED_FORMATS.map((ext) => `audio/${ext}`).join(',')
}
