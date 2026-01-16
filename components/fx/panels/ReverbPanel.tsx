'use client'

import { FXKnob } from '../FXKnob'
import { FXToggle } from '../FXToggle'

interface ReverbSettings {
  enabled: boolean
  decay: number
  wet: number
}

interface ReverbPanelProps {
  settings: ReverbSettings
  onChange: (settings: ReverbSettings) => void
}

export function ReverbPanel({ settings, onChange }: ReverbPanelProps) {
  const updateSetting = (key: keyof ReverbSettings, value: number | boolean) => {
    onChange({
      ...settings,
      [key]: value
    })
  }

  return (
    <div className="w-[280px] bg-gray-900 rounded-2xl border border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">MusicToolbox</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">Reverb</div>
        </div>
      </div>

      {/* Knobs */}
      <div className="flex justify-around mb-6">
        <FXKnob
          label="Decay"
          value={settings.decay}
          onChange={(v) => updateSetting('decay', v)}
          min={0.1}
          max={10}
          unit="s"
        />
        <FXKnob
          label="Wet"
          value={settings.wet}
          onChange={(v) => updateSetting('wet', v)}
          min={0}
          max={1}
          unit=""
        />
      </div>

      {/* Toggle */}
      <div className="flex justify-center pt-4 border-t border-gray-800">
        <FXToggle
          label="Enabled"
          enabled={settings.enabled}
          onChange={(v) => updateSetting('enabled', v)}
          color="purple"
        />
      </div>

      {/* Footer */}
      <div className="text-[10px] text-gray-600 text-center mt-6">
        Made in AudioCollab
      </div>
    </div>
  )
}
