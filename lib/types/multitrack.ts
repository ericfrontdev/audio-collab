// =====================================================
// MULTITRACK AUDIO TYPES
// Types for stems, comments, discussions, versions
// =====================================================

export interface ProjectStem {
  id: string
  project_id: string
  name: string
  file_url: string
  order_index: number

  // Mix settings
  volume: number      // 0.0 to 1.0
  pan: number         // -1.0 (left) to 1.0 (right)
  is_muted: boolean
  is_solo: boolean

  // UI
  color: string | null

  created_by: string
  created_at: string
  updated_at: string

  // Relations
  profiles?: {
    display_name: string
    avatar_url: string | null
  }
}

export interface ProjectTimelineComment {
  id: string
  project_id: string
  author_id: string
  time_seconds: number  // Position on timeline
  content: string
  created_at: string
  updated_at: string

  // Relations
  profiles?: {
    display_name: string
    avatar_url: string | null
  }
}

export interface ProjectDiscussionMessage {
  id: string
  project_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string

  // Relations
  profiles?: {
    display_name: string
    avatar_url: string | null
  }
}

export interface ProjectCollaborator {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'collaborator'
  instrument: string | null
  added_at: string

  // Relations
  profiles?: {
    display_name: string
    avatar_url: string | null
  }
}

export interface ProjectVersion {
  id: string
  project_id: string
  label: string
  notes: string | null
  mixdown_url: string | null
  created_by: string
  created_at: string

  // Relations
  profiles?: {
    display_name: string
    avatar_url: string | null
  }
}

// Extended Project type with multitrack fields
export interface MultitracProject {
  id: string
  owner_id: string
  kind: 'personal' | 'club' | 'challenge'
  title: string
  description: string | null

  // Multitrack specific
  parent_project_id: string | null
  cover_url: string | null
  mixdown_url: string | null
  status: 'in_progress' | 'finished' | 'open_collab'

  // Music metadata
  bpm: number | null
  key: string | null
  mode: 'private' | 'public' | 'remixable'

  // Relations
  club_id: string | null
  challenge_id: string | null

  created_at: string
  updated_at: string

  // Populated relations
  profiles?: {
    display_name: string
    avatar_url: string | null
  }
  project_stems?: ProjectStem[]
  project_timeline_comments?: ProjectTimelineComment[]
  project_discussion_messages?: ProjectDiscussionMessage[]
  project_collaborators?: ProjectCollaborator[]
  project_versions?: ProjectVersion[]
}

// Mixer state for Web Audio API
export interface MixerState {
  stems: Map<string, {
    gainNode: GainNode
    pannerNode: StereoPannerNode
    isMuted: boolean
    isSolo: boolean
  }>
  masterGain: GainNode
  audioContext: AudioContext | null
  isPlaying: boolean
  currentTime: number
}

// Stem creation/update payloads
export interface CreateStemPayload {
  project_id: string
  name: string
  file_url: string
  order_index?: number
  volume?: number
  pan?: number
  color?: string | null
}

export interface UpdateStemPayload {
  name?: string
  order_index?: number
  volume?: number
  pan?: number
  is_muted?: boolean
  is_solo?: boolean
  color?: string | null
}

// Timeline comment payloads
export interface CreateTimelineCommentPayload {
  project_id: string
  time_seconds: number
  content: string
}

// Discussion message payloads
export interface CreateDiscussionMessagePayload {
  project_id: string
  content: string
}

// Version payloads
export interface CreateVersionPayload {
  project_id: string
  label: string
  notes?: string | null
  mixdown_url?: string | null
}
