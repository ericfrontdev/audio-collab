import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { deleteProject } from '@/app/actions/projects'
import ProjectHeader from '@/components/projects/ProjectHeader'
import ProjectPlayer from '@/components/projects/ProjectPlayer'
import ProjectStemsList from '@/components/projects/ProjectStemsList'
import ProjectTimelineComments from '@/components/projects/ProjectTimelineComments'
import ProjectDiscussion from '@/components/projects/ProjectDiscussion'
import ProjectCollaborators from '@/components/projects/ProjectCollaborators'
import ProjectVersions from '@/components/projects/ProjectVersions'

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { locale, id } = await params
  const { tab = 'overview' } = await searchParams
  const supabase = await createClient()
  const t = await getTranslations('projects.details')

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Fetch complete project with all multitrack data
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:owner_id (
        display_name,
        avatar_url
      ),
      project_tags (
        tag
      )
    `)
    .eq('id', id)
    .single()

  if (error || !project) {
    notFound()
  }

  // Check if user is owner or collaborator
  const { data: collaborator } = await supabase
    .from('project_collaborators')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .single()

  const isOwner = project.owner_id === user.id
  const isCollaborator = !!collaborator
  const canEdit = isOwner || (isCollaborator && collaborator.role === 'collaborator')

  // Fetch stems
  const { data: stems } = await supabase
    .from('project_stems')
    .select(`
      *,
      profiles:created_by (
        display_name,
        avatar_url
      )
    `)
    .eq('project_id', id)
    .order('order_index', { ascending: true })

  // Fetch timeline comments
  const { data: timelineComments } = await supabase
    .from('project_timeline_comments')
    .select(`
      *,
      profiles:author_id (
        display_name,
        avatar_url
      )
    `)
    .eq('project_id', id)
    .order('time_seconds', { ascending: true })

  // Fetch discussion messages
  const { data: discussionMessages } = await supabase
    .from('project_discussion_messages')
    .select(`
      *,
      profiles:author_id (
        display_name,
        avatar_url
      )
    `)
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  // Fetch collaborators
  const { data: collaborators } = await supabase
    .from('project_collaborators')
    .select(`
      *,
      profiles:user_id (
        display_name,
        avatar_url
      )
    `)
    .eq('project_id', id)
    .order('added_at', { ascending: true })

  // Fetch versions
  const { data: versions } = await supabase
    .from('project_versions')
    .select(`
      *,
      profiles:created_by (
        display_name,
        avatar_url
      )
    `)
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Project Header */}
      <ProjectHeader
        project={project}
        isOwner={isOwner}
        canEdit={canEdit}
        locale={locale}
      />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Player + Stems */}
          <div className="lg:col-span-2 space-y-6">
            {/* Audio Player with Waveform */}
            <ProjectPlayer
              project={project}
              stems={stems || []}
              timelineComments={timelineComments || []}
              canEdit={canEdit}
              locale={locale}
            />

            {/* Stems List */}
            <ProjectStemsList
              projectId={id}
              stems={stems || []}
              canEdit={canEdit}
              locale={locale}
            />

            {/* Timeline Comments */}
            {tab === 'comments' && (
              <ProjectTimelineComments
                projectId={id}
                comments={timelineComments || []}
                canComment={canEdit || project.mode === 'public' || project.mode === 'remixable'}
                locale={locale}
              />
            )}

            {/* Versions */}
            {tab === 'versions' && (
              <ProjectVersions
                projectId={id}
                versions={versions || []}
                canCreateVersion={canEdit}
                locale={locale}
              />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <nav className="space-y-1">
                <Link
                  href={`/${locale}/projects/${id}`}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    !tab || tab === 'overview'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href={`/${locale}/projects/${id}?tab=discussion`}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    tab === 'discussion'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Discussion
                </Link>
                <Link
                  href={`/${locale}/projects/${id}?tab=comments`}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    tab === 'comments'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Timeline Comments
                </Link>
                <Link
                  href={`/${locale}/projects/${id}?tab=versions`}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    tab === 'versions'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Versions
                </Link>
              </nav>
            </div>

            {/* Collaborators */}
            <ProjectCollaborators
              projectId={id}
              collaborators={collaborators || []}
              isOwner={isOwner}
              locale={locale}
            />

            {/* Project Info */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Project Info
              </h3>
              <dl className="space-y-2 text-sm">
                {project.bpm && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">BPM</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">{project.bpm}</dd>
                  </div>
                )}
                {project.key && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Key</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">{project.key}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="text-gray-900 dark:text-white font-medium capitalize">
                    {project.status?.replace('_', ' ') || 'In Progress'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Visibility</dt>
                  <dd className="text-gray-900 dark:text-white font-medium capitalize">
                    {project.mode}
                  </dd>
                </div>
              </dl>

              {project.project_tags && project.project_tags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.project_tags.map((tag: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary"
                      >
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Discussion */}
            {tab === 'discussion' && (
              <ProjectDiscussion
                projectId={id}
                messages={discussionMessages || []}
                canPost={canEdit || project.mode === 'public' || project.mode === 'remixable'}
                currentUserId={user.id}
                locale={locale}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
