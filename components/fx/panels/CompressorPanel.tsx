'use client'

import { FXKnob } from '../FXKnob'
import { FXToggle } from '../FXToggle'

interface CompressorSettings {
  enabled: boolean
  threshold: number
  ratio: number
  attack: number
  release: number
  makeupGain: number
}

interface CompressorPanelProps {
  settings: CompressorSettings
  onChange: (settings: CompressorSettings) => void
  gainReduction?: number // Real-time GR in dB (0 to -20)
}

export function CompressorPanel({ settings, onChange, gainReduction = 0 }: CompressorPanelProps) {
  const updateSetting = (key: keyof CompressorSettings, value: number | boolean) => {
    onChange({
      ...settings,
      [key]: value
    })
  }

  return (
    <div className="w-[320px] bg-gray-900 rounded-2xl border border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">MusicToolbox</div>
          <div className="text-2xl font-bold text-orange-400 mt-1">Compressor</div>
        </div>
      </div>

      {/* Knobs Row 1 */}
      <div className="flex justify-around mb-6">
        <FXKnob
          label="Threshold"
          value={settings.threshold}
          onChange={(v) => updateSetting('threshold', v)}
          min={-60}
          max={0}
          unit="dB"
        />
        <FXKnob
          label="Ratio"
          value={settings.ratio}
          onChange={(v) => updateSetting('ratio', v)}
          min={1}
          max={20}
          unit=":1"
        />
      </div>

      {/* Knobs Row 2 */}
      <div className="flex justify-around mb-6">
        <FXKnob
          label="Attack"
          value={settings.attack}
          onChange={(v) => updateSetting('attack', v)}
          min={0}
          max={1}
          unit="s"
        />
        <FXKnob
          label="Release"
          value={settings.release}
          onChange={(v) => updateSetting('release', v)}
          min={0}
          max={1}
          unit="s"
        />
      </div>

      {/* Makeup Gain */}
      <div className="flex justify-center mb-6">
        <FXKnob
          label="Makeup"
          value={settings.makeupGain}
          onChange={(v) => updateSetting('makeupGain', v)}
          min={0}
          max={24}
          unit="dB"
        />
      </div>

      {/* GR Meter */}
      <div className="mb-6 px-4">
        <div className="text-xs text-gray-400 uppercase tracking-wider text-center mb-2">
          Gain Reduction
        </div>
        <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          {/* GR Bar (fills from left based on compression amount) */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-75"
            style={{
              width: `${Math.min(100, Math.abs(gainReduction) * 5)}%` // -20dB = 100%
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>0 dB</span>
          <span className="font-mono">{gainReduction.toFixed(1)} dB</span>
          <span>-20 dB</span>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex justify-center pt-4 border-t border-gray-800">
        <FXToggle
          label="Enabled"
          enabled={settings.enabled}
          onChange={(v) => updateSetting('enabled', v)}
          color="orange"
        />
      </div>

      {/* Footer */}
      <div className="text-[10px] text-gray-600 text-center mt-6">
        Made in AudioCollab
      </div>
    </div>
  )
}
