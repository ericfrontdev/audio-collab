'use client'

import { Play, Pause, SkipBack, SkipForward, Share2, Upload as UploadIcon, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'

interface TransportControlsProps {
  isPlaying: boolean
  currentTime: number
  hasTracksLoaded: boolean
  onPlayPause: () => void
  onStop: () => void
}

export function TransportControls({
  isPlaying,
  currentTime,
  hasTracksLoaded,
  onPlayPause,
  onStop,
}: TransportControlsProps) {
  const router = useRouter()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
      </div>
    </div>
  )
}
