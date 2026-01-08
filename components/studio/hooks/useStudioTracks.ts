import { useState, useCallback, useEffect } from 'react'
import { useDebounce } from './useDebounce'

interface MixerSettingsData {
  volume?: number
  pan?: number
  solo?: boolean
  mute?: boolean
}

interface UseStudioTracksProps {
  setTrackVolume: (trackId: string, volume: number) => void
  setTrackPan: (trackId: string, pan: number) => void
  setTrackMute: (trackId: string, muted: boolean) => void
  trackIds: string[]
  masterVolume: number
  masterPan: number
  masterMute: boolean
  initialSettings?: Map<string, MixerSettingsData>
  onMixerSettingsChange?: (trackId: string, settings: {
    volume?: number
    pan?: number
    solo?: boolean
    mute?: boolean
  }) => void
}

export function useStudioTracks({ setTrackVolume, setTrackPan, setTrackMute, trackIds, masterVolume, masterPan, masterMute, initialSettings, onMixerSettingsChange }: UseStudioTracksProps) {
  const [trackVolumes, setTrackVolumes] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>()
    initialSettings?.forEach((settings, trackId) => {
      if (settings.volume !== undefined) {
        map.set(trackId, settings.volume * 100) // Convert 0-1 to 0-100
      }
    })
    return map
  })

  const [trackPans, setTrackPans] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>()
    initialSettings?.forEach((settings, trackId) => {
      if (settings.pan !== undefined) {
        map.set(trackId, settings.pan * 100) // Convert -1 to 1 → -100 to 100
      }
    })
    return map
  })

  const [trackMutes, setTrackMutes] = useState<Set<string>>(() => {
    const set = new Set<string>()
    initialSettings?.forEach((settings, trackId) => {
      if (settings.mute) {
        set.add(trackId)
      }
    })
    return set
  })

  const [trackSolos, setTrackSolos] = useState<Set<string>>(() => {
    const set = new Set<string>()
    initialSettings?.forEach((settings, trackId) => {
      if (settings.solo) {
        set.add(trackId)
      }
    })
    return set
  })

  // Debounce mixer settings changes to avoid too many DB writes
  const debouncedSaveSettings = useDebounce((trackId: string, settings: any) => {
    console.log('🔄 Debounced save triggered for track:', trackId, settings)
    onMixerSettingsChange?.(trackId, settings)
  }, 500)

  const handleVolumeChange = useCallback(
    (trackId: string, volume: number) => {
      // Apply both track volume and master volume
      const finalVolume = (volume / 100) * (masterVolume / 100)
      setTrackVolume(trackId, finalVolume)
      setTrackVolumes((prev) => {
        const newMap = new Map(prev)
        newMap.set(trackId, volume)
        return newMap
      })

      // Save to database (debounced)
      debouncedSaveSettings(trackId, { volume: volume / 100 })
    },
    [setTrackVolume, masterVolume, debouncedSaveSettings]
  )

  const handlePanChange = useCallback(
    (trackId: string, pan: number) => {
      // Tone.js pan: -1 to 1
      setTrackPan(trackId, pan / 100)
      setTrackPans((prev) => {
        const newMap = new Map(prev)
        newMap.set(trackId, pan)
        return newMap
      })

      // Save to database (debounced)
      debouncedSaveSettings(trackId, { pan: pan / 100 })
    },
    [setTrackPan, debouncedSaveSettings]
  )

  const handleMuteToggle = useCallback(
    (trackId: string) => {
      setTrackMutes((prev) => {
        const newMutes = new Set(prev)
        const willBeMuted = !newMutes.has(trackId)

        if (newMutes.has(trackId)) {
          newMutes.delete(trackId)
          setTrackMute(trackId, false)
        } else {
          newMutes.add(trackId)
          setTrackMute(trackId, true)
        }

        // Save to database after state update completes (defer to avoid render cycle issues)
        setTimeout(() => {
          onMixerSettingsChange?.(trackId, { mute: willBeMuted })
        }, 0)

        return newMutes
      })
    },
    [setTrackMute, onMixerSettingsChange]
  )

  const handleSoloToggle = useCallback(
    (trackId: string) => {
      setTrackSolos((prev) => {
        const newSolos = new Set(prev)
        const willBeSoloed = !newSolos.has(trackId)

        if (newSolos.has(trackId)) {
          newSolos.delete(trackId)
        } else {
          newSolos.add(trackId)
        }

        // Update mutes based on solo state
        if (newSolos.size > 0) {
          trackIds.forEach((id) => {
            if (newSolos.has(id)) {
              setTrackMute(id, masterMute ? true : false)
            } else {
              setTrackMute(id, true)
            }
          })
        } else {
          trackIds.forEach((id) => {
            setTrackMute(id, masterMute ? true : trackMutes.has(id))
          })
        }

        // Save to database after state update completes (defer to avoid render cycle issues)
        setTimeout(() => {
          onMixerSettingsChange?.(trackId, { solo: willBeSoloed })
        }, 0)

        return newSolos
      })
    },
    [trackIds, setTrackMute, trackMutes, masterMute, onMixerSettingsChange]
  )

  // Apply master volume changes to all tracks
  useEffect(() => {
    trackIds.forEach((trackId) => {
      const trackVolume = trackVolumes.get(trackId) ?? 80
      const finalVolume = (trackVolume / 100) * (masterVolume / 100)
      setTrackVolume(trackId, finalVolume)
    })
  }, [masterVolume, trackVolumes, trackIds, setTrackVolume])

  // Apply master mute to all tracks
  useEffect(() => {
    trackIds.forEach((trackId) => {
      if (masterMute) {
        setTrackMute(trackId, true)
      } else if (trackSolos.size > 0) {
        setTrackMute(trackId, !trackSolos.has(trackId))
      } else {
        setTrackMute(trackId, trackMutes.has(trackId))
      }
    })
  }, [masterMute, trackMutes, trackSolos, trackIds, setTrackMute])

  // Sync mixer state when initialSettings changes (when tracks load from DB)
  useEffect(() => {
    if (!initialSettings || initialSettings.size === 0) return

    console.log('🔄 Syncing mixer settings from database:', initialSettings)

    // Update volumes - completely rebuild from DB
    const newVolumes = new Map<string, number>()
    initialSettings.forEach((settings, trackId) => {
      if (settings.volume !== undefined) {
        newVolumes.set(trackId, settings.volume * 100)
      }
    })
    setTrackVolumes(newVolumes)

    // Update pans - completely rebuild from DB
    const newPans = new Map<string, number>()
    initialSettings.forEach((settings, trackId) => {
      if (settings.pan !== undefined) {
        newPans.set(trackId, settings.pan * 100)
      }
    })
    setTrackPans(newPans)

    // Update mutes - completely rebuild from DB
    const newMutes = new Set<string>()
    initialSettings.forEach((settings, trackId) => {
      if (settings.mute === true) {
        newMutes.add(trackId)
      }
    })
    setTrackMutes(newMutes)

    // Update solos - completely rebuild from DB
    const newSolos = new Set<string>()
    initialSettings.forEach((settings, trackId) => {
      if (settings.solo === true) {
        newSolos.add(trackId)
      }
    })
    setTrackSolos(newSolos)
  }, [initialSettings])

  return {
    trackVolumes,
    trackPans,
    trackMutes,
    trackSolos,
    handleVolumeChange,
    handlePanChange,
    handleMuteToggle,
    handleSoloToggle,
  }
}
