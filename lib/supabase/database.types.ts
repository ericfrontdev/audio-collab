export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      challenge_submissions: {
        Row: {
          challenge_id: string
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          club_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          rules: string | null
          start_date: string | null
          title: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          rules?: string | null
          start_date?: string | null
          title: string
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          rules?: string | null
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_request_votes: {
        Row: {
          created_at: string | null
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_request_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "club_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      club_requests: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          requested_by: string
          requested_genre: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          requested_by: string
          requested_genre: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          requested_by?: string
          requested_genre?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clubs: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          genre: string
          id: string
          name: string
          rules: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          genre: string
          id?: string
          name: string
          rules?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          genre?: string
          id?: string
          name?: string
          rules?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          project_id: string
          stem_id: string | null
          timestamp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          project_id: string
          stem_id?: string | null
          timestamp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string
          stem_id?: string | null
          timestamp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_stem_id_fkey"
            columns: ["stem_id"]
            isOneToOne: false
            referencedRelation: "stems"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          genres: string[] | null
          id: string
          instagram_url: string | null
          is_admin: boolean | null
          is_public: boolean | null
          musical_roles: string[] | null
          soundcloud_url: string | null
          twitter_url: string | null
          updated_at: string | null
          username: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          genres?: string[] | null
          id: string
          instagram_url?: string | null
          is_admin?: boolean | null
          is_public?: boolean | null
          musical_roles?: string[] | null
          soundcloud_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          username: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          genres?: string[] | null
          id?: string
          instagram_url?: string | null
          is_admin?: boolean | null
          is_public?: boolean | null
          musical_roles?: string[] | null
          soundcloud_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      project_files: {
        Row: {
          created_at: string | null
          duration: number | null
          file_type: string
          file_url: string
          id: string
          name: string
          project_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          file_type: string
          file_url: string
          id?: string
          name: string
          project_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          file_type?: string
          file_url?: string
          id?: string
          name?: string
          project_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          joined_at: string | null
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_mixer_settings: {
        Row: {
          created_at: string | null
          id: string
          mute: boolean | null
          pan: number | null
          solo: boolean | null
          track_id: string
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mute?: boolean | null
          pan?: number | null
          solo?: boolean | null
          track_id: string
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mute?: boolean | null
          pan?: number | null
          solo?: boolean | null
          track_id?: string
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_mixer_settings_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "project_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_mixer_settings_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "project_tracks_with_active_take"
            referencedColumns: ["id"]
          },
        ]
      }
      project_state: {
        Row: {
          id: string
          project_id: string
          state_data: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          project_id: string
          state_data: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          state_data?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          tag: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          tag: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          tag?: string
        }
        Relationships: []
      }
      project_takes: {
        Row: {
          audio_url: string
          created_at: string | null
          duration: number
          file_format: string | null
          file_size: number | null
          id: string
          is_active: boolean | null
          track_id: string
          updated_at: string | null
          waveform_data: Json | null
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          duration: number
          file_format?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          track_id: string
          updated_at?: string | null
          waveform_data?: Json | null
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          duration?: number
          file_format?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          track_id?: string
          updated_at?: string | null
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_takes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "project_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_takes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "project_tracks_with_active_take"
            referencedColumns: ["id"]
          },
        ]
      }
      project_track_comments: {
        Row: {
          created_at: string | null
          id: string
          text: string
          timestamp: number
          track_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          text: string
          timestamp: number
          track_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          text?: string
          timestamp?: number
          track_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_track_comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "project_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_track_comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "project_tracks_with_active_take"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tracks: {
        Row: {
          active_take_id: string | null
          color: string | null
          created_at: string | null
          id: string
          name: string
          order_index: number
          project_id: string
          updated_at: string | null
        }
        Insert: {
          active_take_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          order_index?: number
          project_id: string
          updated_at?: string | null
        }
        Update: {
          active_take_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_versions: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          name: string
          project_id: string
          state_data: Json
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          project_id: string
          state_data: Json
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          project_id?: string
          state_data?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          bpm: number | null
          challenge_id: string | null
          club_id: string | null
          cover_image_url: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          key: string | null
          kind: string | null
          mode: string | null
          name: string | null
          owner_id: string
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          bpm?: number | null
          challenge_id?: string | null
          club_id?: string | null
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string | null
          kind?: string | null
          mode?: string | null
          name?: string | null
          owner_id: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          bpm?: number | null
          challenge_id?: string | null
          club_id?: string | null
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string | null
          kind?: string | null
          mode?: string | null
          name?: string | null
          owner_id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      stem_settings: {
        Row: {
          created_at: string | null
          id: string
          muted: boolean | null
          pan: number | null
          solo: boolean | null
          stem_id: string
          updated_at: string | null
          version_id: string | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          muted?: boolean | null
          pan?: number | null
          solo?: boolean | null
          stem_id: string
          updated_at?: string | null
          version_id?: string | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          muted?: boolean | null
          pan?: number | null
          solo?: boolean | null
          stem_id?: string
          updated_at?: string | null
          version_id?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stem_settings_stem_id_fkey"
            columns: ["stem_id"]
            isOneToOne: false
            referencedRelation: "stems"
            referencedColumns: ["id"]
          },
        ]
      }
      stems: {
        Row: {
          audio_url: string
          color: string | null
          created_at: string | null
          duration: number | null
          id: string
          name: string
          position: number | null
          project_id: string
          updated_at: string | null
          waveform_data: Json | null
        }
        Insert: {
          audio_url: string
          color?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          name: string
          position?: number | null
          project_id: string
          updated_at?: string | null
          waveform_data?: Json | null
        }
        Update: {
          audio_url?: string
          color?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          name?: string
          position?: number | null
          project_id?: string
          updated_at?: string | null
          waveform_data?: Json | null
        }
        Relationships: []
      }
      versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          mixdown_url: string | null
          notes: string | null
          project_id: string
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mixdown_url?: string | null
          notes?: string | null
          project_id: string
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mixdown_url?: string | null
          notes?: string | null
          project_id?: string
          version_number?: number
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          locale: string | null
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locale?: string | null
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locale?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      project_tracks_with_active_take: {
        Row: {
          active_take_audio_url: string | null
          active_take_duration: number | null
          active_take_id: string | null
          active_take_waveform_data: Json | null
          color: string | null
          created_at: string | null
          id: string | null
          name: string | null
          order_index: number | null
          project_id: string | null
          take_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_club_member_count: { Args: { club_uuid: string }; Returns: number }
      get_club_request_vote_count: {
        Args: { request_uuid: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

