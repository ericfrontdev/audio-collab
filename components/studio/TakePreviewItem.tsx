'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckCircle, Trash2, Play, Pause } from 'lucide-react'

interface TakeWithUploader {
  id: string
  track_id: string
  audio_url: string
  duration: number
  waveform_data: number[] | null
  file_size: number | null
  file_format: string | null
  created_at: string
  updated_at: string
  uploader?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface TakePreviewItemProps {
  take: TakeWithUploader
  isActive: boolean
  canDelete: boolean
  isProcessing: boolean
  onActivate: () => void
  onDelete: () => void
  onPlayStateChange?: (takeId: string, isPlaying: boolean) => void
  shouldStopPlaying?: boolean
}

export function TakePreviewItem({
  take,
  isActive,
  canDelete,
  isProcessing,
  onActivate,
  onDelete,
  onPlayStateChange,
  shouldStopPlaying,
}: TakePreviewItemProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (shouldStopPlaying && isPlaying) {
      handleStop()
    }
  }, [shouldStopPlaying])

  useEffect(() => {
    // Create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio(take.audio_url)
      audioRef.current.addEventListener('ended', handleStop)
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener('ended', handleStop)
        audioRef.current = null
      }
    }
  }, [take.audio_url])

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    if (onPlayStateChange) {
      onPlayStateChange(take.id, false)
    }
  }

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!audioRef.current) return

    if (isPlaying) {
      handleStop()
    } else {
      // Notify parent to stop other previews
      if (onPlayStateChange) {
        onPlayStateChange(take.id, true)
      }
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Take info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {isActive && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/20 rounded text-primary text-xs font-semibold">
                <CheckCircle className="w-3 h-3" />
                Active
              </div>
            )}
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {take.file_format || 'audio'}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">
              {formatFileSize(take.file_size)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            {take.uploader?.avatar_url ? (
              <img
                src={take.uploader.avatar_url}
                alt={take.uploader.username}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-[10px] font-semibold">
                  {take.uploader?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <span className="text-sm text-white font-medium">
              Uploadé par{' '}
              {take.uploader?.display_name || take.uploader?.username || 'Inconnu'}
            </span>
          </div>

          <p className="text-xs text-gray-400">{formatDate(take.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Play/Pause button */}
          <button
            onClick={handlePlayPause}
            className={`p-2 rounded-lg transition-colors ${
              isPlaying
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-zinc-700 text-white hover:bg-zinc-600'
            }`}
            title={isPlaying ? 'Pause' : 'Écouter'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          {!isActive && (
            <>
              <button
                onClick={onActivate}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Activer
              </button>
              <button
                onClick={onDelete}
                disabled={isProcessing || !canDelete}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={
                  !canDelete
                    ? 'Impossible de supprimer la dernière take'
                    : 'Supprimer'
                }
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {isActive && (
            <span className="px-3 py-1.5 text-gray-500 text-sm italic">
              Take active
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
