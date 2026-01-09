'use client'

import { ProjectHallHero } from './ProjectHallHero'
import { ProjectInfoCard } from './ProjectInfoCard'
import { ProjectMembersCard } from './ProjectMembersCard'
import { ProjectTimelineCard } from './ProjectTimelineCard'
import { ProjectHallFeed } from './ProjectHallFeed'
import { JoinProjectButton } from '@/components/projects/JoinProjectButton'

interface ProjectHallViewProps {
  project: {
    id: string
    name?: string | null
    title?: string | null
    description?: string | null
    cover_url?: string | null
    studio_visibility?: string
    bpm?: number | null
    key?: string | null
    mode?: string
    status?: string
    created_at: string
    updated_at: string
    owner_id: string
  }
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
  hallPosts: Array<{
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: {
      username: string
      display_name: string | null
      avatar_url: string | null
    } | null
  }>
  currentUserId?: string
  isAuthenticated: boolean
  isMember: boolean
  versionCount?: number
  locale: string
}

export function ProjectHallView({
  project,
  members,
  hallPosts,
  currentUserId,
  isAuthenticated,
  isMember,
  versionCount = 0,
  locale
}: ProjectHallViewProps) {
  const isOwner = currentUserId === project.owner_id

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <ProjectHallHero
            project={project}
            memberCount={members.length}
            isMember={isMember}
            locale={locale}
          />
        </div>

        {/* Join Button (for non-members) */}
        {!isMember && isAuthenticated && (
          <div className="mb-8 flex justify-center">
            <JoinProjectButton projectId={project.id} locale={locale} />
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <ProjectInfoCard project={project} />
            <ProjectMembersCard
              members={members}
              isOwner={isOwner}
              projectId={project.id}
            />
            <ProjectTimelineCard
              project={project}
              versionCount={versionCount}
            />
          </div>

          {/* Right Column - Discussion Feed */}
          <div className="lg:col-span-2">
            <ProjectHallFeed
              projectId={project.id}
              initialPosts={hallPosts}
              currentUserId={currentUserId}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
