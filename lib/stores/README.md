# Zustand Stores Architecture

This directory contains all Zustand stores for state management in AudioCollab.

## Store Overview

### 🎵 useStudioStore
**Purpose:** Manages project-level state and tracks data.
**Contains:**
- Project info (id, title, owner, current user)
- All tracks with takes, comments, mixer settings
- Track CRUD operations
- Take management
- Comment management

**Key Actions:**
- `setProjectInfo()` - Initialize project
- `setTracks()` - Load all tracks
- `addTrack()`, `updateTrack()`, `removeTrack()` - Track management
- `updateActiveTake()` - Switch active take
- `addTake()`, `removeTake()` - Take management
- `toggleRetakeFolder()` - UI state for retake folders

---

### ▶️ usePlaybackStore
**Purpose:** Manages audio playback state and transport controls.
**Contains:**
- Playback state (isPlaying, currentTime)
- Max duration calculation from loaded tracks
- Per-track durations

**Key Actions:**
- `setPlaying()` - Start/stop playback
- `setCurrentTime()` - Update playhead position
- `setTrackDuration()` - Update when track loads
- `getMaxDuration()` - Calculate total project duration

---

### 🎚️ useMixerStore
**Purpose:** Manages mixer state for all tracks and master channel.
**Contains:**
- Per-track mixer state (volume, pan, mute, solo)
- Master channel controls
- Audio levels for VU meters

**Key Actions:**
- `setTrackVolume()`, `setTrackPan()` - Track controls
- `setTrackMute()`, `setTrackSolo()` - Mute/solo
- `setMasterVolume()`, `setMasterPan()` - Master controls
- `setTrackLevel()`, `setMasterLevel()` - VU meter updates
- `getAllSoloedTracks()` - Get all soloed tracks
- `isSoloActive()` - Check if any track is soloed

**Note:** Mixer values are stored in UI range (0-100, -100 to 100) and converted to audio range (0-1, -1 to 1) by the audio engine.

---

### 🖥️ useUIStore
**Purpose:** Manages all UI-related state.
**Contains:**
- Track selection
- Modal states (upload, delete, comment, context menu)
- Panel states (mixer open/closed)
- Drag & drop state

**Key Actions:**
- `setSelectedTrackId()` - Select a track
- `openDeleteConfirmation()`, `closeDeleteConfirmation()` - Modals
- `openContextMenu()`, `closeContextMenu()` - Context menus
- `setMixerOpen()` - Toggle mixer panel

---

## Usage Examples

### Basic Usage

```typescript
import { useStudioStore, useMixerStore } from '@/lib/stores'

function MyComponent() {
  // Read state
  const tracks = useStudioStore((state) => state.tracks)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)

  // Get actions
  const { setTrackVolume } = useMixerStore()
  const { setPlaying } = usePlaybackStore()

  // Use actions
  const handleVolumeChange = (trackId: string, volume: number) => {
    setTrackVolume(trackId, volume)
  }

  return <div>...</div>
}
```

### Selective Subscription (Performance)

```typescript
// ❌ Bad - re-renders on ANY state change
const store = useStudioStore()

// ✅ Good - only re-renders when tracks change
const tracks = useStudioStore((state) => state.tracks)
```

### Multiple Stores

```typescript
function StudioView() {
  // Get state from multiple stores
  const tracks = useStudioStore((state) => state.tracks)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const masterVolume = useMixerStore((state) => state.masterVolume)
  const selectedTrackId = useUIStore((state) => state.selectedTrackId)

  // Get actions
  const { addTrack } = useStudioStore()
  const { setPlaying } = usePlaybackStore()
  const { setMasterVolume } = useMixerStore()
  const { setSelectedTrackId } = useUIStore()

  return <div>...</div>
}
```

---

## Architecture Principles

### 1. **Separation of Concerns**
Each store has a single, clear responsibility:
- Studio = Data
- Playback = Transport
- Mixer = Audio controls
- UI = Interface state

### 2. **No Business Logic in Stores**
Stores are pure state containers. Business logic (API calls, audio processing) belongs in hooks or actions.

### 3. **Type Safety**
All stores and actions are fully typed with TypeScript.

### 4. **Immutability**
All state updates create new objects/maps (no mutations).

### 5. **Reset Support**
Every store has a `reset()` action to clear state (useful for logout, project switch).

---

## Migration from Old Architecture

**Before (useState + prop drilling):**
```typescript
// StudioView.tsx - 100+ props
const [tracks, setTracks] = useState([])
const [isPlaying, setIsPlaying] = useState(false)
const [masterVolume, setMasterVolume] = useState(80)
// ... 50 more useState calls

// Pass everything down as props
<MixerView
  tracks={tracks}
  isPlaying={isPlaying}
  masterVolume={masterVolume}
  onVolumeChange={handleVolumeChange}
  // ... 97 more props
/>
```

**After (Zustand):**
```typescript
// StudioView.tsx - clean container
const { tracks } = useStudioStore()
const { isPlaying } = usePlaybackStore()

// No prop drilling
<MixerView />

// MixerView.tsx - gets state directly
function MixerView() {
  const tracks = useStudioStore((state) => state.tracks)
  const { setTrackVolume } = useMixerStore()

  return <div>...</div>
}
```

---

## Testing

Zustand stores can be tested independently:

```typescript
import { useStudioStore } from '@/lib/stores'

test('addTrack adds a track', () => {
  const { addTrack, tracks } = useStudioStore.getState()

  const track = { id: '1', name: 'Test Track', ... }
  addTrack(track)

  expect(useStudioStore.getState().tracks).toContain(track)
})
```

---

## Future Enhancements

- [ ] Persist store state to localStorage (for offline work)
- [ ] Undo/redo support using store history
- [ ] DevTools integration for debugging
- [ ] Store middleware for logging/analytics
