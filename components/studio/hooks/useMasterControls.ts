/**
 * Master Controls Hook
 *
 * Manages master channel controls (volume, pan, mute).
 * Syncs changes with both store and audio engine.
 */

export interface UseMasterControlsProps {
  audioEngine: any // TODO: Type this properly
  masterMute: boolean
  setMasterVolume: (volume: number) => void
  setMasterPan: (pan: number) => void
  setMasterMute: (mute: boolean) => void
}

export interface UseMasterControlsReturn {
  handleMasterVolumeChange: (volume: number) => void
  handleMasterPanChange: (pan: number) => void
  handleMasterMuteToggle: () => void
}

export function useMasterControls({
  audioEngine,
  masterMute,
  setMasterVolume,
  setMasterPan,
  setMasterMute,
}: UseMasterControlsProps): UseMasterControlsReturn {
  /**
   * Change master volume
   * Updates both store and audio engine
   */
  const handleMasterVolumeChange = (volume: number) => {
    setMasterVolume(volume)
    audioEngine.setMasterVolume(volume)
  }

  /**
   * Change master pan
   * Updates both store and audio engine
   */
  const handleMasterPanChange = (pan: number) => {
    setMasterPan(pan)
    audioEngine.setMasterPan(pan)
  }

  /**
   * Toggle master mute
   * Updates both store and audio engine
   */
  const handleMasterMuteToggle = () => {
    const newMute = !masterMute
    setMasterMute(newMute)
    audioEngine.setMasterMute(newMute)
  }

  return {
    handleMasterVolumeChange,
    handleMasterPanChange,
    handleMasterMuteToggle,
  }
}
