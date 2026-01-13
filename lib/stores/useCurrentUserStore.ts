import { create } from 'zustand'

/**
 * Current User Store
 *
 * Global store for currently authenticated user information.
 * Eliminates passing currentUserId and currentUserAvatar through components.
 */

interface CurrentUser {
  id: string
  username: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  locale?: string
}

interface CurrentUserState {
  // User data
  user: CurrentUser | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setUser: (user: CurrentUser | null) => void
  updateUser: (updates: Partial<CurrentUser>) => void
  clearUser: () => void
  setLoading: (loading: boolean) => void

  // Helpers
  getUserId: () => string | undefined
  getAvatarUrl: () => string | null | undefined
  getUsername: () => string | undefined
  getDisplayName: () => string | null | undefined
}

export const useCurrentUserStore = create<CurrentUserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  // Helpers
  getUserId: () => get().user?.id,
  getAvatarUrl: () => get().user?.avatarUrl,
  getUsername: () => get().user?.username,
  getDisplayName: () => get().user?.displayName,
}))
