import * as Tone from 'tone'
import type { FXSettings } from '../stores/useMixerStore'

/**
 * FX Chain for a track
 * Manages EQ3, Compressor, and Reverb in series
 */
export class FXChain {
  private eq3: Tone.EQ3
  private compressor: Tone.Compressor
  private compressorMakeup: Tone.Volume
  private reverb: Tone.Reverb
  private dryWet: Tone.CrossFade
  private input: Tone.Volume
  private output: Tone.Volume

  constructor() {
    // Input/Output nodes for easy connection
    this.input = new Tone.Volume(0)
    this.output = new Tone.Volume(0)

    // Create FX nodes
    this.eq3 = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0,
      lowFrequency: 400,
      highFrequency: 2500
    })

    this.compressor = new Tone.Compressor({
      threshold: -30,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
      knee: 10
    })
    this.compressorMakeup = new Tone.Volume(0)

    // Reverb with dry/wet control
    this.reverb = new Tone.Reverb({
      decay: 1.5,
      preDelay: 0.01
    })
    this.dryWet = new Tone.CrossFade(0.3) // 30% wet by default

    // Connect chain: Input → EQ → Comp → Makeup → (Dry/Reverb/Wet) → Output
    this.input.chain(this.eq3, this.compressor, this.compressorMakeup)

    // Split for reverb dry/wet
    this.compressorMakeup.connect(this.dryWet.a) // Dry signal
    this.compressorMakeup.connect(this.reverb)
    this.reverb.connect(this.dryWet.b) // Wet signal

    this.dryWet.connect(this.output)
  }

  /**
   * Connect input source (e.g., Tone.Player)
   */
  connectInput(source: Tone.ToneAudioNode) {
    source.connect(this.input)
  }

  /**
   * Connect output destination (e.g., master volume)
   */
  connectOutput(destination: Tone.ToneAudioNode) {
    this.output.connect(destination)
  }

  /**
   * Update FX settings from store
   */
  applySettings(settings: FXSettings) {
    const { type, bypassed, eq, compressor, reverb } = settings

    // If no effect or bypassed, make chain transparent
    if (type === 'none' || bypassed) {
      this.eq3.set({ low: 0, mid: 0, high: 0 })
      this.compressor.threshold.value = 0
      this.compressor.ratio.value = 1
      this.dryWet.fade.value = 0 // 100% dry
      return
    }

    // Apply EQ
    if (type === 'eq' && eq.enabled) {
      // Convert 0-1 to -12dB to +12dB
      this.eq3.low.value = (eq.low - 0.5) * 24
      this.eq3.mid.value = (eq.mid - 0.5) * 24
      this.eq3.high.value = (eq.high - 0.5) * 24
    } else {
      this.eq3.set({ low: 0, mid: 0, high: 0 })
    }

    // Apply Compressor
    if (type === 'compressor' && compressor.enabled) {
      // Convert 0-1 to -60dB to 0dB
      this.compressor.threshold.value = (compressor.threshold * 60) - 60
      // Convert 0-1 to 1:1 to 20:1
      this.compressor.ratio.value = 1 + (compressor.ratio * 19)
      this.compressor.attack.value = compressor.attack
      this.compressor.release.value = compressor.release
      // Makeup gain: 0-1 to 0dB to +24dB
      this.compressorMakeup.volume.value = compressor.makeupGain * 24
    } else {
      this.compressor.threshold.value = 0
      this.compressor.ratio.value = 1
      this.compressorMakeup.volume.value = 0
    }

    // Apply Reverb
    if (type === 'reverb' && reverb.enabled) {
      // Convert 0-1 to 0.1s to 10s
      const decayTime = 0.1 + (reverb.decay * 9.9)
      this.reverb.decay = decayTime
      this.dryWet.fade.value = reverb.wet
    } else {
      this.dryWet.fade.value = 0 // 100% dry
    }
  }

  /**
   * Get gain reduction from compressor (for metering)
   */
  getGainReduction(): number {
    return this.compressor.reduction
  }

  /**
   * Dispose all nodes
   */
  dispose() {
    this.input.dispose()
    this.output.dispose()
    this.eq3.dispose()
    this.compressor.dispose()
    this.compressorMakeup.dispose()
    this.reverb.dispose()
    this.dryWet.dispose()
  }
}
