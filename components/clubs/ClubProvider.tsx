'use client'

import { useEffect } from 'react'
import { useClubStore } from '@/lib/stores'

interface ClubProviderProps {
  clubId: string
  clubSlug: string
  locale: string
  club: any
  memberCount: number
  isMember: boolean
  currentUserId?: string
  currentUsername?: string
  children: React.ReactNode
}

/**
 * Client component that initializes the club store with server-side data.
 * Place this at the club page root after data fetching.
 */
export function ClubProvider({
  clubId,
  clubSlug,
  locale,
  club,
  memberCount,
  isMember,
  currentUserId,
  currentUsername,
  children,
}: ClubProviderProps) {
  const {
    setClubContext,
    setClubData,
    setUserSession,
    setIsMember: setMemberStatus,
    reset,
  } = useClubStore()

  useEffect(() => {
    // Initialize club context
    setClubContext(clubId, clubSlug, locale)
    setClubData(club, memberCount)
    setUserSession(currentUserId || null, currentUsername || null)
    setMemberStatus(isMember)

    // Cleanup on unmount
    return () => {
      reset()
    }
  }, [clubId, clubSlug, locale, club, memberCount, isMember, currentUserId, currentUsername])

  return <>{children}</>
}
