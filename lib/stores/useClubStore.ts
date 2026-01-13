import { create } from 'zustand'

/**
 * Club Store
 *
 * Global store for club page context and state.
 * Eliminates prop drilling of club data through components.
 */

interface Member {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  joined_at: string
}

interface ProjectWithDetails {
  id: string
  club_id: string
  name: string
  description: string | null
  cover_image_url: string | null
  status: 'active' | 'archived' | 'completed'
  created_by: string
  owner_id: string
  created_at: string
  updated_at: string
  owner_profile: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
  member_count: number
}

interface Club {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  avatar_url: string | null
  banner_url: string | null
  genre: string | null
  rules: string | null
  created_at: string
  updated_at: string
}

interface ClubState {
  // Context/Navigation
  clubId: string | null
  clubSlug: string | null
  locale: string

  // Club data
  club: Club | null
  memberCount: number

  // User session
  currentUserId: string | null
  currentUsername: string | null

  // Membership
  isMember: boolean

  // Club content (optional - kept as props for now)
  members: Member[]
  projects: ProjectWithDetails[]

  // Loading
  isLoading: boolean

  // Actions
  setClubContext: (clubId: string, clubSlug: string, locale: string) => void
  setClubData: (club: Club, memberCount: number) => void
  setUserSession: (userId: string | null, username: string | null) => void
  setIsMember: (isMember: boolean) => void
  setMembers: (members: Member[]) => void
  setProjects: (projects: ProjectWithDetails[]) => void
  setLoading: (loading: boolean) => void
  updateMemberCount: (delta: number) => void
  reset: () => void

  // Helpers
  getClubId: () => string | null
  getClubSlug: () => string | null
  getLocale: () => string
  getUserId: () => string | null
}

const initialState = {
  clubId: null,
  clubSlug: null,
  locale: 'en',
  club: null,
  memberCount: 0,
  currentUserId: null,
  currentUsername: null,
  isMember: false,
  members: [],
  projects: [],
  isLoading: false,
}

export const useClubStore = create<ClubState>((set, get) => ({
  ...initialState,

  setClubContext: (clubId, clubSlug, locale) =>
    set({ clubId, clubSlug, locale }),

  setClubData: (club, memberCount) =>
    set({ club, memberCount }),

  setUserSession: (userId, username) =>
    set({ currentUserId: userId, currentUsername: username }),

  setIsMember: (isMember) =>
    set({ isMember }),

  setMembers: (members) =>
    set({ members }),

  setProjects: (projects) =>
    set({ projects }),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  updateMemberCount: (delta) =>
    set((state) => ({ memberCount: state.memberCount + delta })),

  reset: () =>
    set(initialState),

  // Helpers
  getClubId: () => get().clubId,
  getClubSlug: () => get().clubSlug,
  getLocale: () => get().locale,
  getUserId: () => get().currentUserId,
}))
