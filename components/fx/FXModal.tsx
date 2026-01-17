'use client'

import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { EQPanel } from './panels/EQPanel'
import { CompressorPanel } from './panels/CompressorPanel'
import { ReverbPanel } from './panels/ReverbPanel'
import type { FXType } from './FXDropdown'

interface FXSettings {
  eq: {
    enabled: boolean
    low: number
    mid: number
    high: number
  }
  compressor: {
    enabled: boolean
    threshold: number
    ratio: number
    attack: number
    release: number
    makeupGain: number
  }
  reverb: {
    enabled: boolean
    decay: number
    wet: number
  }
}

interface FXModalProps {
  isOpen: boolean
  onClose: () => void
  effectType: FXType
  settings: FXSettings
  onSettingsChange: (settings: FXSettings) => void
}

export function FXModal({
  isOpen,
  onClose,
  effectType,
  settings,
  onSettingsChange
}: FXModalProps) {
  if (!isOpen || effectType === 'none') return null

  const renderPanel = () => {
    switch (effectType) {
      case 'eq':
        return (
          <EQPanel
            settings={settings.eq}
            onChange={(newSettings) =>
              onSettingsChange({ ...settings, eq: newSettings })
            }
          />
        )
      case 'compressor':
        return (
          <CompressorPanel
            settings={settings.compressor}
            onChange={(newSettings) =>
              onSettingsChange({ ...settings, compressor: newSettings })
            }
          />
        )
      case 'reverb':
        return (
          <ReverbPanel
            settings={settings.reverb}
            onChange={(newSettings) =>
              onSettingsChange({ ...settings, reverb: newSettings })
            }
          />
        )
      default:
        return null
    }
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative pointer-events-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="
            absolute -top-3 -right-3 z-10
            w-8 h-8 rounded-full bg-gray-800 border border-gray-700
            flex items-center justify-center
            hover:bg-gray-700 transition-colors
          "
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Panel */}
        {renderPanel()}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
