'use client'

import { useEffect } from 'react'
import { useCurrentUserStore } from '@/lib/stores'

interface CurrentUserProviderProps {
  userId?: string
  username?: string
  email?: string
  displayName?: string | null
  avatarUrl?: string | null
  locale?: string
  children: React.ReactNode
}

/**
 * Provider that initializes the current user store with server-side data.
 * Place this at the app root after authentication check.
 */
export function CurrentUserProvider({
  userId,
  username,
  email,
  displayName,
  avatarUrl,
  locale,
  children,
}: CurrentUserProviderProps) {
  const { setUser, clearUser } = useCurrentUserStore()

  useEffect(() => {
    if (userId && username && email) {
      setUser({
        id: userId,
        username,
        email,
        displayName: displayName || null,
        avatarUrl: avatarUrl || null,
        locale,
      })
    } else {
      clearUser()
    }
  }, [userId, username, email, displayName, avatarUrl, locale, setUser, clearUser])

  return <>{children}</>
}
