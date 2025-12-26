import { useUser, useIsAuthenticated, useAuthLoading, useUserProfile } from '@/lib/store'

/**
 * Convenience hook to get the current user with their profile data
 *
 * @returns Object containing:
 * - user: The authenticated user object (with id, email, username, display_name, avatar_url, is_admin)
 * - profile: The full user profile from the userStore cache
 * - isAuthenticated: Boolean indicating if user is logged in
 * - isLoading: Boolean indicating if auth state is loading
 */
export function useCurrentUser() {
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useAuthLoading()
  const profile = useUserProfile(user?.id || '')

  return {
    user,
    profile,
    isAuthenticated,
    isLoading,
  }
}
