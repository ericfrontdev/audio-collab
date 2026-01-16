# FX Chain UI & Audio Integration

## Summary
Complete implementation of FX chain system with UI components and Tone.js audio integration. Users can now add EQ, Compressor, or Reverb effects to any mixer channel with professional-style controls inspired by Logic Pro.

## Features Implemented

### UI Components (Logic Pro Style)
- **FXKnob**: Circular knob with drag control and value display
- **FXToggle**: Colored toggle switches for enable/disable
- **FX Panels**: Three effect interfaces with custom styling
  - EQPanel: 3-band equalizer (Low, Mid, High)
  - CompressorPanel: Threshold, Ratio, Attack, Release
  - ReverbPanel: Decay time and Wet/Dry mix
- **FXZone**: Clickable area on mixer channels to add effects
- **FXSlot**: Effect rectangle with Logic Pro-style states
  - Purple when active
  - Gray when bypassed
  - Hover reveals 3 buttons (Bypass, Settings, Swap)
- **FXDropdown**: Effect selector with "No Effect" separator
- **FXModal**: Modal dialog to adjust effect parameters

### State Management
- Extended mixer store with FX settings structure
- Added FX type, bypass state, and per-effect parameters
- Three actions: `setTrackFX`, `setTrackFXType`, `setTrackFXBypassed`
- Normalized 0-1 values for all parameters

### Audio Engine (Tone.js)
- **FXChain class**: Manages EQ3, Compressor, Reverb in series
- Audio routing: `Player → FXChain → Volume → Panner → Master`
- Dynamic effect selection (only active effect is applied)
- Bypass mode makes chain transparent
- Parameter mapping:
  - EQ: 0-1 → -12dB to +12dB per band
  - Compressor: 0-1 → -60dB to 0dB threshold, 1:1 to 20:1 ratio
  - Reverb: 0-1 → 0.1s to 10s decay time
- Real-time sync from store to Tone.js in StudioView

## User Workflow

1. Click FX zone on mixer channel → Dropdown appears
2. Select "EQ", "Compressor", or "Reverb" → Effect loads (purple) + modal opens
3. Adjust knobs in modal → Changes apply in real-time
4. Close modal → Effect stays loaded and active
5. Hover over effect slot → 3 buttons appear
   - Bypass button: Toggles purple ↔ gray
   - Settings button: Reopens modal
   - Swap button: Opens dropdown to change effect or select "No Effect"

## Technical Details

**New Files:**
- `components/fx/FXKnob.tsx` - Draggable circular knob
- `components/fx/FXToggle.tsx` - Colored toggle switch
- `components/fx/FXZone.tsx` - Mixer channel FX area
- `components/fx/FXSlot.tsx` - Effect slot with hover states
- `components/fx/FXDropdown.tsx` - Effect selector
- `components/fx/FXModal.tsx` - Modal container
- `components/fx/panels/EQPanel.tsx` - EQ interface
- `components/fx/panels/CompressorPanel.tsx` - Compressor interface
- `components/fx/panels/ReverbPanel.tsx` - Reverb interface
- `lib/audio/FXChain.ts` - Tone.js FX chain manager

**Modified Files:**
- `lib/stores/useMixerStore.ts` - Added FX settings structure
- `components/studio/MixerChannel.tsx` - Integrated FXZone
- `components/studio/MixerView.tsx` - Added FX handlers
- `components/studio/StudioView.tsx` - FX sync to audio engine
- `hooks/useAudioEngine.ts` - FXChain integration

## Testing Checklist

After merge:
- [ ] Load project with audio tracks in studio
- [ ] Add EQ to a channel, adjust knobs, hear effect
- [ ] Bypass effect → should sound like dry signal
- [ ] Swap EQ for Compressor → should change effect
- [ ] Select "No Effect" → slot should disappear
- [ ] Add Reverb, adjust wet/dry, verify audio changes
- [ ] Test with playback running
- [ ] Verify FX state persists when switching tracks

## Next Steps (Week 3)

After this PR:
- Build commit history UI
- Add branch selector
- Implement waveform diff viewer

---

Branch: `feature/fx-chain-ui`
Base: `main`

🤖 Generated with Claude Sonnet 4.5
