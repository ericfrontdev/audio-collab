# Zustand Store Usage Guide

This application uses Zustand for global state management. The stores are organized into three main modules:

## 1. Authentication Store (`authStore.ts`)

Manages user authentication state.

### Usage:

```tsx
import { useUser, useIsAuthenticated, useAuthLoading, useAuthStore } from '@/lib/store'

function MyComponent() {
  // Use selector hooks for optimized re-renders
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useAuthLoading()

  // Access actions from the store
  const { login, logout, updateUser } = useAuthStore()

  // Example: Update user display name
  const handleUpdate = () => {
    updateUser({ display_name: 'New Name' })
  }

  return (
    <div>
      {isAuthenticated && <p>Welcome, {user?.display_name}</p>}
    </div>
  )
}
```

### Available State:
- `user`: User object with id, email, username, display_name, avatar_url, is_admin
- `isAuthenticated`: Boolean indicating login status
- `isLoading`: Boolean for loading state

### Available Actions:
- `setUser(user)`: Set the current user
- `login(user)`: Log in a user
- `logout()`: Log out the current user
- `updateUser(updates)`: Update specific user fields
- `setLoading(loading)`: Set loading state

## 2. User Profile Store (`userStore.ts`)

Caches user profiles to avoid redundant API calls.

### Usage:

```tsx
import { useUserProfile, useIsUserLoading, useUserStore } from '@/lib/store'

function UserCard({ userId }: { userId: string }) {
  // Get cached profile for a specific user
  const profile = useUserProfile(userId)
  const isLoading = useIsUserLoading(userId)

  // Access store actions
  const { setProfile, updateProfile } = useUserStore()

  if (isLoading) return <div>Loading...</div>
  if (!profile) return <div>User not found</div>

  return (
    <div>
      <h3>{profile.display_name}</h3>
      <p>@{profile.username}</p>
      <p>Followers: {profile.followers_count}</p>
    </div>
  )
}
```

### Available State:
- `profiles`: Map of user profiles by user ID
- `isLoading`: Map of loading states by user ID

### Available Actions:
- `setProfile(userId, profile)`: Cache a user profile
- `updateProfile(userId, updates)`: Update cached profile fields
- `getProfile(userId)`: Get a profile from cache
- `setLoading(userId, loading)`: Set loading state for a user
- `isProfileLoading(userId)`: Check if a profile is loading
- `clearProfiles()`: Clear all cached profiles

## 3. App Store (`appStore.ts`)

Manages app-wide settings and UI state.

### Usage:

```tsx
import {
  useTheme,
  useLanguage,
  useSidebarOpen,
  useMobileMenuOpen,
  useNotifications,
  useAppStore
} from '@/lib/store'

function Settings() {
  const theme = useTheme()
  const language = useLanguage()
  const { setTheme, setLanguage, addNotification } = useAppStore()

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme)
    addNotification({
      type: 'success',
      message: `Theme changed to ${newTheme}`,
      duration: 3000
    })
  }

  return (
    <div>
      <select value={theme} onChange={(e) => handleThemeChange(e.target.value as any)}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value="system">System</option>
      </select>
    </div>
  )
}
```

### Available State:
- `theme`: 'dark' | 'light' | 'system'
- `language`: 'en' | 'fr' | 'es'
- `sidebarOpen`: Boolean
- `mobileMenuOpen`: Boolean
- `notifications`: Array of notifications
- `isGlobalLoading`: Boolean

### Available Actions:
- `setTheme(theme)`: Set app theme
- `setLanguage(language)`: Set app language
- `toggleSidebar()`: Toggle sidebar open/closed
- `setSidebarOpen(open)`: Set sidebar state
- `toggleMobileMenu()`: Toggle mobile menu
- `setMobileMenuOpen(open)`: Set mobile menu state
- `addNotification(notification)`: Add a notification
- `removeNotification(id)`: Remove a notification
- `clearNotifications()`: Clear all notifications
- `setGlobalLoading(loading)`: Set global loading state

## Convenience Hook: `useCurrentUser`

A combined hook that provides both auth state and user profile:

```tsx
import { useCurrentUser } from '@/lib/store'

function ProfilePage() {
  const { user, profile, isAuthenticated, isLoading } = useCurrentUser()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please log in</div>

  return (
    <div>
      <h1>{user?.display_name}</h1>
      <p>Email: {user?.email}</p>
      {profile && (
        <div>
          <p>Bio: {profile.bio}</p>
          <p>Followers: {profile.followers_count}</p>
        </div>
      )}
    </div>
  )
}
```

## Persistence

The following state is automatically persisted to localStorage:

### Auth Store:
- `user`
- `isAuthenticated`

### App Store:
- `theme`
- `language`
- `sidebarOpen`

## Best Practices

1. **Use selector hooks** instead of the full store to prevent unnecessary re-renders:
   ```tsx
   // ✅ Good - only re-renders when user changes
   const user = useUser()

   // ❌ Bad - re-renders on any store change
   const { user } = useAuthStore()
   ```

2. **Access actions separately** when you don't need state:
   ```tsx
   const { logout } = useAuthStore()
   ```

3. **Cache user profiles** when fetching to avoid redundant API calls:
   ```tsx
   const { setProfile } = useUserStore()

   // After fetching from API
   const profile = await fetchUserProfile(userId)
   setProfile(userId, profile)
   ```

4. **Use notifications** for user feedback:
   ```tsx
   const { addNotification } = useAppStore()

   addNotification({
     type: 'success',
     message: 'Profile updated successfully!',
     duration: 3000
   })
   ```
