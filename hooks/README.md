# Audio Engine Documentation

## useAudioEngine Hook

Simple audio engine for AudioCollab using Tone.js and Zustand stores.

### Architecture

```
useAudioEngine
├── Reads from Zustand stores (tracks, playback state)
├── One Tone.js Player per track
├── Master channel (Volume + Panner)
├── VU meters via Web Audio API analysers
└── Transport controls (play/pause/stop/seek)
```

### Key Features

✅ **Simple**: One player per track, no comping complexity
✅ **Store-integrated**: Uses Zustand stores instead of prop drilling
✅ **Clean API**: Clear, focused methods
✅ **VU Meters**: Real-time audio level monitoring
✅ **Master Channel**: Unified master volume and pan control

### Usage

```typescript
import { useAudioEngine } from '@/hooks/useAudioEngine'

function StudioView() {
  const audio = useAudioEngine()

  // Load a track
  useEffect(() => {
    audio.loadTrack('track-id', 'https://audio-url.mp3', 0.8, 0)
  }, [])

  // Control playback
  <button onClick={audio.handlePlayPause}>Play/Pause</button>
  <button onClick={audio.handleStop}>Stop</button>

  // Control mixer
  <input
    type="range"
    onChange={(e) => audio.setTrackVolume('track-id', parseFloat(e.target.value))}
  />
}
```

### API Reference

#### Track Management

**`loadTrack(trackId: string, audioUrl: string, volume: number, pan: number): Promise<number>`**
- Loads audio file into Tone.js Player
- Returns: audio duration in seconds
- Volume: 0-1 (gain)
- Pan: -1 to 1

**`removeTrack(trackId: string): void`**
- Removes track and disposes Tone.js nodes
- Automatically cleans up resources

#### Mixer Controls

**`setTrackVolume(trackId: string, volume: number): void`**
- Volume: 0-1 (converted to dB internally)

**`setTrackPan(trackId: string, pan: number): void`**
- Pan: -1 (left) to 1 (right)

**`setTrackMute(trackId: string, muted: boolean): void`**
- Mutes/unmutes track player

**`setMasterVolume(volume: number): void`**
- Master volume: 0-100 (UI range, converted to 0-1 internally)

**`setMasterPan(pan: number): void`**
- Master pan: -100 to 100 (UI range, converted to -1 to 1 internally)

**`setMasterMute(muted: boolean): void`**
- Mutes/unmutes master channel

#### Transport Controls

**`handlePlayPause(): Promise<void>`**
- Toggles playback on/off
- Starts all players at current Transport position
- Automatically starts Tone.js context if suspended

**`handleStop(): void`**
- Stops playback and resets Transport to 0
- Cancels animation frame (VU meters stop)

**`handleSeek(time: number): void`**
- Seeks to specific time in seconds
- Restarts players if currently playing

### State Integration

The hook automatically integrates with Zustand stores:

**Reads from:**
- `useStudioStore` - Track list with audio URLs
- `usePlaybackStore` - isPlaying state

**Writes to:**
- `usePlaybackStore.setCurrentTime()` - Updates playhead position
- `usePlaybackStore.setTrackDuration()` - Updates duration when track loads
- `useMixerStore.setTrackLevel()` - Updates VU meter levels
- `useMixerStore.setMasterLevel()` - Updates master VU meter

### Audio Chain

```
Track Player
    ↓
Volume Node (Tone.Volume)
    ↓
Panner Node (Tone.Panner)
    ↓  ↘
Master Volume    Analyser (VU meter)
    ↓
Master Panner
    ↓
Destination (speakers)
```

### VU Meters

VU meters use Web Audio API `AnalyserNode`:
- FFT size: 512
- Smoothing: 0.8
- Updates: ~60fps via requestAnimationFrame
- Values: 0-100 (percentage)

### Performance

**Memory:**
- One Player per track (~1-5MB per track depending on duration)
- Automatic cleanup on track removal

**CPU:**
- Animation frame runs only when playing
- Analysers update at 60fps (minimal overhead)

**Latency:**
- Tone.js Transport handles sync
- Players start immediately with `"+0"` time notation

### Migration from Old Hook

**Before (useTonePlayback.ts):**
- 700+ lines
- Comping system (multi-player)
- Complex prop drilling
- Manual state management

**After (useAudioEngine.ts):**
- ~350 lines
- One player per track
- Zustand store integration
- Automatic state sync

**Migration steps:**
1. Replace `useTonePlayback()` with `useAudioEngine()`
2. Remove prop drilling (stores handle it)
3. Simplified audio loading (no comping logic)

### Known Limitations

1. **No Comping**: Only one player per track (comping removed for simplicity)
2. **Basic Master Level**: Master VU meter calculation is simplified (TODO: proper implementation)
3. **No Time Stretch/Pitch Shift**: Basic playback only

### Future Enhancements

- [ ] Proper master level calculation (RMS sum)
- [ ] Peak hold for VU meters (1 second hold)
- [ ] Fade in/out on play/stop
- [ ] Buffer preloading for instant playback
- [ ] Waveform sync callbacks

### Troubleshooting

**No audio on first play?**
- Browsers require user interaction before audio
- Hook listens for touchstart/mousedown/keydown to initialize Tone.js

**Players not syncing?**
- Check that all players are started with same Transport time
- Use `"+0"` notation for immediate start

**VU meters not updating?**
- Animation frame only runs when isPlaying = true
- Check that `isPlayingRef.current` is set correctly

**Memory leaks?**
- Ensure `removeTrack()` is called when tracks are deleted
- Hook disposes all Tone.js nodes properly
