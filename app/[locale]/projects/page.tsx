import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layouts/AppLayout'
import { JoinProjectButton } from '@/components/projects/JoinProjectButton'
import Link from 'next/link'

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Get user's clubs
  const { data: userClubs, error: clubsError } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', user.id)

  console.log('🔍 User ID:', user.id)
  console.log('🔍 User clubs:', userClubs)
  console.log('🔍 Clubs error:', clubsError)

  const userClubIds = userClubs?.map((c) => c.club_id) || []
  console.log('🔍 User club IDs:', userClubIds)

  // Get available projects from user's clubs
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description,
      mode,
      club_id,
      owner_id,
      clubs(name, slug)
    `)
    .in('club_id', userClubIds.length > 0 ? userClubIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })

  console.log('🔍 Projects:', projects)
  console.log('🔍 Projects error:', projectsError)

  // Get user's project memberships
  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)

  const memberProjectIds = new Set(memberships?.map((m) => m.project_id) || [])

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Projects</h1>

        {!projects || projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No projects available. Join a club to see club projects!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => {
              const isMember = memberProjectIds.has(project.id)

              return (
                <div
                  key={project.id}
                  className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>

                  {project.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                    {project.clubs && (
                      <span className="text-primary">
                        {project.clubs.name}
                      </span>
                    )}
                  </div>

                  {isMember ? (
                    <Link
                      href={`/${locale}/projects/${project.id}/studio`}
                      className="block w-full px-4 py-2 bg-primary text-white rounded-md text-center font-medium hover:bg-primary/90 transition-colors"
                    >
                      Open Studio
                    </Link>
                  ) : (
                    <JoinProjectButton projectId={project.id} locale={locale} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
