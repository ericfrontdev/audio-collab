'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { createProject } from '@/app/actions/projects'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProjectPage() {
  const t = useTranslations('projects.create')
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const [state, formAction, isPending] = useActionState(createProject, null)

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
                href={`/${locale}/projects`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {t('cancel')}
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
                  {t('projectTitle')}
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('description')}
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="bpm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('bpm')}
                  </label>
                  <input
                    type="number"
                    name="bpm"
                    id="bpm"
                    min="1"
                    max="300"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('key')}
                  </label>
                  <select
                    name="key"
                    id="key"
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
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('tags')}
                </label>
                <input
                  type="text"
                  name="tags"
                  id="tags"
                  placeholder={t('tagsPlaceholder')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('mode')}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="private"
                      defaultChecked
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {t('modePrivate')}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="public"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {t('modePublic')}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="remixable"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {t('modeRemixable')}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href={`/${locale}/projects`}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  {t('cancel')}
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
