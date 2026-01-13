'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TrackHeader } from './TrackHeader'
import { RetakeTrackHeader } from './RetakeTrackHeader'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useTranslations } from 'next-intl'

interface TrackWithDetails {
  id: string
  name: string
  color: string
  active_take_id?: string | null
  isRetakeFolderOpen?: boolean
  takes?: any[]
}

interface TrackHeaderListProps {
  tracks: TrackWithDetails[]
  onImport: (trackId: string) => void
  onToggleTakes: (trackId: string) => void
  onAddTrack: () => void
  onContextMenu: (e: React.MouseEvent, trackId: string) => void
  onTrackRename: (trackId: string, newName: string) => void
  onTracksReorder: (trackIds: string[]) => void
  onRetakeActivated: (trackId: string, takeId: string, isCurrentlyActive: boolean) => void
  onDeleteRetake: (trackId: string, takeId: string, retakeNumber: number) => void
  readOnly?: boolean
}

export function TrackHeaderList({
  tracks,
  onImport,
  onToggleTakes,
  onAddTrack,
  onContextMenu,
  onTrackRename,
  onTracksReorder,
  onRetakeActivated,
  onDeleteRetake,
  readOnly = false,
}: TrackHeaderListProps) {
  const t = useTranslations('studio.tracks')

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((t) => t.id === active.id)
      const newIndex = tracks.findIndex((t) => t.id === over.id)

      const newTracks = arrayMove(tracks, oldIndex, newIndex)
      onTracksReorder(newTracks.map((t) => t.id))
    }
  }
  return (
    <div className="flex flex-col w-60 flex-shrink-0 bg-zinc-900/80 border-r border-zinc-800">
      {/* Header */}
      <div className="h-10 md:h-12 px-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50">
        <h2 className="text-xs font-semibold text-white tracking-wide">{t('title')}</h2>
        <Button
          onClick={onAddTrack}
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          {t('add')}
        </Button>
      </div>

      {/* Track list - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <p className="text-sm text-zinc-500 mb-3">{t('noTracks')}</p>
              <Button onClick={onAddTrack} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('addTrack')}
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tracks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {tracks.map((track) => {
                  // OPTION A: Original always on top, retakes below
                  // Sort all takes by creation date (oldest first)
                  const allTakesSorted = [...(track.takes || [])].sort((a: any, b: any) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  )

                  // Original = first take created
                  const originalTake = allTakesSorted[0]

                  // Retakes = all other takes (regardless of active state)
                  const retakes = allTakesSorted.slice(1)
                  const isExpanded = track.isRetakeFolderOpen || false

                  // Check if original is active (for styling)
                  const isOriginalActive = originalTake ? track.active_take_id === originalTake.id : false

                  // Use track's _refreshKey if available to force re-render
                  const trackKey = `${track.id}-${(track as any)._refreshKey || 0}`

                  return (
                    <div
                      key={trackKey}
                      style={{ borderLeft: `3px solid ${track.color}` }}
                      className="relative"
                    >
                      {/* Original track header */}
                      <TrackHeader
                        trackId={track.id}
                        trackName={track.name}
                        trackColor={track.color}
                        isActive={isOriginalActive}
                        takesCount={retakes.length}
                        onImport={onImport}
                        onToggleTakes={onToggleTakes}
                        onContextMenu={onContextMenu}
                        onRename={onTrackRename}
                      />

                      {/* Retakes (if expanded) */}
                      {isExpanded && retakes.map((retake: any, idx: number) => {
                        const isRetakeActive = track.active_take_id === retake.id
                        return (
                          <RetakeTrackHeader
                            key={retake.id}
                            trackId={track.id}
                            takeId={retake.id}
                            retakeNumber={idx + 1}
                            trackName={`${track.name} - Take ${idx + 1}`}
                            trackColor={track.color}
                            isActive={isRetakeActive}
                            onImport={onImport}
                            onActivate={() => onRetakeActivated(track.id, retake.id, isRetakeActive)}
                            onDeleteRetake={(takeId) => onDeleteRetake(track.id, takeId, idx + 1)}
                            onContextMenu={onContextMenu}
                            readOnly={readOnly}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
