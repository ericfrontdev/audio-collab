import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { useStudioStore, usePlaybackStore, useMixerStore } from '@/lib/stores'

/**
 * Simple Audio Engine Hook
 *
 * Manages Tone.js audio playback using Zustand stores.
 * One player per track - no comping, no multi-player complexity.
 */

interface TrackPlayer {
  player: Tone.Player
  volume: Tone.Volume
  panner: Tone.Panner
  analyser: AnalyserNode
}

export function useAudioEngine() {
  // Store subscriptions
  const tracks = useStudioStore((state) => state.tracks)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
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

  // Load a track
  const loadTrack = useCallback(async (trackId: string, audioUrl: string, volume: number, pan: number) => {
    // Remove existing player if any
    const existing = playersRef.current.get(trackId)
    if (existing) {
      try {
        existing.player.stop()
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
      // Create player and load audio
      const player = new Tone.Player()
      const volumeNode = new Tone.Volume(Tone.gainToDb(volume))
      const pannerNode = new Tone.Panner(pan)

      // Try to load audio, fail gracefully if URL is invalid
      try {
        await player.load(audioUrl)
      } catch (loadError) {
        console.warn(`Failed to load audio for track ${trackId}:`, audioUrl, loadError)
        // Clean up nodes
        player.dispose()
        volumeNode.dispose()
        pannerNode.dispose()
        return 0
      }

      // Connect: player -> volume -> panner -> master
      player.connect(volumeNode)
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
        volume: volumeNode,
        panner: pannerNode,
        analyser,
      })

      // Update duration in store
      const duration = player.buffer.duration
      setTrackDuration(trackId, duration)

      return duration
    } catch (error) {
      console.error(`Error loading track ${trackId}:`, error)
      return 0
    }
  }, [setTrackDuration])

  // Remove a track
  const removeTrack = useCallback((trackId: string) => {
    const existing = playersRef.current.get(trackId)
    if (existing) {
      try {
        existing.player.stop()
        existing.player.disconnect()
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

  // Update track volume
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const track = playersRef.current.get(trackId)
    console.log('🔊 setTrackVolume called:', {
      trackId,
      volume,
      volumeDb: Tone.gainToDb(volume),
      trackExists: !!track,
      allTracks: Array.from(playersRef.current.keys())
    })
    if (track) {
      track.volume.volume.value = Tone.gainToDb(volume)
      console.log('✅ Volume set successfully')
    } else {
      // Track not loaded yet - this is OK, will be set on load
      console.warn('⚠️ Track not loaded yet, skipping volume update:', trackId)
    }
  }, [])

  // Update track pan
  const setTrackPan = useCallback((trackId: string, pan: number) => {
    const track = playersRef.current.get(trackId)
    if (track) {
      track.panner.pan.value = pan
    } else {
      console.warn('⚠️ Track not loaded yet, skipping pan update:', trackId)
    }
  }, [])

  // Update track mute
  const setTrackMute = useCallback((trackId: string, muted: boolean) => {
    const track = playersRef.current.get(trackId)
    if (track) {
      track.player.mute = muted
    } else {
      console.warn('⚠️ Track not loaded yet, skipping mute update:', trackId)
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
      masterPannerRef.current.pan.value = pan / 100
    }
  }, [])

  // Update master mute
  const setMasterMute = useCallback((muted: boolean) => {
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
          console.error('Error starting player:', e)
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
          console.error('Error restarting player after seek:', e)
        }
      })
    }
  }, [setCurrentTime])

  // Sync isPlaying with ref
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  return {
    loadTrack,
    removeTrack,
    setTrackVolume,
    setTrackPan,
    setTrackMute,
    setMasterVolume,
    setMasterPan,
    setMasterMute,
    handlePlayPause,
    handleStop,
    handleSeek,
  }
}
