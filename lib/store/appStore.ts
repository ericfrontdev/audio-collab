import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light' | 'system'
type Language = 'en' | 'fr' | 'es'

interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
  createdAt: number
}

interface AppState {
  // UI State
  theme: Theme
  language: Language
  sidebarOpen: boolean
  mobileMenuOpen: boolean

  // Notifications
  notifications: Notification[]

  // Loading states
  isGlobalLoading: boolean

  // Actions - UI
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // Actions - Loading
  setGlobalLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'dark',
      language: 'fr',
      sidebarOpen: true,
      mobileMenuOpen: false,
      notifications: [],
      isGlobalLoading: false,

      // UI Actions
      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      // Notification Actions
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: Math.random().toString(36).substring(7),
              createdAt: Date.now(),
            },
          ],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // Loading Actions
      setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)

// Selector hooks for optimized re-renders
export const useTheme = () => useAppStore((state) => state.theme)
export const useLanguage = () => useAppStore((state) => state.language)
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen)
export const useMobileMenuOpen = () => useAppStore((state) => state.mobileMenuOpen)
export const useNotifications = () => useAppStore((state) => state.notifications)
export const useGlobalLoading = () => useAppStore((state) => state.isGlobalLoading)
