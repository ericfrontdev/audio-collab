export interface Project {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  status: 'active' | 'archived' | 'completed';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'collaborator';
  joined_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  file_url: string;
  file_type: 'audio' | 'midi' | 'sample';
  duration: number | null;
  uploaded_by: string;
  created_at: string;
}

export interface ProjectState {
  id: string;
  project_id: string;
  state_data: {
    tracks?: Array<{
      id: string;
      file_id: string;
      position: number;
      volume: number;
      muted: boolean;
      solo: boolean;
      effects?: any[];
    }>;
    bpm?: number;
    timeline_position?: number;
    [key: string]: any;
  };
  updated_by: string | null;
  updated_at: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  name: string;
  state_data: ProjectState['state_data'];
  created_by: string;
  created_at: string;
}

export interface ProjectWithDetails extends Project {
  member_count?: number;
  is_member?: boolean;
  club_name?: string;
}
