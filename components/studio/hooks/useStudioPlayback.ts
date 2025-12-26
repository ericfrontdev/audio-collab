import { useState, useRef, useCallback, useEffect } from 'react'
import type { WaveformDisplayRef } from '../WaveformDisplay'

export function useStudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [maxDuration, setMaxDuration] = useState(0)
  const waveformRefs = useRef<Map<string, WaveformDisplayRef>>(new Map())
  const isPlayingRef = useRef(false)

  // Unlock audio on mobile on first user interaction
  useEffect(() => {
    let unlocked = false

    const unlockAudio = async () => {
      if (unlocked) return

      try {
        type WindowWithWebkit = Window &
          typeof globalThis & {
            webkitAudioContext?: typeof window.AudioContext
          }
        const AudioContext =
          window.AudioContext ||
          (window as WindowWithWebkit).webkitAudioContext
        if (AudioContext) {
          const ctx = new AudioContext()
          if (ctx.state === 'suspended') {
            await ctx.resume()
          }
          await ctx.close()
          unlocked = true
        }
      } catch (error) {
        console.debug('Audio unlock failed:', error)
      }
    }

    const events = ['touchstart', 'touchend', 'mousedown', 'keydown']
    events.forEach((event) => {
      document.addEventListener(event, unlockAudio, { once: true })
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, unlockAudio)
      })
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      isPlayingRef.current = false
      setIsPlaying(false)

      waveformRefs.current.forEach((ref) => ref.pause())

      const firstRef = Array.from(waveformRefs.current.values())[0]
      if (firstRef) {
        const pauseTime = firstRef.getCurrentTime()
        waveformRefs.current.forEach((ref) => {
          ref.setTime(pauseTime)
        })
        setCurrentTime(pauseTime)
      }
    } else {
      waveformRefs.current.forEach((ref) => ref.play())
      setIsPlaying(true)
      isPlayingRef.current = true
    }
  }, [isPlaying])

  const handleStop = useCallback(() => {
    waveformRefs.current.forEach((ref) => {
      ref.pause()
      ref.seekTo(0)
    })
    setIsPlaying(false)
    isPlayingRef.current = false
    setCurrentTime(0)
  }, [])

  const handleWaveformReady = useCallback((duration: number) => {
    setMaxDuration((prev) => Math.max(prev, duration))
  }, [])

  const handleTimeUpdate = useCallback((time: number) => {
    if (isPlayingRef.current) {
      setCurrentTime(time)
    }
  }, [])

  // Keyboard shortcuts for playback control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        !['INPUT', 'TEXTAREA'].includes(e.target.tagName)
      ) {
        if (e.code === 'Space') {
          e.preventDefault()
          handlePlayPause()
        }

        if (e.code === 'Enter') {
          e.preventDefault()
          handleStop()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlePlayPause, handleStop])

  return {
    isPlaying,
    currentTime,
    maxDuration,
    waveformRefs,
    setCurrentTime,
    handlePlayPause,
    handleStop,
    handleWaveformReady,
    handleTimeUpdate,
  }
}
