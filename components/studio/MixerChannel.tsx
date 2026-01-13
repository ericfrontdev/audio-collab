'use client'

/**
 * Mixer Channel Component
 *
 * Compact vertical mixer channel with volume fader, pan control,
 * mute/solo buttons, and VU meter visualization.
 *
 * Refactored to use modular hooks and sub-components for better maintainability.
 */

import { useFaderDrag } from '@/hooks/useFaderDrag'
import { usePanDrag } from '@/hooks/usePanDrag'
import { useTrackRename } from '@/hooks/useTrackRename'
import { useMixerChannelSortable } from '@/hooks/useMixerChannelSortable'
import {
  MixerChannelHeader,
  MixerChannelButtons,
  PanControl,
  VolumeDisplay,
  FaderSection,
} from './mixer'

interface MixerChannelProps {
  trackId: string
  trackName: string
  trackColor: string
  volume: number // 0-100
  pan: number // -100 to 100
  isMuted: boolean
  isSoloed: boolean
  isSelected: boolean
  isRenaming: boolean
  audioLevel?: number
  audioPeak?: number
  onVolumeChange: (trackId: string, volume: number) => void
  onPanChange: (trackId: string, pan: number) => void
  onMuteToggle: (trackId: string) => void
  onSoloToggle: (trackId: string) => void
  onSelect: (trackId: string) => void
  onDelete: (trackId: string, trackName: string) => void
  onImport: (trackId: string) => void
  onContextMenu: (e: React.MouseEvent, trackId: string) => void
  onRename: (trackId: string, newName: string) => void
  onCancelRename: () => void
  uploaderUsername?: string
}

export function MixerChannel({
  trackId,
  trackName,
  trackColor,
  volume,
  pan,
  isMuted,
  isSoloed,
  isSelected,
  isRenaming,
  audioLevel = 0,
  audioPeak = 0,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onSelect,
  onDelete,
  onImport,
  onContextMenu,
  onRename,
  onCancelRename,
}: MixerChannelProps) {
  // Custom hooks for stateful logic
  const fader = useFaderDrag({ volume, trackId, onVolumeChange })
  const panControl = usePanDrag({ pan, trackId, onPanChange })
  const rename = useTrackRename({
    trackId,
    trackName,
    isRenaming,
    onRename,
    onCancelRename,
  })
  const sortable = useMixerChannelSortable(trackId)

  // Event handler helpers
  const handleStopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div
      ref={sortable.sortableProps.setNodeRef}
      className={`
        relative flex flex-col h-full w-24 flex-shrink-0
        bg-zinc-950 border-r border-zinc-900
        transition-colors
        ${isSelected ? 'bg-zinc-900' : 'hover:bg-zinc-900/50'}
      `}
      onClick={() => onSelect(trackId)}
      onContextMenu={(e) => onContextMenu(e, trackId)}
      style={{
        ...sortable.style,
        borderTop: `3px solid ${trackColor}`,
      }}
    >
      {/* Track Name Header */}
      <MixerChannelHeader
        trackName={trackName}
        isRenaming={isRenaming}
        editingName={rename.editingName}
        inputRef={rename.inputRef}
        sortableProps={sortable.sortableProps}
        onEditingNameChange={rename.setEditingName}
        onKeyDown={rename.handleKeyDown}
        onBlur={rename.handleBlur}
        onDelete={() => onDelete(trackId, trackName)}
        onStopPropagation={handleStopPropagation}
      />

      {/* Import/Solo/Mute Buttons */}
      <MixerChannelButtons
        isMuted={isMuted}
        isSoloed={isSoloed}
        onImport={() => onImport(trackId)}
        onSoloToggle={() => onSoloToggle(trackId)}
        onMuteToggle={() => onMuteToggle(trackId)}
        onStopPropagation={handleStopPropagation}
      />

      {/* Pan Control */}
      <PanControl
        pan={pan}
        panRef={panControl.panRef}
        isHovering={panControl.isHovering}
        isDragging={panControl.isDragging}
        onMouseDown={panControl.handleMouseDown}
        onMouseEnter={() => panControl.setIsHovering(true)}
        onMouseLeave={() => panControl.setIsHovering(false)}
      />

      {/* Peak/Volume Display */}
      <VolumeDisplay audioPeak={audioPeak} volume={volume} />

      {/* Fader Section */}
      <FaderSection
        volume={volume}
        audioLevel={audioLevel}
        audioPeak={audioPeak}
        faderRef={fader.faderRef}
        isHovering={fader.isHovering}
        isDragging={fader.isDragging}
        onMouseDown={fader.handleMouseDown}
        onMouseEnter={() => fader.setIsHovering(true)}
        onMouseLeave={() => fader.setIsHovering(false)}
      />

      {/* Track color strip at bottom */}
      <div className="h-1 w-full" style={{ backgroundColor: trackColor }} />
    </div>
  )
}
