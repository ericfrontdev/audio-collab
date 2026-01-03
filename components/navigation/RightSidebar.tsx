'use client'

import { UserProfileCard } from '@/components/cards/UserProfileCard'
import { QuickActions } from '@/components/cards/QuickActions'
import { ReactNode } from 'react'

interface RightSidebarProps {
  profile?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
  } | null
  quickActionsProps?: {
    clubId?: string
    isMember?: boolean
  }
  showFooter?: boolean
  children?: ReactNode
}

export function RightSidebar({ profile, quickActionsProps, showFooter = false, children }: RightSidebarProps) {
  return (
    <aside className="hidden xl:block fixed top-0 right-0 w-96 h-screen overflow-y-auto border-l border-zinc-800 p-6 space-y-6 bg-black">
      {/* User Profile Card */}
      {profile && <UserProfileCard profile={profile} />}

      {/* Quick Actions */}
      <QuickActions {...quickActionsProps} />

      {/* Custom content */}
      {children}

      {/* Footer */}
      {showFooter && (
        <footer className="flex flex-rows">
          <p className="text-xs text-gray-500 leading-relaxed">
            Made by indie musicians for indie musicians <br />
            &copy; 2026 AudioCollab
          </p>
        </footer>
      )}
    </aside>
  )
}
