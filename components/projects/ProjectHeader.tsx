import Link from 'next/link'
import { deleteProject } from '@/app/actions/projects'

interface ProjectHeaderProps {
  project: any
  isOwner: boolean
  canEdit: boolean
  locale: string
}

export default function ProjectHeader({ project, isOwner, canEdit, locale }: ProjectHeaderProps) {
  async function handleDelete() {
    'use server'
    await deleteProject(project.id, locale)
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow">
      {/* Cover Banner */}
      <div className="h-64 bg-gradient-to-r from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 overflow-hidden relative">
        {project.cover_url ? (
          <img
            src={project.cover_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-24 w-24 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 pb-6">
          <div className="flex items-end space-x-5">
            {/* Creator Avatar */}
            <div className="flex-shrink-0">
              {project.profiles?.avatar_url ? (
                <img
                  src={project.profiles.avatar_url}
                  alt={project.profiles.display_name}
                  className="h-32 w-32 rounded-lg border-4 border-white dark:border-gray-800 shadow-xl"
                />
              ) : (
                <div className="h-32 w-32 rounded-lg border-4 border-white dark:border-gray-800 shadow-xl bg-primary flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {project.profiles?.display_name?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              {/* Title & Badges */}
              <div className="flex items-center space-x-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {project.title}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  project.mode === 'public'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : project.mode === 'remixable'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {project.mode}
                </span>
                {project.status === 'finished' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    ✓ Finished
                  </span>
                )}
                {project.status === 'open_collab' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    Open Collab
                  </span>
                )}
              </div>

              {/* Owner & Date */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">
                  {project.profiles?.display_name}
                </span>
                <span>•</span>
                <span>
                  {new Date(project.created_at).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* Description */}
              {project.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {project.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {isOwner && (
              <div className="flex items-center space-x-2 pb-1">
                <Link
                  href={`/${locale}/projects/${project.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
                <form action={handleDelete}>
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (!confirm('Are you sure you want to delete this project?')) {
                        e.preventDefault()
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Back Link */}
          <div className="mt-6">
            <Link
              href={`/${locale}/projects`}
              className="inline-flex items-center text-sm text-primary hover:text-primary/90"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
