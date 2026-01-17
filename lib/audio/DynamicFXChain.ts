import * as Tone from 'tone'
import type { FXSlot, FXType } from '../stores/useMixerStore'

/**
 * Effect node types that can be in the chain
 */
type EffectNode = {
  type: FXType
  nodes: Tone.ToneAudioNode[]
  input: Tone.ToneAudioNode
  output: Tone.ToneAudioNode
  gainReduction?: () => number
}

/**
 * Dynamic FX Chain for a track
 * Supports up to 3 effects chained in series
 * Effects are created/destroyed on demand based on FXSlot array
 */
export class DynamicFXChain {
  private input: Tone.Volume
  private output: Tone.Volume
  private activeEffects: Map<string, EffectNode> = new Map()
  private currentChain: FXSlot[] = []

  constructor() {
    this.input = new Tone.Volume(0)
    this.output = new Tone.Volume(0)

    // Initially direct connection (no effects)
    this.input.connect(this.output)
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
   * Update the entire FX chain based on new slots
   */
  updateChain(slots: FXSlot[]) {
    // Store for comparison
    const oldSlotIds = new Set(this.currentChain.map(s => s.id))
    const newSlotIds = new Set(slots.map(s => s.id))

    // 1. Remove effects that are no longer in the chain
    for (const [slotId, effect] of this.activeEffects.entries()) {
      if (!newSlotIds.has(slotId)) {
        this.disposeEffect(effect)
        this.activeEffects.delete(slotId)
      }
    }

    // 2. Create new effects or update existing ones
    for (const slot of slots) {
      const existingEffect = this.activeEffects.get(slot.id)

      if (!existingEffect || existingEffect.type !== slot.type) {
        // Need to create new effect (either new slot or type changed)
        if (existingEffect) {
          this.disposeEffect(existingEffect)
        }
        const newEffect = this.createEffect(slot)
        this.activeEffects.set(slot.id, newEffect)
      } else {
        // Update existing effect settings
        this.applyEffectSettings(existingEffect, slot)
      }
    }

    // 3. Reconnect the signal chain
    this.reconnectChain(slots)

    // Store current chain
    this.currentChain = [...slots]
  }

  /**
   * Reconnect all effects in series based on slot order
   */
  private reconnectChain(slots: FXSlot[]) {
    if (slots.length === 0) {
      // No effects: ensure direct connection
      try {
        this.input.disconnect()
        this.input.connect(this.output)
      } catch (e) {
        // Already connected
      }
      return
    }

    // Sort by order
    const sortedSlots = [...slots].sort((a, b) => a.order - b.order)

    // Build the new chain connections
    const newConnections: Array<{ from: Tone.ToneAudioNode; to: Tone.ToneAudioNode }> = []

    let previousNode: Tone.ToneAudioNode = this.input

    for (const slot of sortedSlots) {
      const effect = this.activeEffects.get(slot.id)
      if (!effect) continue

      newConnections.push({ from: previousNode, to: effect.input })

      // If bypassed, the effect should pass through without processing
      // (individual effects handle their own bypass internally)

      previousNode = effect.output
    }

    // Connect last effect to output
    newConnections.push({ from: previousNode, to: this.output })

    // Apply all new connections atomically
    // First disconnect all
    this.input.disconnect()
    sortedSlots.forEach(slot => {
      const effect = this.activeEffects.get(slot.id)
      if (effect) {
        try {
          effect.input.disconnect()
          effect.output.disconnect()
        } catch (e) {
          // Ignore if not connected
        }
      }
    })

    // Then reconnect all
    newConnections.forEach(({ from, to }) => {
      from.connect(to)
    })
  }

  /**
   * Create an effect node based on slot type
   */
  private createEffect(slot: FXSlot): EffectNode {
    switch (slot.type) {
      case 'eq':
        return this.createEQ(slot)
      case 'compressor':
        return this.createCompressor(slot)
      case 'reverb':
        return this.createReverb(slot)
      default:
        // Fallback: passthrough
        const passthrough = new Tone.Volume(0)
        return {
          type: 'none',
          nodes: [passthrough],
          input: passthrough,
          output: passthrough,
        }
    }
  }

  /**
   * Create EQ effect
   */
  private createEQ(slot: FXSlot): EffectNode {
    const eq3 = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0,
      lowFrequency: 400,
      highFrequency: 2500,
    })

    this.applyEQSettings(eq3, slot.settings.eq)

    return {
      type: 'eq',
      nodes: [eq3],
      input: eq3,
      output: eq3,
    }
  }

  /**
   * Create Compressor effect
   */
  private createCompressor(slot: FXSlot): EffectNode {
    const compressor = new Tone.Compressor({
      threshold: -30,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
      knee: 10,
    })
    const makeup = new Tone.Volume(0)

    compressor.connect(makeup)

    this.applyCompressorSettings(compressor, makeup, slot.settings.compressor)

    return {
      type: 'compressor',
      nodes: [compressor, makeup],
      input: compressor,
      output: makeup,
      gainReduction: () => compressor.reduction,
    }
  }

  /**
   * Create Reverb effect
   */
  private createReverb(slot: FXSlot): EffectNode {
    const reverb = new Tone.Reverb({
      decay: 1.5,
      preDelay: 0.01,
    })
    const dryWet = new Tone.CrossFade(0.3)
    const inputGain = new Tone.Gain(1)

    // Setup dry/wet routing properly BEFORE generating impulse
    // Input splits to both dry (a) and reverb
    inputGain.connect(dryWet.a) // Dry signal (always works)
    inputGain.connect(reverb)   // To reverb processing
    reverb.connect(dryWet.b)    // Wet signal from reverb

    // Generate reverb impulse response asynchronously
    // Audio still passes through dry path while generating
    reverb.generate().then(() => {
      console.log('Reverb impulse response ready')
    }).catch((err) => {
      console.error('Failed to generate reverb impulse:', err)
    })

    this.applyReverbSettings(reverb, dryWet, slot.settings.reverb)

    return {
      type: 'reverb',
      nodes: [reverb, dryWet, inputGain],
      input: inputGain,
      output: dryWet,
    }
  }

  /**
   * Apply settings to existing effect
   */
  private applyEffectSettings(effect: EffectNode, slot: FXSlot) {
    switch (effect.type) {
      case 'eq':
        this.applyEQSettings(effect.nodes[0] as Tone.EQ3, slot.settings.eq)
        break
      case 'compressor':
        this.applyCompressorSettings(
          effect.nodes[0] as Tone.Compressor,
          effect.nodes[1] as Tone.Volume,
          slot.settings.compressor
        )
        break
      case 'reverb':
        this.applyReverbSettings(
          effect.nodes[0] as Tone.Reverb,
          effect.nodes[1] as Tone.CrossFade,
          slot.settings.reverb
        )
        break
    }
  }

  /**
   * Apply EQ settings
   */
  private applyEQSettings(eq: Tone.EQ3, settings: FXSlot['settings']['eq']) {
    if (!settings.enabled) {
      eq.set({ low: 0, mid: 0, high: 0 })
      return
    }

    // Convert 0-1 to -12dB to +12dB
    eq.low.value = (settings.low - 0.5) * 24
    eq.mid.value = (settings.mid - 0.5) * 24
    eq.high.value = (settings.high - 0.5) * 24
  }

  /**
   * Apply Compressor settings
   */
  private applyCompressorSettings(
    compressor: Tone.Compressor,
    makeup: Tone.Volume,
    settings: FXSlot['settings']['compressor']
  ) {
    if (!settings.enabled) {
      // Passthrough mode: high threshold, low ratio
      compressor.threshold.value = 0
      compressor.ratio.value = 1
      makeup.volume.value = 0
      return
    }

    // Convert 0-1 to -60dB to 0dB
    compressor.threshold.value = (settings.threshold * 60) - 60
    // Convert 0-1 to 1:1 to 20:1
    compressor.ratio.value = 1 + (settings.ratio * 19)
    compressor.attack.value = settings.attack
    compressor.release.value = settings.release
    // Makeup gain: 0-1 to 0dB to +24dB
    makeup.volume.value = settings.makeupGain * 24
  }

  /**
   * Apply Reverb settings
   */
  private applyReverbSettings(
    reverb: Tone.Reverb,
    dryWet: Tone.CrossFade,
    settings: FXSlot['settings']['reverb']
  ) {
    if (!settings.enabled) {
      dryWet.fade.value = 0 // 100% dry
      return
    }

    // Convert 0-1 to 0.1s to 10s
    const decayTime = 0.1 + settings.decay * 9.9
    reverb.decay = decayTime
    dryWet.fade.value = settings.wet
  }

  /**
   * Get gain reduction from first compressor in chain (for metering)
   */
  getGainReduction(): number {
    // Find first compressor in the chain
    const sortedSlots = [...this.currentChain].sort((a, b) => a.order - b.order)
    for (const slot of sortedSlots) {
      const effect = this.activeEffects.get(slot.id)
      if (effect?.type === 'compressor' && effect.gainReduction) {
        return effect.gainReduction()
      }
    }
    return 0
  }

  /**
   * Dispose a single effect
   */
  private disposeEffect(effect: EffectNode) {
    for (const node of effect.nodes) {
      node.disconnect()
      node.dispose()
    }
  }

  /**
   * Dispose all nodes
   */
  dispose() {
    // Dispose all active effects
    for (const effect of this.activeEffects.values()) {
      this.disposeEffect(effect)
    }
    this.activeEffects.clear()

    // Dispose input/output
    this.input.dispose()
    this.output.dispose()
  }
}
