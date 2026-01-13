/**
 * Time Utilities
 *
 * Helper functions for time formatting and manipulation.
 */

/**
 * Format a timestamp to a relative time string (e.g., "2h ago", "3d ago")
 */
export function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo`
  return `${Math.floor(seconds / 31536000)}y`
}
