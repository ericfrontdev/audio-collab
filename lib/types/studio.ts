// ============================================================================
// Project Studio TypeScript Types
// ============================================================================

/**
 * Database table types matching the Supabase schema
 */

export interface ProjectTrack {
  id: string;
  project_id: string;
  name: string;
  color: string; // Hex color like '#3B82F6'
  order_index: number;
  active_take_id: string | null;
  created_by: string; // User ID of the track creator
  is_collaborative: boolean; // If true, other club members can upload takes
  created_at: string;
  updated_at: string;
}

export interface ProjectTake {
  id: string;
  track_id: string;
  audio_url: string;
  duration: number; // Duration in seconds
  waveform_data: number[] | null; // Array of peaks for visualization
  file_size: number | null;
  file_format: string | null; // e.g., 'mp3', 'wav', 'flac'
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectTrackComment {
  id: string;
  track_id: string;
  user_id: string;
  timestamp: number; // Position in seconds
  text: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMixerSettings {
  id: string;
  track_id: string;
  volume: number; // 0.0 to 1.0
  pan: number; // -1.0 (left) to 1.0 (right)
  solo: boolean;
  mute: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Extended types with related data (for UI components)
 */

export interface ProjectTrackWithDetails extends ProjectTrack {
  active_take?: ProjectTake | null;
  takes: ProjectTake[];
  comments: ProjectTrackComment[];
  mixer_settings: ProjectMixerSettings;
  take_count: number;
}

export interface ProjectTrackCommentWithProfile extends ProjectTrackComment {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Form data types (for creating/updating)
 */

export interface CreateTrackData {
  project_id: string;
  name: string;
  color?: string;
  order_index?: number;
}

export interface UploadTakeData {
  track_id: string;
  audio_file: File;
}

export interface CreateCommentData {
  track_id: string;
  timestamp: number;
  text: string;
}

export interface UpdateMixerSettingsData {
  volume?: number;
  pan?: number;
  solo?: boolean;
  mute?: boolean;
}

/**
 * Audio engine types
 */

export interface AudioEngineTrack {
  track_id: string;
  audio_buffer: AudioBuffer | null;
  source_node: AudioBufferSourceNode | null;
  gain_node: GainNode;
  pan_node: StereoPannerNode;
  analyser_node: AnalyserNode;
  is_playing: boolean;
  start_time: number;
}

export interface AudioEngineState {
  context: AudioContext | null;
  tracks: Map<string, AudioEngineTrack>;
  is_playing: boolean;
  current_time: number;
  duration: number;
}

/**
 * WaveSurfer types
 */

export interface WaveSurferMarker {
  id: string;
  time: number;
  label?: string;
  color?: string;
  position?: 'top' | 'bottom';
}

/**
 * Upload progress types
 */

export interface UploadProgress {
  track_id: string;
  file_name: string;
  progress: number; // 0 to 100
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

/**
 * Export types
 */

export interface ExportOptions {
  type: 'stems' | 'rough-mix';
  format?: 'mp3' | 'wav';
  quality?: 'high' | 'medium' | 'low';
}

export interface ExportProgress {
  status: 'preparing' | 'processing' | 'downloading' | 'complete' | 'error';
  progress: number; // 0 to 100
  message?: string;
  error?: string;
}

/**
 * Studio UI state types
 */

export interface StudioUIState {
  selected_track_id: string | null;
  is_mixer_open: boolean;
  is_comments_sidebar_open: boolean;
  is_upload_modal_open: boolean;
  zoom_level: number; // 1.0 = 100%
  playback_rate: number; // 1.0 = normal speed
}

/**
 * Utility types
 */

export type TrackColor =
  | '#3B82F6' // Blue
  | '#10B981' // Green
  | '#F59E0B' // Amber
  | '#EF4444' // Red
  | '#8B5CF6' // Purple
  | '#EC4899' // Pink
  | '#14B8A6' // Teal
  | '#F97316'; // Orange

export const TRACK_COLORS: TrackColor[] = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

/**
 * Constants
 */

export const AUDIO_CONSTRAINTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB (direct upload to Supabase Storage, no Netlify limit)
  SUPPORTED_FORMATS: ['audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/mp4', 'audio/m4a', 'audio/ogg'],
  MAX_TRACKS: 50,
  MAX_TAKES_PER_TRACK: 20,
  MAX_COMMENT_LENGTH: 1000,
} as const;

export const MIXER_DEFAULTS = {
  VOLUME: 0.8,
  PAN: 0.0,
  SOLO: false,
  MUTE: false,
} as const;

/**
 * Type guards
 */

export function isAudioFile(file: File): boolean {
  return AUDIO_CONSTRAINTS.SUPPORTED_FORMATS.includes(file.type as typeof AUDIO_CONSTRAINTS.SUPPORTED_FORMATS[number]);
}

export function isFileSizeValid(file: File): boolean {
  return file.size <= AUDIO_CONSTRAINTS.MAX_FILE_SIZE;
}

export function isValidVolume(volume: number): boolean {
  return volume >= 0 && volume <= 1;
}

export function isValidPan(pan: number): boolean {
  return pan >= -1 && pan <= 1;
}

export function isValidTimestamp(timestamp: number, duration: number): boolean {
  return timestamp >= 0 && timestamp <= duration;
}
