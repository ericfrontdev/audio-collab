import { useState, useCallback, MutableRefObject } from 'react'
import type { WaveformDisplayRef } from '../WaveformDisplay'

export function useStudioTracks(waveformRefs: MutableRefObject<Map<string, WaveformDisplayRef>>) {
  const [trackVolumes, setTrackVolumes] = useState<Map<string, number>>(new Map())
  const [trackMutes, setTrackMutes] = useState<Set<string>>(new Set())
  const [trackSolos, setTrackSolos] = useState<Set<string>>(new Set())

  const handleVolumeChange = useCallback(
    (trackId: string, volume: number) => {
      const waveformRef = waveformRefs.current.get(trackId)
      if (waveformRef) {
        waveformRef.setVolume(volume / 100)
        setTrackVolumes((prev) => {
          const newMap = new Map(prev)
          newMap.set(trackId, volume)
          return newMap
        })
      }
    },
    [waveformRefs]
  )

  const handleMuteToggle = useCallback(
    (trackId: string) => {
      const waveformRef = waveformRefs.current.get(trackId)
      if (waveformRef) {
        setTrackMutes((prev) => {
          const newMutes = new Set(prev)
          if (newMutes.has(trackId)) {
            newMutes.delete(trackId)
            waveformRef.setMute(false)
          } else {
            newMutes.add(trackId)
            waveformRef.setMute(true)
          }
          return newMutes
        })
      }
    },
    [waveformRefs]
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
          waveformRefs.current.forEach((ref, id) => {
            if (newSolos.has(id)) {
              ref.setMute(false)
            } else {
              ref.setMute(true)
            }
          })
        } else {
          waveformRefs.current.forEach((ref, id) => {
            ref.setMute(trackMutes.has(id))
          })
        }

        return newSolos
      })
    },
    [waveformRefs, trackMutes]
  )

  return {
    trackVolumes,
    trackMutes,
    trackSolos,
    handleVolumeChange,
    handleMuteToggle,
    handleSoloToggle,
  }
}
