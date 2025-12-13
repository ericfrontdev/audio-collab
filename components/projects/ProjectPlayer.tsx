'use client'

import { useState, useRef, useEffect } from 'react'
import { ProjectStem, ProjectTimelineComment } from '@/lib/types/multitrack'

interface ProjectPlayerProps {
  project: any
  stems: ProjectStem[]
  timelineComments: ProjectTimelineComment[]
  canEdit: boolean
  locale: string
}

export default function ProjectPlayer({
  project,
  stems,
  timelineComments,
  canEdit,
  locale
}: ProjectPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showMixerModal, setShowMixerModal] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Calculate duration from stems (placeholder)
  useEffect(() => {
    if (stems.length > 0) {
      // This would be calculated from actual audio files
      setDuration(180) // Placeholder: 3 minutes
    }
  }, [stems])

  // Waveform visualization (placeholder)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Draw placeholder waveform
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const centerY = height / 2

    ctx.fillStyle = '#1f2937' // dark:bg-gray-800
    ctx.fillRect(0, 0, width, height)

    // Draw waveform bars
    ctx.fillStyle = '#9F7AEA' // primary color
    const barWidth = 2
    const barGap = 1
    const barCount = Math.floor(width / (barWidth + barGap))

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + barGap)
      const amplitude = Math.random() * 0.8 + 0.2
      const barHeight = (height * 0.4) * amplitude

      ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight)
    }

    // Draw timeline comments markers
    timelineComments.forEach(comment => {
      const x = (comment.time_seconds / duration) * width
      ctx.fillStyle = '#EF4444' // red
      ctx.fillRect(x - 1, 0, 2, height)
    })

    // Draw playhead
    if (duration > 0) {
      const playheadX = (currentTime / duration) * width
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height)
      ctx.stroke()
    }
  }, [currentTime, duration, timelineComments])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // Web Audio API implementation would go here
  }

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || duration === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = (x / rect.width) * duration
    setCurrentTime(newTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (stems.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No stems yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload audio stems to start creating your multitrack project
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* Player Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Audio Player
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {stems.length} {stems.length === 1 ? 'stem' : 'stems'}
            </span>
            {canEdit && (
              <button
                onClick={() => setShowMixerModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Mixer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Waveform */}
      <div className="relative bg-gray-900 dark:bg-black">
        <canvas
          ref={canvasRef}
          onClick={handleSeek}
          className="w-full h-32 cursor-pointer"
          style={{ display: 'block' }}
        />

        {/* Timeline Comments Overlay */}
        {timelineComments.map(comment => {
          const position = (comment.time_seconds / duration) * 100
          return (
            <div
              key={comment.id}
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 cursor-pointer group"
              style={{ left: `${position}%` }}
              title={comment.content}
            >
              <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {comment.content.substring(0, 50)}
                {comment.content.length > 50 && '...'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors"
          >
            {isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Time Display */}
          <div className="flex items-center space-x-2 text-sm font-mono text-gray-700 dark:text-gray-300">
            <span>{formatTime(currentTime)}</span>
            <span className="text-gray-400">/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Volume (placeholder) */}
          <div className="flex items-center space-x-2 ml-auto">
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="80"
              className="w-24 h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Mixer Modal Placeholder */}
      {showMixerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Multitrack Mixer
              </h2>
              <button
                onClick={() => setShowMixerModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                Mixer interface will be implemented with Web Audio API
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
