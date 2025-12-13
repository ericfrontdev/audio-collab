export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clubs: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          bpm: number | null
          key: string | null
          mode: 'private' | 'public' | 'remixable'
          owner_id: string
          club_id: string | null
          parent_project_id: string | null
          mixdown_url: string | null
          waveform_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          bpm?: number | null
          key?: string | null
          mode?: 'private' | 'public' | 'remixable'
          owner_id: string
          club_id?: string | null
          parent_project_id?: string | null
          mixdown_url?: string | null
          waveform_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          bpm?: number | null
          key?: string | null
          mode?: 'private' | 'public' | 'remixable'
          owner_id?: string
          club_id?: string | null
          parent_project_id?: string | null
          mixdown_url?: string | null
          waveform_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      project_tags: {
        Row: {
          id: string
          project_id: string
          tag: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          tag: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          tag?: string
          created_at?: string
        }
      }
      stems: {
        Row: {
          id: string
          project_id: string
          name: string
          audio_url: string
          waveform_data: Json | null
          color: string
          duration: number | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          audio_url: string
          waveform_data?: Json | null
          color?: string
          duration?: number | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          audio_url?: string
          waveform_data?: Json | null
          color?: string
          duration?: number | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      stem_settings: {
        Row: {
          id: string
          stem_id: string
          version_id: string | null
          volume: number
          pan: number
          muted: boolean
          solo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          stem_id: string
          version_id?: string | null
          volume?: number
          pan?: number
          muted?: boolean
          solo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stem_id?: string
          version_id?: string | null
          volume?: number
          pan?: number
          muted?: boolean
          solo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      versions: {
        Row: {
          id: string
          project_id: string
          version_number: number
          notes: string | null
          mixdown_url: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          version_number: number
          notes?: string | null
          mixdown_url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          version_number?: number
          notes?: string | null
          mixdown_url?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          project_id: string
          stem_id: string | null
          user_id: string
          content: string
          timestamp: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          stem_id?: string | null
          user_id: string
          content: string
          timestamp?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          stem_id?: string | null
          user_id?: string
          content?: string
          timestamp?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'collaborator' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'owner' | 'collaborator' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'owner' | 'collaborator' | 'viewer'
          created_at?: string
        }
      }
      club_members: {
        Row: {
          id: string
          club_id: string
          user_id: string
          role: 'owner' | 'moderator' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          user_id: string
          role?: 'owner' | 'moderator' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          user_id?: string
          role?: 'owner' | 'moderator' | 'member'
          created_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          club_id: string | null
          title: string
          description: string | null
          rules: string | null
          start_date: string | null
          end_date: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          club_id?: string | null
          title: string
          description?: string | null
          rules?: string | null
          start_date?: string | null
          end_date?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string | null
          title?: string
          description?: string | null
          rules?: string | null
          start_date?: string | null
          end_date?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      challenge_submissions: {
        Row: {
          id: string
          challenge_id: string
          project_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          project_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          project_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
  }
}
