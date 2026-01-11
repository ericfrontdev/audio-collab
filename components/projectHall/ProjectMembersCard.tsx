'use client'

import { Users } from 'lucide-react'
import ProjectCollaborators from '@/components/projects/ProjectCollaborators'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

interface ProjectMembersCardProps {
  members: Array<{
    id: string
    project_id: string
    user_id: string
    role: string
    instrument: string | null
    added_at: string
    profiles: {
      username: string
      display_name: string | null
      avatar_url: string | null
    } | null
  }>
  isOwner: boolean
  projectId: string
}

export function ProjectMembersCard({ members, isOwner, projectId }: ProjectMembersCardProps) {
  const t = useTranslations('projectHall.members')
  const params = useParams()
  const locale = params.locale as string || 'en'

  // Format members for ProjectCollaborators component
  const formattedMembers = members.map(m => ({
    id: m.id,
    project_id: m.project_id,
    user_id: m.user_id,
    role: m.role as 'owner' | 'collaborator',
    instrument: m.instrument,
    added_at: m.added_at,
    profiles: m.profiles ? {
      display_name: m.profiles.display_name || m.profiles.username,
      avatar_url: m.profiles.avatar_url,
    } : undefined,
  }))

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-white">
          {t('title')}
          <span className="text-sm text-gray-400 font-normal ml-2">
            ({members.length})
          </span>
        </h3>
      </div>

      <ProjectCollaborators
        projectId={projectId}
        collaborators={formattedMembers}
        isOwner={isOwner}
        locale={locale}
      />
    </div>
  )
}
