/**
 * Zustand Stores Export
 *
 * Centralized export for all application stores.
 * Import like: import { useStudioStore, useMixerStore } from '@/lib/stores'
 */

export { useStudioStore } from './useStudioStore'
export type {
  Track,
  TakeWithUploader,
  CommentWithProfile,
  MixerSettings,
} from './useStudioStore'

export { usePlaybackStore } from './usePlaybackStore'

export { useMixerStore } from './useMixerStore'

export { useUIStore } from './useUIStore'

export { useCurrentUserStore } from './useCurrentUserStore'
