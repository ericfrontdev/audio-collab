import { useState, useRef, useCallback, useEffect } from 'react'
import * as Tone from 'tone'
import type { CanvasWaveformRef } from '../CanvasWaveform'

interface TrackPlayer {
  player: Tone.Player
  volume: Tone.Volume
  panner: Tone.Panner
}

export function useTonePlayback() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [maxDuration, setMaxDuration] = useState(0)

  // Map of track ID to Tone.js player
  const playersRef = useRef<Map<string, TrackPlayer>>(new Map())

  // Waveform refs for visual sync
  const waveformRefs = useRef<Map<string, CanvasWaveformRef>>(new Map())

  // Animation frame for syncing visuals
  const animationFrameRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)

  // Initialize Tone.js context on first user interaction
  useEffect(() => {
    const initAudio = async () => {
      if (Tone.getContext().state === 'suspended') {
        await Tone.start()
      }
    }

    const events = ['touchstart', 'touchend', 'mousedown', 'keydown']
    events.forEach((event) => {
      document.addEventListener(event, initAudio, { once: true })
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, initAudio)
      })
    }
  }, [])

  // Update visual progress - only update the global playhead
  const updateVisuals = useCallback(() => {
    if (!isPlayingRef.current) return

    const transportTime = Tone.Transport.seconds
    setCurrentTime(transportTime)

    // No need to update individual waveforms - they're static
    // Only the global playhead (white line) moves

    animationFrameRef.current = requestAnimationFrame(updateVisuals)
  }, [])

  // Load or update a track's audio
  const loadTrack = useCallback(async (trackId: string, audioUrl: string, volume: number = 0.8, pan: number = 0) => {
    // Remove existing player if any
    const existing = playersRef.current.get(trackId)
    if (existing) {
      try {
        existing.player.stop()
      } catch (e) {
        // Ignore errors when stopping
      }
      try {
        existing.player.disconnect()
        existing.volume.disconnect()
        existing.panner.disconnect()
        existing.player.dispose()
        existing.volume.dispose()
        existing.panner.dispose()
      } catch (e) {
        // Ignore disposal errors
      }
      playersRef.current.delete(trackId)
    }

    try {
      // Create new player (don't sync/start yet)
      const player = new Tone.Player(audioUrl)
      const volumeNode = new Tone.Volume(Tone.gainToDb(volume))
      const pannerNode = new Tone.Panner(pan)

      // Wait for the player to load
      await player.load(audioUrl)

      // Connect: player -> volume -> panner -> destination
      player.connect(volumeNode)
      volumeNode.connect(pannerNode)
      pannerNode.toDestination()

      // Don't sync or start - we'll manage playback manually
      player.loop = false

      playersRef.current.set(trackId, {
        player,
        volume: volumeNode,
        panner: pannerNode,
      })

      // Update max duration
      const duration = player.buffer.duration
      setMaxDuration((prev) => Math.max(prev, duration))

      return duration
    } catch (error) {
      console.error('Error loading track:', error)
      return 0
    }
  }, [])

  // Remove a track
  const removeTrack = useCallback((trackId: string) => {
    const existing = playersRef.current.get(trackId)
    if (existing) {
      try {
        existing.player.stop()
      } catch (e) {
        // Ignore errors when stopping
      }
      try {
        existing.player.disconnect()
        existing.volume.disconnect()
        existing.panner.disconnect()
        existing.player.dispose()
        existing.volume.dispose()
        existing.panner.dispose()
      } catch (e) {
        // Ignore disposal errors
      }
      playersRef.current.delete(trackId)
    }
  }, [])

  // Update track volume
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const track = playersRef.current.get(trackId)
    if (track) {
      track.volume.volume.value = Tone.gainToDb(volume)
    }
  }, [])

  // Update track pan
  const setTrackPan = useCallback((trackId: string, pan: number) => {
    const track = playersRef.current.get(trackId)
    if (track) {
      track.panner.pan.value = pan
    }
  }, [])

  // Update track mute
  const setTrackMute = useCallback((trackId: string, muted: boolean) => {
    const track = playersRef.current.get(trackId)
    if (track) {
      track.player.mute = muted
    }
  }, [])

  // Play/Pause
  const handlePlayPause = useCallback(async () => {
    // Ensure audio context is started
    if (Tone.getContext().state === 'suspended') {
      await Tone.start()
    }

    if (isPlaying) {
      // Pause
      Tone.Transport.pause()

      // Stop all players
      playersRef.current.forEach((track) => {
        try {
          track.player.stop()
        } catch (e) {
          // Ignore stop errors
        }
      })

      setIsPlaying(false)
      isPlayingRef.current = false

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Canvas waveforms are static - no need to pause them
    } else {
      // Play - start all players from current transport position
      const startTime = Tone.Transport.seconds

      // STEP 1: Stop all players first
      playersRef.current.forEach((track) => {
        try {
          track.player.stop()
        } catch (e) {
          // Ignore if already stopped
        }
      })

      // STEP 2: Start all players immediately at the same offset
      // Use relative time notation "+0" to start as soon as possible
      playersRef.current.forEach((track) => {
        try {
          track.player.start("+0", startTime)
        } catch (e) {
          console.error('Error starting player:', e)
        }
      })

      Tone.Transport.start()
      setIsPlaying(true)
      isPlayingRef.current = true

      // Start visual updates
      updateVisuals()
    }
  }, [isPlaying, updateVisuals])

  // Stop
  const handleStop = useCallback(() => {
    // Stop transport
    Tone.Transport.stop()
    Tone.Transport.seconds = 0

    // Stop all players
    playersRef.current.forEach((track) => {
      try {
        track.player.stop()
      } catch (e) {
        // Ignore stop errors
      }
    })

    setIsPlaying(false)
    isPlayingRef.current = false
    setCurrentTime(0)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Canvas waveforms are static - playhead resets via currentTime state
  }, [])

  // Seek
  const handleSeek = useCallback((time: number) => {
    const wasPlaying = isPlayingRef.current

    // Stop all players
    playersRef.current.forEach((track) => {
      try {
        track.player.stop()
      } catch (e) {
        // Ignore errors
      }
    })

    // Update transport position
    Tone.Transport.seconds = time
    setCurrentTime(time)

    // Restart players if we were playing
    if (wasPlaying) {
      playersRef.current.forEach((track) => {
        try {
          track.player.start("+0", time)
        } catch (e) {
          console.error('Error restarting player after seek:', e)
        }
      })
    }

    // No need to sync waveforms - they're static
  }, [])

  // Handle waveform ready
  const handleWaveformReady = useCallback((duration: number) => {
    setMaxDuration((prev) => Math.max(prev, duration))
  }, [])

  // Keyboard shortcuts
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop visual updates
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Dispose all players
      playersRef.current.forEach((track) => {
        try {
          track.player.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
        try {
          track.player.disconnect()
          track.volume.disconnect()
          track.panner.disconnect()
          track.player.dispose()
          track.volume.dispose()
          track.panner.dispose()
        } catch (e) {
          // Ignore disposal errors
        }
      })
      playersRef.current.clear()

      // Stop transport
      try {
        Tone.Transport.stop()
        Tone.Transport.cancel()
      } catch (e) {
        // Ignore transport errors
      }
    }
  }, [])

  return {
    isPlaying,
    currentTime,
    maxDuration,
    waveformRefs,
    setCurrentTime,
    handlePlayPause,
    handleStop,
    handleSeek,
    handleWaveformReady,
    loadTrack,
    removeTrack,
    setTrackVolume,
    setTrackPan,
    setTrackMute,
  }
}
