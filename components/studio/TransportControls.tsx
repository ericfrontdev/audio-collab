'use client'

import { useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Share2, Upload as UploadIcon, ArrowLeft, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'
import { deleteProject } from '@/app/actions/projects'
import { toast } from 'react-toastify'

interface TransportControlsProps {
  isPlaying: boolean
  currentTime: number
  hasTracksLoaded: boolean
  onPlayPause: () => void
  onStop: () => void
  projectId?: string
  isOwner?: boolean
  locale?: string
}

export function TransportControls({
  isPlaying,
  currentTime,
  hasTracksLoaded,
  onPlayPause,
  onStop,
  projectId,
  isOwner,
  locale,
}: TransportControlsProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleDelete = async () => {
    if (!projectId || !locale) return

    setIsDeleting(true)
    try {
      await deleteProject(projectId, locale)
      toast.success('Projet supprimé avec succès')
    } catch (error) {
      toast.error('Erreur lors de la suppression du projet')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-2 sm:px-3 lg:px-6 py-2 sm:py-3 border-b border-zinc-800 bg-zinc-900/80">
      {/* Left: Back button + Project info */}
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 sm:gap-2 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="h-6 w-px bg-zinc-700 hidden lg:block" />
        <h1 className="text-sm lg:text-lg font-semibold text-white truncate">
          Audio Track
        </h1>
        <span className="text-xs text-gray-400 hidden lg:inline">
          Saved just now
        </span>
      </div>

      {/* Center: Transport Controls */}
      <div className="flex items-center gap-1 md:gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 hidden sm:flex"
          onClick={onStop}
          disabled={!hasTracksLoaded}
        >
          <SkipBack className="w-4 h-4 text-gray-400" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0 bg-primary hover:bg-primary/90"
          onClick={onPlayPause}
          disabled={!hasTracksLoaded}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 hidden sm:flex"
          disabled={!hasTracksLoaded}
        >
          <SkipForward className="w-4 h-4 text-gray-400" />
        </Button>

        <div className="ml-2 md:ml-4 font-mono text-white text-sm md:text-lg">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <Button variant="outline" size="sm" className="hidden lg:flex">
          <Share2 className="w-4 h-4 lg:mr-2" />
          <span className="hidden lg:inline">Share</span>
        </Button>
        <Button size="sm">
          <UploadIcon className="w-4 h-4 lg:mr-2" />
          <span className="hidden lg:inline">Export</span>
        </Button>

        {/* Settings Menu (Owner only) */}
        {isOwner && projectId && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 p-0"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowDeleteConfirm(true)
                    }}
                    className="w-full px-4 py-2 text-left text-red-500 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer le projet
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              Supprimer le projet ?
            </h3>
            <p className="text-gray-400 mb-6">
              Cette action est irréversible. Toutes les pistes, takes et données du projet seront perdues.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
