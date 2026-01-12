import { useState, useRef, useCallback, useEffect } from 'react'
import * as Tone from 'tone'
import type { CanvasWaveformRef } from '../CanvasWaveform'
import type { CompedSection } from '@/lib/types/studio'

interface TrackPlayer {
  player: Tone.Player
  volume: Tone.Volume
  panner: Tone.Panner
  analyser: AnalyserNode
  toneAnalyser: Tone.Analyser
}

interface TrackPlayerSet {
  trackId: string
  originalTakeId: string
  originalPlayer: TrackPlayer
  retakePlayers: Map<string, TrackPlayer>
  compedSections: CompedSection[]
}

interface AudioLevelCallback {
  (trackId: string, level: number, peak: number): void
}

export function useTonePlayback(onAudioLevel?: AudioLevelCallback) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [maxDuration, setMaxDuration] = useState(0)

  // Map of track ID to Tone.js player (legacy - for tracks without comping)
  const playersRef = useRef<Map<string, TrackPlayer>>(new Map())

  // Map of track ID to player sets (for tracks with retakes/comping)
  const trackPlayerSetsRef = useRef<Map<string, TrackPlayerSet>>(new Map())

  // Master channel nodes
  const masterPannerRef = useRef<Tone.Panner | null>(null)
  const masterVolumeRef = useRef<Tone.Volume | null>(null)

  // Waveform refs for visual sync
  const waveformRefs = useRef<Map<string, CanvasWaveformRef>>(new Map())

  // Animation frame for syncing visuals
  const animationFrameRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)
  const isDecayingRef = useRef(false)

  // Audio level monitoring
  const audioLevelCallbackRef = useRef(onAudioLevel)
  const peakValuesRef = useRef<Map<string, number>>(new Map())
  const peakHoldTimesRef = useRef<Map<string, number>>(new Map())
  const currentLevelsRef = useRef<Map<string, number>>(new Map())

  // Master peak tracking (use 'master' as key)
  const masterPeakRef = useRef(0)
  const masterPeakHoldTimeRef = useRef(0)
  const masterCurrentLevelRef = useRef(0)

  // Initialize Tone.js context and master channel on first user interaction
  useEffect(() => {
    const initAudio = async () => {
      if (Tone.getContext().state === 'suspended') {
        await Tone.start()
      }

      // Create master channel nodes if they don't exist
      if (!masterPannerRef.current) {
        const masterVolume = new Tone.Volume(0) // 0 dB = unity gain
        const masterPanner = new Tone.Panner(0) // Center

        // Chain: master volume → master panner → destination
        masterVolume.connect(masterPanner)
        masterPanner.toDestination()

        masterVolumeRef.current = masterVolume
        masterPannerRef.current = masterPanner
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

  // Update callback ref
  useEffect(() => {
    audioLevelCallbackRef.current = onAudioLevel
  }, [onAudioLevel])

  // Update comped playback - switch mutes based on comped sections
  const updateCompedPlayback = useCallback(() => {
    if (!isPlayingRef.current) return

    const currentTime = Tone.Transport.seconds

    trackPlayerSetsRef.current.forEach((set) => {
      // Find if currentTime is in a comped section
      const activeSection = set.compedSections.find(
        s => currentTime >= s.start_time && currentTime < s.end_time
      )

      if (activeSection) {
        // Play retake, mute original using volume (more reliable than player.mute)
        set.originalPlayer.volume.volume.rampTo(-100, 0.01) // Mute original instantly

        set.retakePlayers.forEach((retakePlayer, takeId) => {
          if (takeId === activeSection.take_id) {
            // Unmute this retake
            retakePlayer.volume.volume.rampTo(0, 0.01) // 0 dB = unity gain
          } else {
            // Mute other retakes
            retakePlayer.volume.volume.rampTo(-100, 0.01)
          }
        })
      } else {
        // Play original, mute all retakes
        set.originalPlayer.volume.volume.rampTo(0, 0.01) // Unmute original
        set.retakePlayers.forEach(retakePlayer => {
          retakePlayer.volume.volume.rampTo(-100, 0.01) // Mute all retakes
        })
      }
    })
  }, [])

  // Update visual progress and audio levels
  const updateVisuals = useCallback(() => {
    if (!isPlayingRef.current && !isDecayingRef.current) return

    const transportTime = Tone.Transport.seconds
    setCurrentTime(transportTime)

    const now = Date.now()

    // Update audio levels for each track
    if (audioLevelCallbackRef.current) {
      let anyNonZeroLevels = false

      playersRef.current.forEach((track, trackId) => {
        let level = 0
        let rms = 0

        if (isPlayingRef.current && track.analyser) {
          // Playing - read from analyser
          const analyser = track.analyser
          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(dataArray)

          // Calculate RMS level
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i]
          }
          rms = Math.sqrt(sum / dataArray.length)
          level = (rms / 255) * 100
          currentLevelsRef.current.set(trackId, level)
        } else if (isDecayingRef.current) {
          // Decaying - apply exponential decay to last level
          const lastLevel = currentLevelsRef.current.get(trackId) || 0
          level = lastLevel * 0.90 // Fast decay (10% per frame at 60fps ≈ 0.4s to reach near-zero)
          currentLevelsRef.current.set(trackId, level)

          if (level > 0.5) {
            anyNonZeroLevels = true
          }
        }

        // Update peak with hold time
        const currentPeak = peakValuesRef.current.get(trackId) || 0
        const lastPeakTime = peakHoldTimesRef.current.get(trackId) || 0

        let newPeak = currentPeak
        if (isPlayingRef.current && rms > currentPeak) {
          newPeak = rms
          peakHoldTimesRef.current.set(trackId, now)
        } else if (now - lastPeakTime > 1000 || isDecayingRef.current) {
          newPeak = currentPeak * 0.95 // Decay peak
        }
        peakValuesRef.current.set(trackId, newPeak)

        const peak = (newPeak / 255) * 100

        audioLevelCallbackRef.current?.(trackId, level, peak)
      })

      // Stop decay animation when all levels are near zero
      if (isDecayingRef.current && !anyNonZeroLevels) {
        isDecayingRef.current = false
        // Set all to exactly 0
        playersRef.current.forEach((track, trackId) => {
          audioLevelCallbackRef.current!(trackId, 0, 0)
          currentLevelsRef.current.set(trackId, 0)
        })
        // Also reset master to 0
        if (audioLevelCallbackRef.current) {
          audioLevelCallbackRef.current('master', 0, 0)
          masterCurrentLevelRef.current = 0
        }
        peakValuesRef.current.clear()
        peakHoldTimesRef.current.clear()
        masterPeakRef.current = 0
        masterPeakHoldTimeRef.current = 0
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        return
      }
    }

    // Update master audio level (sum of all track levels)
    if (audioLevelCallbackRef.current) {
      let masterLevel = 0

      if (isPlayingRef.current || isDecayingRef.current) {
        // Calculate master level using RMS sum of track levels
        // Note: This is a simple calculation, not true audio summing (doesn't account for phase, clipping, etc.)
        let sumOfSquares = 0

        currentLevelsRef.current.forEach((level) => {
          sumOfSquares += level * level
        })

        // RMS sum: sqrt(sum of squares) - properly represents combined signal level
        if (sumOfSquares > 0) {
          masterLevel = Math.sqrt(sumOfSquares)
          masterLevel = Math.min(100, masterLevel) // Clamp to 100
        }

        if (isDecayingRef.current) {
          // Apply additional decay for master
          masterLevel = masterLevel * 0.95
        }

        masterCurrentLevelRef.current = masterLevel
      } else {
        masterLevel = 0
      }

      // Update master peak with hold time
      const currentMasterPeak = masterPeakRef.current
      const lastMasterPeakTime = masterPeakHoldTimeRef.current

      let newMasterPeak = currentMasterPeak
      if (isPlayingRef.current && masterLevel > currentMasterPeak) {
        newMasterPeak = masterLevel
        masterPeakHoldTimeRef.current = now
      } else if (now - lastMasterPeakTime > 1000 || isDecayingRef.current) {
        newMasterPeak = currentMasterPeak * 0.95 // Decay peak
      }
      masterPeakRef.current = newMasterPeak

      audioLevelCallbackRef.current?.('master', masterLevel, newMasterPeak)
    }

    // Update comped playback switching
    updateCompedPlayback()

    animationFrameRef.current = requestAnimationFrame(updateVisuals)
  }, [updateCompedPlayback])

  // Load or update a track's audio
  const loadTrack = useCallback(async (trackId: string, audioUrl: string, volume: number = 0.8, pan: number = 0) => {
    // Check if playback is currently running
    const wasPlaying = isPlayingRef.current
    const currentTransportTime = wasPlaying ? Tone.Transport.seconds : 0

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

      // Connect audio chain: player -> volume -> panner -> master volume
      player.connect(volumeNode)
      volumeNode.connect(pannerNode)

      // Connect to master channel if it exists, otherwise to destination
      if (masterVolumeRef.current) {
        pannerNode.connect(masterVolumeRef.current)
      } else {
        pannerNode.toDestination()
      }

      // Create Web Audio API analyser directly
      const audioContext = Tone.getContext().rawContext as AudioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8

      // Wrap the native analyser in a Tone node for easy connection
      const toneAnalyser = new Tone.Analyser('fft', 512)

      // Connect panner to both Tone analyser and native analyser
      pannerNode.connect(toneAnalyser)

      // Also connect to native analyser using Tone.connect (for monitoring only)
      Tone.connect(pannerNode, analyser as any)
      // DO NOT connect analyser to destination - that would bypass mute control!

      // Don't sync or start - we'll manage playback manually
      player.loop = false

      playersRef.current.set(trackId, {
        player,
        volume: volumeNode,
        panner: pannerNode,
        analyser,
        toneAnalyser,
      })

      // Update max duration
      const duration = player.buffer.duration
      setMaxDuration((prev) => Math.max(prev, duration))

      // CRITICAL FIX: If playback was running when we loaded this new track,
      // start the player at the current transport position
      if (wasPlaying && currentTransportTime < duration) {
        console.log(`🎵 Starting new player for track ${trackId} at ${currentTransportTime}s`)
        try {
          player.start("+0", currentTransportTime)
        } catch (e) {
          console.error('Error starting new player:', e)
        }
      }

      return duration
    } catch (error) {
      console.error('Error loading track:', error)
      return 0
    }
  }, [])

  // Load a track with retakes and comped sections
  const loadTrackWithRetakes = useCallback(async (
    trackId: string,
    originalTakeId: string,
    originalAudioUrl: string,
    retakesWithSections: Array<{ takeId: string; audioUrl: string; sections: CompedSection[] }>,
    volume: number = 0.8,
    pan: number = 0
  ) => {
    // Check if playback is currently running
    const wasPlaying = isPlayingRef.current
    const currentTransportTime = wasPlaying ? Tone.Transport.seconds : 0

    // Remove existing player set if any
    const existing = trackPlayerSetsRef.current.get(trackId)
    if (existing) {
      try {
        existing.originalPlayer.player.stop()
        existing.originalPlayer.player.dispose()
        existing.originalPlayer.volume.dispose()
        existing.originalPlayer.panner.dispose()

        existing.retakePlayers.forEach(retakePlayer => {
          retakePlayer.player.stop()
          retakePlayer.player.dispose()
          retakePlayer.volume.dispose()
          retakePlayer.panner.dispose()
        })
      } catch (e) {
        // Ignore disposal errors
      }
      trackPlayerSetsRef.current.delete(trackId)
    }

    try {
      // Helper function to create a single player
      const createPlayer = async (audioUrl: string): Promise<TrackPlayer> => {
        const player = new Tone.Player(audioUrl)
        const volumeNode = new Tone.Volume(Tone.gainToDb(volume))
        const pannerNode = new Tone.Panner(pan)

        await player.load(audioUrl)

        player.connect(volumeNode)
        volumeNode.connect(pannerNode)

        if (masterVolumeRef.current) {
          pannerNode.connect(masterVolumeRef.current)
        } else {
          pannerNode.toDestination()
        }

        const audioContext = Tone.getContext().rawContext as AudioContext
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.8

        const toneAnalyser = new Tone.Analyser('fft', 512)
        pannerNode.connect(toneAnalyser)
        Tone.connect(pannerNode, analyser as any)
        // DO NOT connect analyser to destination - that would bypass mute control!

        player.loop = false

        return {
          player,
          volume: volumeNode,
          panner: pannerNode,
          analyser,
          toneAnalyser,
        }
      }

      // Load original
      const originalPlayer = await createPlayer(originalAudioUrl)

      // Load retakes with sections
      const retakePlayers = new Map<string, TrackPlayer>()
      for (const retake of retakesWithSections) {
        const retakePlayer = await createPlayer(retake.audioUrl)
        // Mute by setting volume to -100 dB (essentially silence)
        retakePlayer.volume.volume.value = -100
        retakePlayers.set(retake.takeId, retakePlayer)
      }

      // Collect all sections
      const allSections = retakesWithSections.flatMap(r => r.sections)

      // Store player set
      trackPlayerSetsRef.current.set(trackId, {
        trackId,
        originalTakeId,
        originalPlayer,
        retakePlayers,
        compedSections: allSections,
      })

      // Update max duration
      const duration = originalPlayer.player.buffer.duration
      setMaxDuration((prev) => Math.max(prev, duration))

      // CRITICAL FIX: If playback was running when we loaded this new track,
      // start all players at the current transport position
      if (wasPlaying && currentTransportTime < duration) {
        console.log(`🎵 Starting new player set for track ${trackId} at ${currentTransportTime}s`)
        try {
          originalPlayer.player.start("+0", currentTransportTime)
          retakePlayers.forEach((retakePlayer) => {
            retakePlayer.player.start("+0", currentTransportTime)
          })
        } catch (e) {
          console.error('Error starting new player set:', e)
        }
      }

      return duration
    } catch (error) {
      console.error('Error loading track with retakes:', error)
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
        existing.toneAnalyser.dispose()
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
      peakValuesRef.current.delete(trackId)
      peakHoldTimesRef.current.delete(trackId)
    }
  }, [])

  // Update track volume
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const track = playersRef.current.get(trackId)
    if (track) {
      // volume is already 0-1 (from useStudioTracks)
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

  // Update master volume
  const setMasterVolume = useCallback((volume: number) => {
    if (masterVolumeRef.current) {
      masterVolumeRef.current.volume.value = Tone.gainToDb(volume / 100)
    }
  }, [])

  // Update master pan
  const setMasterPan = useCallback((pan: number) => {
    if (masterPannerRef.current) {
      // pan is -100 to 100, convert to -1 to 1
      masterPannerRef.current.pan.value = pan / 100
    }
  }, [])

  // Update master mute
  const setMasterMute = useCallback((muted: boolean) => {
    if (masterVolumeRef.current) {
      masterVolumeRef.current.mute = muted
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

      // Stop all player sets (original + retakes)
      trackPlayerSetsRef.current.forEach((set) => {
        try {
          set.originalPlayer.player.stop()
          set.retakePlayers.forEach(retakePlayer => retakePlayer.player.stop())
        } catch (e) {
          // Ignore stop errors
        }
      })

      setIsPlaying(false)
      isPlayingRef.current = false

      // Start decay animation instead of stopping immediately
      isDecayingRef.current = true
      // Animation continues via updateVisuals

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

      // Stop all player sets
      trackPlayerSetsRef.current.forEach((set) => {
        try {
          set.originalPlayer.player.stop()
          set.retakePlayers.forEach(retakePlayer => retakePlayer.player.stop())
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

      // Start all player sets (original + retakes)
      trackPlayerSetsRef.current.forEach((set) => {
        try {
          set.originalPlayer.player.start("+0", startTime)
          set.retakePlayers.forEach(retakePlayer => retakePlayer.player.start("+0", startTime))
        } catch (e) {
          console.error('Error starting player set:', e)
        }
      })

      // Start transport at the correct position
      // Pass both when to start ("+0" = immediately) and where in timeline (startTime)
      Tone.Transport.start("+0", startTime)
      setIsPlaying(true)
      isPlayingRef.current = true

      // Clear decay state if we're restarting during decay
      isDecayingRef.current = false

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

    // Stop all player sets
    trackPlayerSetsRef.current.forEach((set) => {
      try {
        set.originalPlayer.player.stop()
        set.retakePlayers.forEach(retakePlayer => retakePlayer.player.stop())
      } catch (e) {
        // Ignore stop errors
      }
    })

    setIsPlaying(false)
    isPlayingRef.current = false
    setCurrentTime(0)

    // Start decay animation instead of stopping immediately
    isDecayingRef.current = true
    // Animation continues via updateVisuals until levels reach 0

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

    // Stop all player sets
    trackPlayerSetsRef.current.forEach((set) => {
      try {
        set.originalPlayer.player.stop()
        set.retakePlayers.forEach(retakePlayer => retakePlayer.player.stop())
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

      // Restart player sets
      trackPlayerSetsRef.current.forEach((set) => {
        try {
          set.originalPlayer.player.start("+0", time)
          set.retakePlayers.forEach(retakePlayer => retakePlayer.player.start("+0", time))
        } catch (e) {
          console.error('Error restarting player set after seek:', e)
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
          track.toneAnalyser.dispose()
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
      peakValuesRef.current.clear()
      peakHoldTimesRef.current.clear()

      // Dispose master channel nodes
      try {
        if (masterPannerRef.current) {
          masterPannerRef.current.disconnect()
          masterPannerRef.current.dispose()
          masterPannerRef.current = null
        }
        if (masterVolumeRef.current) {
          masterVolumeRef.current.disconnect()
          masterVolumeRef.current.dispose()
          masterVolumeRef.current = null
        }
      } catch (e) {
        // Ignore disposal errors
      }

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
    loadTrackWithRetakes,
    removeTrack,
    setTrackVolume,
    setTrackPan,
    setTrackMute,
    setMasterVolume,
    setMasterPan,
    setMasterMute,
  }
}
