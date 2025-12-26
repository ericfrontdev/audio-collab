'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'
import { useUserStore } from '@/lib/store/userStore'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  role?: string
  followers_count?: number
  following_count?: number
  projects_count?: number
  created_at?: string
  bio?: string | null
}

interface AuthProviderProps {
  children: React.ReactNode
  initialUser: SupabaseUser | null
  initialProfile: Profile | null
}

export function AuthProvider({ children, initialUser, initialProfile }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)
  const logout = useAuthStore((state) => state.logout)
  const setProfile = useUserStore((state) => state.setProfile)

  useEffect(() => {
    // Initialize auth store with server-side data
    if (initialUser && initialProfile) {
      setUser({
        id: initialUser.id,
        email: initialUser.email!,
        username: initialProfile.username,
        display_name: initialProfile.display_name,
        avatar_url: initialProfile.avatar_url,
        is_admin: initialProfile.role === 'admin',
      })

      // Also set the user profile in the userStore cache
      setProfile(initialUser.id, {
        id: initialProfile.id,
        username: initialProfile.username,
        display_name: initialProfile.display_name,
        avatar_url: initialProfile.avatar_url,
        bio: initialProfile.bio || null,
        followers_count: initialProfile.followers_count || 0,
        following_count: initialProfile.following_count || 0,
        projects_count: initialProfile.projects_count || 0,
        created_at: initialProfile.created_at || new Date().toISOString(),
      })
    } else {
      setUser(null)
    }

    // Set up Supabase auth state listener
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch user profile when signed in
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            is_admin: profile.role === 'admin',
          })

          setProfile(session.user.id, {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio || null,
            followers_count: profile.followers_count || 0,
            following_count: profile.following_count || 0,
            projects_count: profile.projects_count || 0,
            created_at: profile.created_at || new Date().toISOString(),
          })
        }
      } else if (event === 'SIGNED_OUT') {
        logout()
      } else if (event === 'USER_UPDATED' && session?.user) {
        // Refetch profile on user update
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            is_admin: profile.role === 'admin',
          })

          setProfile(session.user.id, {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio || null,
            followers_count: profile.followers_count || 0,
            following_count: profile.following_count || 0,
            projects_count: profile.projects_count || 0,
            created_at: profile.created_at || new Date().toISOString(),
          })
        }
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialUser, initialProfile, setUser, setLoading, logout, setProfile])

  return <>{children}</>
}
