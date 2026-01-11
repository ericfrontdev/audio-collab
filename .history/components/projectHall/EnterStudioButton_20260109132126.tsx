'use client'

import { Link } from '@/i18n/routing'
import { Music, Lock, Eye } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface EnterStudioButtonProps {
  projectId: string
  isMember: boolean
  studioVisibility: 'members_only' | 'public'
  locale: string
}

export function EnterStudioButton({
  projectId,
  isMember,
  studioVisibility,
  locale
}: EnterStudioButtonProps) {
  const t = useTranslations('projectHall.enterStudio')

  // Member = full access
  if (isMember) {
    return (
      <Link
        href={`/projects/${projectId}/studio`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
      >
        <Music className="w-5 h-5" />
        {t('enter')}
      </Link>
    )
  }

  // Non-member + public studio = read-only access
  if (studioVisibility === 'public') {
    return (
      <Link
        href={`/projects/${projectId}/studio`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors border border-zinc-700"
      >
        <Eye className="w-5 h-5" />
        {t('viewReadOnly')}
      </Link>
    )
  }

  // Non-member + members_only = no access
  return (
    <div className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-gray-400 font-semibold rounded-lg border border-zinc-800 cursor-not-allowed">
      <Lock className="w-5 h-5" />
      {t('private')}
      <span className="text-xs text-gray-500 ml-2">{t('privateHint')}</span>
    </div>
  )
}
