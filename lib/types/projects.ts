// Project kinds - clear separation between personal, club, and challenge projects
export type ProjectKind = 'personal' | 'club' | 'challenge'

export interface Project {
  id: string
  owner_id: string
  kind: ProjectKind

  title: string
  description: string | null

  // References
  club_id: string | null        // Required for club & challenge projects
  challenge_id: string | null   // Required for challenge projects only

  // Metadata
  bpm: number | null
  key: string | null
  mode: 'private' | 'public' | 'remixable'

  created_at: string
  updated_at: string
}

// Type guards
export function isPersonalProject(project: Project): boolean {
  return project.kind === 'personal' && !project.club_id && !project.challenge_id
}

export function isClubProject(project: Project): boolean {
  return project.kind === 'club' && !!project.club_id && !project.challenge_id
}

export function isChallengeProject(project: Project): boolean {
  return project.kind === 'challenge' && !!project.challenge_id
}

// Project creation helpers
export interface CreatePersonalProjectParams {
  kind: 'personal'
  title: string
  description?: string | null
  bpm?: number | null
  key?: string | null
  mode: 'private' | 'public' | 'remixable'
}

export interface CreateClubProjectParams {
  kind: 'club'
  club_id: string
  title: string
  description?: string | null
  bpm?: number | null
  key?: string | null
  mode: 'private' | 'public' | 'remixable'
}

export interface CreateChallengeProjectParams {
  kind: 'challenge'
  challenge_id: string
  club_id: string  // Inherited from challenge
  title: string
  description?: string | null
  bpm?: number | null
  key?: string | null
  mode: 'private' | 'public' | 'remixable'
}

export type CreateProjectParams =
  | CreatePersonalProjectParams
  | CreateClubProjectParams
  | CreateChallengeProjectParams
