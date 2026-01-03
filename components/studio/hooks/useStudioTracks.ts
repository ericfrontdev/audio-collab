import { useState, useCallback, useEffect } from 'react'

interface UseStudioTracksProps {
  setTrackVolume: (trackId: string, volume: number) => void
  setTrackPan: (trackId: string, pan: number) => void
  setTrackMute: (trackId: string, muted: boolean) => void
  trackIds: string[]
  masterVolume: number
  masterPan: number
  masterMute: boolean
}

export function useStudioTracks({ setTrackVolume, setTrackPan, setTrackMute, trackIds, masterVolume, masterPan, masterMute }: UseStudioTracksProps) {
  const [trackVolumes, setTrackVolumes] = useState<Map<string, number>>(new Map())
  const [trackPans, setTrackPans] = useState<Map<string, number>>(new Map())
  const [trackMutes, setTrackMutes] = useState<Set<string>>(new Set())
  const [trackSolos, setTrackSolos] = useState<Set<string>>(new Set())

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
    },
    [setTrackVolume, masterVolume]
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
    },
    [setTrackPan]
  )

  const handleMuteToggle = useCallback(
    (trackId: string) => {
      setTrackMutes((prev) => {
        const newMutes = new Set(prev)
        if (newMutes.has(trackId)) {
          newMutes.delete(trackId)
          setTrackMute(trackId, false)
        } else {
          newMutes.add(trackId)
          setTrackMute(trackId, true)
        }
        return newMutes
      })
    },
    [setTrackMute]
  )

  const handleSoloToggle = useCallback(
    (trackId: string) => {
      setTrackSolos((prev) => {
        const newSolos = new Set(prev)
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

        return newSolos
      })
    },
    [trackIds, setTrackMute, trackMutes, masterMute]
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
