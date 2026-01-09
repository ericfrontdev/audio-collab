'use client'

import { CoverImageUpload } from './CoverImageUpload'
import { EnterStudioButton } from './EnterStudioButton'
import { Users, Calendar } from 'lucide-react'

interface ProjectHallHeroProps {
  project: {
    id: string
    name?: string | null
    title?: string | null
    description?: string | null
    cover_url?: string | null
    studio_visibility?: string
    created_at: string
  }
  memberCount: number
  isMember: boolean
  locale: string
}

export function ProjectHallHero({
  project,
  memberCount,
  isMember,
  locale
}: ProjectHallHeroProps) {
  const projectTitle = project.title || project.name || 'Untitled Project'
  const studioVisibility = (project.studio_visibility || 'members_only') as 'members_only' | 'public'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Cover Image */}
      <div className="relative">
        <CoverImageUpload
          projectId={project.id}
          currentCoverUrl={project.cover_url}
          canEdit={isMember}
        />
      </div>

      {/* Project Info */}
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-4">
            {projectTitle}
          </h1>

          {project.description && (
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Created {formatDate(project.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Enter Studio Button */}
        <EnterStudioButton
          projectId={project.id}
          isMember={isMember}
          studioVisibility={studioVisibility}
          locale={locale}
        />
      </div>
    </div>
  )
}
