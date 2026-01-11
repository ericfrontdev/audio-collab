'use client'

import { UserProfileCard } from '@/components/cards/UserProfileCard'
import { QuickActions } from '@/components/cards/QuickActions'
import { ReactNode } from 'react'
import type { Profile } from '@/types/profile'
import { useTranslations } from 'next-intl'

interface RightSidebarProps {
  profile?: Profile | null
  quickActionsProps?: {
    clubId?: string
    isMember?: boolean
  }
  showFooter?: boolean
  children?: ReactNode
}

export function RightSidebar({ profile, quickActionsProps, showFooter = false, children }: RightSidebarProps) {
  const t = useTranslations('common');
  return (
    <aside className="hidden xl:block fixed top-0 right-0 w-96 h-screen overflow-y-auto border-l border-zinc-800 p-6 space-y-6 bg-black">
      {/* User Profile Card */}
      {profile && <UserProfileCard profile={profile} />}

      {/* Quick Actions */}
      <QuickActions {...quickActionsProps} username={profile?.username} />

      {/* Custom content */}
      {children}

      {/* Footer */}
      {showFooter && (
        <footer className="flex flex-rows">
          <p className="text-xs text-gray-500 leading-relaxed">
            {t('footerText')} <br />
            {t('copyright')}
          </p>
        </footer>
      )}
    </aside>
  )
}
