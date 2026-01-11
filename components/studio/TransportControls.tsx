'use client'

import { useState } from 'react'
import { Play, Square, Circle, ArrowLeft, Sliders, Upload as UploadIcon } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

interface TransportControlsProps {
  projectName: string
  isPlaying: boolean
  currentTime: number
  hasTracksLoaded: boolean
  isMixerOpen?: boolean
  onPlayPause: () => void
  onStop: () => void
  onToggleMixer?: () => void
  readOnly?: boolean
}

export function TransportControls({
  projectName,
  isPlaying,
  currentTime,
  hasTracksLoaded,
  isMixerOpen = false,
  onPlayPause,
  onStop,
  onToggleMixer,
  readOnly = false,
}: TransportControlsProps) {
  const router = useRouter()
  const t = useTranslations('studio.transport')

  const [pressedButton, setPressedButton] = useState<string | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Base button classes for grouped buttons
  const baseButtonClass = "flex items-center justify-center w-16 h-14 transition-colors border-r border-zinc-800 last:border-r-0"

  // Get button style (inline style for reliable color changes)
  const getButtonStyle = (buttonType: 'back' | 'play' | 'stop' | 'record' | 'mixer' | 'export', isActive = false) => {
    const isPressed = pressedButton === buttonType

    // Determine background color
    let backgroundColor = ''

    // Play and Mixer: purple when active OR pressed (toggle buttons)
    if (buttonType === 'play' || buttonType === 'mixer') {
      if (isActive) {
        // Active state: purple (darker when pressed)
        backgroundColor = isPressed ? '#6b46c1' : '#9363f7'
      } else if (isPressed) {
        // Not active but pressed: show purple to preview the toggle
        backgroundColor = '#6b46c1'
      } else {
        // Not active and not pressed: gray (slightly lighter)
        backgroundColor = '#828289'
      }
    }
    // Record: red when active (future)
    else if (buttonType === 'record' && isActive) {
      backgroundColor = isPressed ? '#b91c1c' : '#dc2626'
    }
    // All other cases: gray (Back, Stop, Export)
    else {
      backgroundColor = isPressed ? '#3f3f46' : '#828289'
    }

    return { backgroundColor }
  }

  // Get button-specific classes
  const getButtonClass = (buttonType: 'back' | 'play' | 'stop' | 'record' | 'mixer' | 'export') => {
    // Rounded corners
    let roundedClass = ''
    if (buttonType === 'back' || buttonType === 'play') {
      roundedClass = 'rounded-l-md'
    } else if (buttonType === 'record' || buttonType === 'export') {
      roundedClass = 'rounded-r-md'
    }

    return `${baseButtonClass} ${roundedClass}`
  }

  return (
    <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-zinc-700 bg-zinc-400">
        {/* Left: Back button */}
        <div className="flex border-2 border-zinc-800 rounded-md overflow-hidden">
          <button
            onMouseDown={() => setPressedButton('back')}
            onMouseUp={() => setPressedButton(null)}
            onMouseLeave={() => setPressedButton(null)}
            onClick={() => router.back()}
            className={getButtonClass('back')}
            style={getButtonStyle('back', false)}
            title={t('backTooltip')}
            disabled={readOnly}
          >
            <ArrowLeft className="w-5 h-5 text-zinc-200" />
          </button>
        </div>

        {/* Center: Transport Controls + LCD Display */}
        <div className="flex items-center gap-4">
        {/* Transport buttons: Play, Stop, Record */}
        <div className="flex border-2 border-zinc-800 rounded-md overflow-hidden">
          <button
            onMouseDown={() => setPressedButton('play')}
            onMouseUp={() => setPressedButton(null)}
            onMouseLeave={() => setPressedButton(null)}
            onClick={onPlayPause}
            className={getButtonClass('play')}
            style={getButtonStyle('play', isPlaying)}
            disabled={!hasTracksLoaded || readOnly}
          >
            <Play className={`w-5 h-5 ${isPlaying ? 'text-black fill-black' : 'text-zinc-200 fill-zinc-200'}`} />
          </button>

          <button
            onMouseDown={() => setPressedButton('stop')}
            onMouseUp={() => setPressedButton(null)}
            onMouseLeave={() => setPressedButton(null)}
            onClick={onStop}
            className={getButtonClass('stop')}
            style={getButtonStyle('stop', false)}
            disabled={!hasTracksLoaded || readOnly}
          >
            <Square className="w-5 h-5 text-zinc-200 fill-zinc-200" />
          </button>

          <button
            onMouseDown={() => setPressedButton('record')}
            onMouseUp={() => setPressedButton(null)}
            onMouseLeave={() => setPressedButton(null)}
            className={getButtonClass('record')}
            style={getButtonStyle('record', false)}
            disabled={true}
          >
            <Circle className="w-5 h-5 text-zinc-200 fill-zinc-200" />
          </button>
        </div>

        {/* LCD Display */}
        <div className="px-6 py-2 bg-zinc-900 rounded-md border-2 border-zinc-800 shadow-inner">
          <div className="flex flex-col items-center">
            {/* Project Title */}
            <div className="font-mono text-sm text-[#9363f7] tracking-wide truncate max-w-[280px] mb-1" style={{
              textShadow: '0 0 6px rgba(147, 99, 247, 0.5), 0 0 10px rgba(147, 99, 247, 0.3)'
            }}>
              {projectName}
            </div>
            {/* Time Display */}
            <div className="font-mono text-2xl text-[#9363f7] tracking-wider" style={{
              textShadow: '0 0 8px rgba(147, 99, 247, 0.6), 0 0 12px rgba(147, 99, 247, 0.4)'
            }}>
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Mixer + Export */}
      {!readOnly && (
        <div className="flex border-2 border-zinc-800 rounded-md overflow-hidden">
          <button
            onMouseDown={() => setPressedButton('mixer')}
            onMouseUp={() => setPressedButton(null)}
            onMouseLeave={() => setPressedButton(null)}
            onClick={onToggleMixer}
            className={getButtonClass('mixer')}
            style={getButtonStyle('mixer', isMixerOpen)}
            title={t('mixer')}
          >
            <Sliders className={`w-5 h-5 ${isMixerOpen ? 'text-black' : 'text-zinc-200'}`} />
          </button>

          <button
            onMouseDown={() => setPressedButton('export')}
            onMouseUp={() => setPressedButton(null)}
            onMouseLeave={() => setPressedButton(null)}
            className={getButtonClass('export')}
            style={getButtonStyle('export', false)}
            title={t('export')}
          >
            <UploadIcon className="w-5 h-5 text-zinc-200" />
          </button>
        </div>
      )}
    </div>
  )
}
