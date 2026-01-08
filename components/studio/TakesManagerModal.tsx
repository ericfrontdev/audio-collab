'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { setActiveTake, deleteTake, uploadTake } from '@/app/actions/studio/takes'
import { toast } from 'react-toastify'
import { TakePreviewItem } from './TakePreviewItem'

interface TakeWithUploader {
  id: string
  track_id: string
  audio_url: string
  duration: number
  waveform_data: number[] | null
  file_size: number | null
  file_format: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  uploader?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface TrackWithTakes {
  id: string
  name: string
  color: string
  created_by: string
  is_collaborative: boolean
  takes?: TakeWithUploader[]
}

interface TakesManagerModalProps {
  isOpen: boolean
  onClose: () => void
  track: TrackWithTakes
  onTakeActivated: () => void
  currentUserId?: string
}

export function TakesManagerModal({
  isOpen,
  onClose,
  track,
  onTakeActivated,
  currentUserId,
}: TakesManagerModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const [playingTakeId, setPlayingTakeId] = useState<string | null>(null)

  if (!isOpen) return null

  const takes = track.takes || []
  const activeTake = takes.find(t => t.is_active)
  const isTrackCreator = currentUserId === track.created_by
  const canUpload = isTrackCreator || track.is_collaborative

  const handlePlayStateChange = (takeId: string, isPlaying: boolean) => {
    if (isPlaying) {
      // When a take starts playing, set it as the playing take
      setPlayingTakeId(takeId)
    } else {
      // When a take stops, clear the playing take if it was this one
      setPlayingTakeId(prev => prev === takeId ? null : prev)
    }
  }

  const handleActivateTake = async (takeId: string) => {
    if (activeTake?.id === takeId) return // Already active

    setIsProcessing(true)
    const result = await setActiveTake(takeId)
    setIsProcessing(false)

    if (result.success) {
      toast.success('Take activée avec succès')
      onTakeActivated()
      onClose()
    } else {
      toast.error(result.error || 'Erreur lors de l\'activation')
    }
  }

  const handleDeleteTake = async (takeId: string) => {
    if (activeTake?.id === takeId) {
      toast.error('Impossible de supprimer la take active')
      return
    }

    if (takes.length <= 1) {
      toast.error('Impossible de supprimer la dernière take')
      return
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette take ?')) {
      return
    }

    setIsProcessing(true)
    const result = await deleteTake(takeId)
    setIsProcessing(false)

    if (result.success) {
      toast.success('Take supprimée avec succès')
      onTakeActivated() // Refresh the data
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
  }

  const handleUploadClick = () => {
    if (!canUpload) {
      if (!isTrackCreator && !track.is_collaborative) {
        toast.error('Seul le créateur de la piste peut ajouter des takes')
      }
      return
    }
  }

  const handleUploadTake = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check permissions
    if (!canUpload) {
      if (!isTrackCreator && !track.is_collaborative) {
        toast.error('Seul le créateur de la piste peut ajouter des takes')
      }
      e.target.value = ''
      return
    }

    // Validate file type
    const supportedFormats = ['audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/mp4', 'audio/m4a', 'audio/ogg']
    if (!supportedFormats.includes(file.type)) {
      toast.error('Format de fichier non supporté. Utilisez MP3, WAV, FLAC, M4A ou OGG.')
      e.target.value = ''
      return
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      toast.error('Fichier trop volumineux. Taille maximum: 100MB')
      e.target.value = ''
      return
    }

    setUploadingFile(file.name)
    const formData = new FormData()
    formData.append('audio', file)

    const result = await uploadTake(track.id, formData)
    setUploadingFile(null)

    if (result.success) {
      toast.success('Nouvelle take uploadée avec succès')
      onTakeActivated() // Refresh the data
      // Note: The new take becomes automatically active (DB trigger)
      onClose()
    } else {
      toast.error(result.error || 'Erreur lors de l\'upload')
    }

    // Reset the file input
    e.target.value = ''
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: track.color }}
            />
            <div>
              <h2 className="text-xl font-semibold text-white">
                Gérer les takes
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {track.name} • {takes.length} {takes.length === 1 ? 'take' : 'takes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {uploadingFile && (
            <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-white text-sm">
                Upload en cours: <span className="font-semibold">{uploadingFile}</span>
              </p>
              <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-full" />
              </div>
            </div>
          )}

          {takes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucune take disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {takes.map((take) => {
                const isActive = take.id === activeTake?.id
                const shouldStopPlaying = playingTakeId !== null && playingTakeId !== take.id

                return (
                  <TakePreviewItem
                    key={take.id}
                    take={take}
                    isActive={isActive}
                    canDelete={takes.length > 1}
                    isProcessing={isProcessing}
                    onActivate={() => handleActivateTake(take.id)}
                    onDelete={() => handleDeleteTake(take.id)}
                    onPlayStateChange={handlePlayStateChange}
                    shouldStopPlaying={shouldStopPlaying}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Fermer
          </button>
          {canUpload ? (
            <label className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle take
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleUploadTake}
                disabled={uploadingFile !== null}
              />
            </label>
          ) : (
            <button
              onClick={handleUploadClick}
              className="px-4 py-2 bg-zinc-800 text-gray-400 rounded-lg cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle take
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
