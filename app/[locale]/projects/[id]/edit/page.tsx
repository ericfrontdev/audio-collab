'use client'

import { useActionState, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { updateProject } from '@/app/actions/projects'
import { useParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'

export default function EditProjectPage() {
  const t = useTranslations('projects.edit')
  const tCreate = useTranslations('projects.create')
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const updateProjectWithId = updateProject.bind(null, projectId)
  const [state, formAction, isPending] = useActionState(updateProjectWithId, null)

  useEffect(() => {
    async function fetchProject() {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle()

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setProject(data)
      }
      setLoading(false)
    }

    fetchProject()
  }, [projectId])

  useEffect(() => {
    if (state?.success) {
      router.push(`/projects/${projectId}`)
    }
  }, [state, projectId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            {error || 'Project not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h1>
              <Link
                href={`/projects/${projectId}`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {tCreate('cancel')}
              </Link>
            </div>

            {state?.error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-6">
              <input type="hidden" name="locale" value={locale} />

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tCreate('projectTitle')}
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  defaultValue={project.title}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tCreate('description')}
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  defaultValue={project.description || ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="bpm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tCreate('bpm')}
                  </label>
                  <input
                    type="number"
                    name="bpm"
                    id="bpm"
                    min="1"
                    max="300"
                    defaultValue={project.bpm || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tCreate('key')}
                  </label>
                  <select
                    name="key"
                    id="key"
                    defaultValue={project.key || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">-</option>
                    <option value="C">C</option>
                    <option value="C#">C#</option>
                    <option value="D">D</option>
                    <option value="D#">D#</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="F#">F#</option>
                    <option value="G">G</option>
                    <option value="G#">G#</option>
                    <option value="A">A</option>
                    <option value="A#">A#</option>
                    <option value="B">B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tCreate('mode')}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="private"
                      defaultChecked={project.mode === 'private'}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {tCreate('modePrivate')}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="public"
                      defaultChecked={project.mode === 'public'}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {tCreate('modePublic')}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="remixable"
                      defaultChecked={project.mode === 'remixable'}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {tCreate('modeRemixable')}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href={`/projects/${projectId}`}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  {tCreate('cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? '...' : t('submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
