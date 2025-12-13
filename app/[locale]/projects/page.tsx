import { createClient } from '@/lib/supabase/server'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const t = await getTranslations('projects')

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Fetch user's personal projects only
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:owner_id (
        display_name
      ),
      project_tags (
        tag
      )
    `)
    .eq('kind', 'personal')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch user's challenge participations
  const { data: challengeProjects } = await supabase
    .from('projects')
    .select(`
      *,
      club_challenges:challenge_id (
        id,
        title,
        status,
        club_id,
        clubs:club_id (
          name,
          slug
        )
      )
    `)
    .eq('kind', 'challenge')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('myProjects')}
            </h1>
          </div>
          <Link
            href={`/${locale}/projects/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {t('newProject')}
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
            {error.message}
          </div>
        )}

        {projects && projects.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('noProjects')}
            </h3>
            <div className="mt-6">
              <Link
                href={`/${locale}/projects/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {t('newProject')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => (
              <Link
                key={project.id}
                href={`/${locale}/projects/${project.id}`}
                className="block"
              >
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {project.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.mode === 'public'
                          ? 'bg-green-100 text-green-800'
                          : project.mode === 'remixable'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`create.mode${project.mode.charAt(0).toUpperCase() + project.mode.slice(1)}`)}
                      </span>
                    </div>

                    {project.description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                      {project.bpm && (
                        <span className="flex items-center">
                          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {project.bpm} BPM
                        </span>
                      )}
                      {project.key && (
                        <span className="flex items-center">
                          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          {project.key}
                        </span>
                      )}
                    </div>

                    {project.project_tags && project.project_tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.project_tags.slice(0, 3).map((tag: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                          >
                            {tag.tag}
                          </span>
                        ))}
                        {project.project_tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{project.project_tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 text-xs text-gray-400">
                      {new Date(project.created_at).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Challenge Participations Section */}
        {challengeProjects && challengeProjects.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              My Challenge Participations
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {challengeProjects.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/${locale}/projects/${project.id}`}
                  className="block"
                >
                  <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 border-l-4 border-purple-500">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {project.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          Challenge
                        </span>
                      </div>

                      {project.club_challenges && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.club_challenges.title}
                          </p>
                          {project.club_challenges.clubs && (
                            <div className="mt-1 flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                in {project.club_challenges.clubs.name}
                              </span>
                              <Link
                                href={`/${locale}/clubs/${project.club_challenges.clubs.slug}/challenges/${project.club_challenges.id}`}
                                className="text-xs text-primary hover:text-primary/90"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View Challenge →
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {project.description && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      <div className="mt-4 text-xs text-gray-400">
                        Submitted {new Date(project.created_at).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
