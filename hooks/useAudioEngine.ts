import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { usePlaybackStore, useMixerStore } from '@/lib/stores'
import { FXChain } from '@/lib/audio/FXChain'
import type { FXSettings } from '@/lib/stores/useMixerStore'

/**
 * Stateless Audio Engine Hook
 *
 * ARCHITECTURE: Single Source of Truth Pattern
 * - useMixerStore = ONLY source of truth for all audio settings
 * - This hook = stateless executor that just applies commands
 * - No internal state, no subscriptions, no race conditions
 * - Simple useEffect synchronization from store to Tone.js
 */

interface TrackPlayer {
  player: Tone.Player
  fxChain: FXChain
  volume: Tone.Volume
  panner: Tone.Panner
  analyser: AnalyserNode
}

export function useAudioEngine() {
  // Store subscriptions (read-only, no writes)
  const { setCurrentTime, setTrackDuration } = usePlaybackStore()
  const { setTrackLevel, setMasterLevel } = useMixerStore()

  // Audio players map
  const playersRef = useRef<Map<string, TrackPlayer>>(new Map())

  // Master channel nodes
  const masterVolumeRef = useRef<Tone.Volume | null>(null)
  const masterPannerRef = useRef<Tone.Panner | null>(null)
  const masterAnalyserRef = useRef<AnalyserNode | null>(null)

  // Animation frame for visual sync
  const animationFrameRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)

  // Initialize Tone.js and master channel
  useEffect(() => {
    const initAudio = async () => {
      if (Tone.getContext().state === 'suspended') {
        await Tone.start()
      }

      // Create master channel if it doesn't exist
      if (!masterVolumeRef.current) {
        const masterVolume = new Tone.Volume(0)
        const masterPanner = new Tone.Panner(0)

        masterVolume.connect(masterPanner)
        masterPanner.toDestination()

        // Create master analyser for VU meter
        const audioContext = Tone.getContext().rawContext as AudioContext
        const masterAnalyser = audioContext.createAnalyser()
        masterAnalyser.fftSize = 512
        masterAnalyser.smoothingTimeConstant = 0.8

        Tone.connect(masterPanner, masterAnalyser as any)

        masterVolumeRef.current = masterVolume
        masterPannerRef.current = masterPanner
        masterAnalyserRef.current = masterAnalyser
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

  // ============================================================================
  // STATELESS EXECUTORS - Just apply commands, no state tracking
  // ============================================================================

  /**
   * Load a track - returns duration for store to save
   */
  const loadTrack = useCallback(async (trackId: string, audioUrl: string): Promise<number> => {
    console.log('🎵 [AudioEngine] Loading track:', trackId)

    // Remove existing player if any
    const existing = playersRef.current.get(trackId)
    if (existing) {
      try {
        existing.player.stop()
        existing.player.disconnect()
        existing.fxChain.dispose()
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
      // Create player and load audio
      const player = new Tone.Player()
      const fxChain = new FXChain()
      const volumeNode = new Tone.Volume(0) // Start at 0dB, store will set correct value
      const pannerNode = new Tone.Panner(0) // Start at center, store will set correct value

      // Try to load audio, fail gracefully if URL is invalid
      try {
        await player.load(audioUrl)
      } catch (loadError) {
        console.warn(`[AudioEngine] Failed to load audio for track ${trackId}:`, audioUrl, loadError)
        player.dispose()
        fxChain.dispose()
        volumeNode.dispose()
        pannerNode.dispose()
        return 0
      }

      // Connect: player -> fxChain -> volume -> panner -> master
      fxChain.connectInput(player)
      fxChain.connectOutput(volumeNode)
      volumeNode.connect(pannerNode)

      if (masterVolumeRef.current) {
        pannerNode.connect(masterVolumeRef.current)
      } else {
        pannerNode.toDestination()
      }

      // Create analyser for VU meter
      const audioContext = Tone.getContext().rawContext as AudioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8

      Tone.connect(pannerNode, analyser as any)

      player.loop = false

      playersRef.current.set(trackId, {
        player,
        fxChain,
        volume: volumeNode,
        panner: pannerNode,
        analyser,
      })

      // Update duration in store
      const duration = player.buffer.duration
      setTrackDuration(trackId, duration)

      console.log('✅ [AudioEngine] Track loaded:', trackId, 'duration:', duration)
      return duration
    } catch (error) {
      console.error(`[AudioEngine] Error loading track ${trackId}:`, error)
      return 0
    }
  }, [setTrackDuration])

  /**
   * Remove a track
   */
  const removeTrack = useCallback((trackId: string) => {
    console.log('🗑️ [AudioEngine] Removing track:', trackId)
    const existing = playersRef.current.get(trackId)
    if (existing) {
      try {
        existing.player.stop()
        existing.player.disconnect()
        existing.fxChain.dispose()
        existing.volume.disconnect()
        existing.panner.disconnect()
        existing.player.dispose()
        existing.volume.dispose()
        existing.panner.dispose()
      } catch (e) {
        // Ignore errors
      }
      playersRef.current.delete(trackId)
    }
  }, [])

  /**
   * STATELESS: Execute volume change (no state tracking)
   */
  const executeVolumeChange = useCallback((trackId: string, volume: number) => {
    const track = playersRef.current.get(trackId)
    if (track) {
      track.volume.volume.value = Tone.gainToDb(volume)
    }
  }, [])

  /**
   * STATELESS: Execute pan change (no state tracking)
   */
  const executePanChange = useCallback((trackId: string, pan: number) => {
    const track = playersRef.current.get(trackId)
    if (track) {
      track.panner.pan.value = pan
    }
  }, [])

  /**
   * STATELESS: Execute FX settings change (no state tracking)
   */
  const executeFXChange = useCallback((trackId: string, fxSettings: FXSettings) => {
    const track = playersRef.current.get(trackId)
    if (track) {
      track.fxChain.applySettings(fxSettings)
    }
  }, [])

  /**
   * STATELESS: Execute mute change (no state tracking)
   */
  const executeMuteChange = useCallback((trackId: string, muted: boolean) => {
    const track = playersRef.current.get(trackId)
    if (track) {
      track.player.mute = muted
    }
  }, [])

  /**
   * STATELESS: Execute master volume change (no state tracking)
   */
  const executeMasterVolumeChange = useCallback((volume: number) => {
    if (masterVolumeRef.current) {
      masterVolumeRef.current.volume.value = Tone.gainToDb(volume / 100)
    }
  }, [])

  /**
   * STATELESS: Execute master pan change (no state tracking)
   */
  const executeMasterPanChange = useCallback((pan: number) => {
    if (masterPannerRef.current) {
      masterPannerRef.current.pan.value = pan / 100
    }
  }, [])

  /**
   * STATELESS: Execute master mute change (no state tracking)
   */
  const executeMasterMuteChange = useCallback((muted: boolean) => {
    if (masterVolumeRef.current) {
      masterVolumeRef.current.mute = muted
    }
  }, [])

  // Visual update loop (VU meters + playhead)
  const updateVisuals = useCallback(() => {
    if (!isPlayingRef.current) return

    const transportTime = Tone.Transport.seconds
    setCurrentTime(transportTime)

    // Update VU meters
    playersRef.current.forEach((track, trackId) => {
      if (track.analyser) {
        const dataArray = new Uint8Array(track.analyser.frequencyBinCount)
        track.analyser.getByteFrequencyData(dataArray)

        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i]
        }
        const rms = Math.sqrt(sum / dataArray.length)
        const level = (rms / 255) * 100

        setTrackLevel(trackId, level, level)
      }
    })

    // Master level
    if (masterAnalyserRef.current) {
      const dataArray = new Uint8Array(masterAnalyserRef.current.frequencyBinCount)
      masterAnalyserRef.current.getByteFrequencyData(dataArray)

      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      const rms = Math.sqrt(sum / dataArray.length)
      const level = (rms / 255) * 100

      setMasterLevel(level, level)
    } else {
      setMasterLevel(0, 0)
    }

    animationFrameRef.current = requestAnimationFrame(updateVisuals)
  }, [setCurrentTime, setTrackLevel, setMasterLevel])

  // Play/Pause
  const handlePlayPause = useCallback(async () => {
    if (Tone.getContext().state === 'suspended') {
      await Tone.start()
    }

    if (isPlayingRef.current) {
      // Pause
      Tone.Transport.pause()
      playersRef.current.forEach((track) => {
        try {
          track.player.stop()
        } catch (e) {
          // Ignore
        }
      })
      isPlayingRef.current = false
    } else {
      // Play
      const startTime = Tone.Transport.seconds

      playersRef.current.forEach((track) => {
        try {
          track.player.start("+0", startTime)
        } catch (e) {
          console.error('[AudioEngine] Error starting player:', e)
        }
      })

      Tone.Transport.start("+0", startTime)
      isPlayingRef.current = true
      updateVisuals()
    }
  }, [updateVisuals])

  // Stop
  const handleStop = useCallback(() => {
    Tone.Transport.stop()
    Tone.Transport.seconds = 0

    playersRef.current.forEach((track) => {
      try {
        track.player.stop()
      } catch (e) {
        // Ignore
      }
    })

    isPlayingRef.current = false
    setCurrentTime(0)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [setCurrentTime])

  // Seek
  const handleSeek = useCallback((time: number) => {
    const wasPlaying = isPlayingRef.current

    playersRef.current.forEach((track) => {
      try {
        track.player.stop()
      } catch (e) {
        // Ignore
      }
    })

    Tone.Transport.seconds = time
    setCurrentTime(time)

    if (wasPlaying) {
      playersRef.current.forEach((track) => {
        try {
          track.player.start("+0", time)
        } catch (e) {
          console.error('[AudioEngine] Error restarting player after seek:', e)
        }
      })
    }
  }, [setCurrentTime])

  // Sync isPlaying with ref
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  return {
    loadTrack,
    removeTrack,
    // Stateless executors (no state tracking)
    executeVolumeChange,
    executePanChange,
    executeFXChange,
    executeMuteChange,
    executeMasterVolumeChange,
    executeMasterPanChange,
    executeMasterMuteChange,
    // Playback controls
    handlePlayPause,
    handleStop,
    handleSeek,
  }
}
