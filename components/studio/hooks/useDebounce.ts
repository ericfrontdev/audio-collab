import { useEffect, useRef } from 'react'

/**
 * Custom hook for debouncing function calls
 * Useful for avoiding too many database writes when dragging faders
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default 500ms)
 * @returns Debounced version of the callback
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedCallback = ((...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }) as T

  return debouncedCallback
}
