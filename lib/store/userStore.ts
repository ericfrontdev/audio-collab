import { create } from 'zustand'

interface UserProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  followers_count: number
  following_count: number
  projects_count: number
  created_at: string
}

interface UserState {
  profiles: Map<string, UserProfile>
  isLoading: Map<string, boolean>

  // Actions
  setProfile: (userId: string, profile: UserProfile) => void
  updateProfile: (userId: string, updates: Partial<UserProfile>) => void
  getProfile: (userId: string) => UserProfile | undefined
  setLoading: (userId: string, loading: boolean) => void
  isProfileLoading: (userId: string) => boolean
  clearProfiles: () => void
}

export const useUserStore = create<UserState>((set, get) => ({
  profiles: new Map(),
  isLoading: new Map(),

  setProfile: (userId, profile) =>
    set((state) => ({
      profiles: new Map(state.profiles).set(userId, profile),
    })),

  updateProfile: (userId, updates) =>
    set((state) => {
      const currentProfile = state.profiles.get(userId)
      if (!currentProfile) return state

      const newProfiles = new Map(state.profiles)
      newProfiles.set(userId, { ...currentProfile, ...updates })
      return { profiles: newProfiles }
    }),

  getProfile: (userId) => get().profiles.get(userId),

  setLoading: (userId, loading) =>
    set((state) => ({
      isLoading: new Map(state.isLoading).set(userId, loading),
    })),

  isProfileLoading: (userId) => get().isLoading.get(userId) || false,

  clearProfiles: () =>
    set({
      profiles: new Map(),
      isLoading: new Map(),
    }),
}))

// Selector hooks
export const useUserProfile = (userId: string) =>
  useUserStore((state) => state.profiles.get(userId))

export const useIsUserLoading = (userId: string) =>
  useUserStore((state) => state.isLoading.get(userId) || false)
