// Export all stores
export * from './authStore'
export * from './userStore'
export * from './appStore'

// Re-export commonly used selectors for convenience
export {
  useUser,
  useIsAuthenticated,
  useAuthLoading,
} from './authStore'

export {
  useUserProfile,
  useIsUserLoading,
} from './userStore'

export {
  useTheme,
  useLanguage,
  useSidebarOpen,
  useMobileMenuOpen,
  useNotifications,
  useGlobalLoading,
} from './appStore'

// Export convenience hooks
export { useCurrentUser } from '../hooks/useCurrentUser'
