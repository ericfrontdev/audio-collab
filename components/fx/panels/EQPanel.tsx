'use client'

import { FXKnob } from '../FXKnob'
import { FXToggle } from '../FXToggle'

interface EQSettings {
  enabled: boolean
  low: number
  mid: number
  high: number
}

interface EQPanelProps {
  settings: EQSettings
  onChange: (settings: EQSettings) => void
}

export function EQPanel({ settings, onChange }: EQPanelProps) {
  const updateSetting = (key: keyof EQSettings, value: number | boolean) => {
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
          <div className="text-2xl font-bold text-cyan-400 mt-1">EQ</div>
        </div>
      </div>

      {/* Knobs */}
      <div className="flex justify-around mb-6">
        <FXKnob
          label="Low"
          value={settings.low}
          onChange={(v) => updateSetting('low', v)}
          min={-12}
          max={12}
          unit="dB"
        />
        <FXKnob
          label="Mid"
          value={settings.mid}
          onChange={(v) => updateSetting('mid', v)}
          min={-12}
          max={12}
          unit="dB"
        />
        <FXKnob
          label="High"
          value={settings.high}
          onChange={(v) => updateSetting('high', v)}
          min={-12}
          max={12}
          unit="dB"
        />
      </div>

      {/* Toggle */}
      <div className="flex justify-center pt-4 border-t border-gray-800">
        <FXToggle
          label="Enabled"
          enabled={settings.enabled}
          onChange={(v) => updateSetting('enabled', v)}
          color="cyan"
        />
      </div>

      {/* Footer */}
      <div className="text-[10px] text-gray-600 text-center mt-6">
        Made in AudioCollab
      </div>
    </div>
  )
}
