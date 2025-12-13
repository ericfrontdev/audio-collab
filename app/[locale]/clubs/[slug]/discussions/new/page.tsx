'use client'

import { useParams, useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'
import { createDiscussion } from '@/app/actions/clubs'

export default function NewDiscussionPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const slug = params.slug as string
  const [state, formAction] = useActionState(createDiscussion, null)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Start a Discussion
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Share an idea, ask a question, or start a conversation with club members
          </p>
        </div>

        <form action={formAction} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slug" value={slug} />

          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-white">
              Title <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g., How to get that smooth R&B sound?"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Add a title to make your discussion easier to find
            </p>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-900 dark:text-white">
              Message *
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              required
              placeholder="Share your thoughts, ask a question, or start a conversation..."
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Examples: technical advice, collaboration requests, feedback, references, challenges
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
            >
              Post Discussion
            </button>
          </div>
        </form>

        {/* Helpful Tips */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Discussion Ideas
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Ask for technical advice or production tips</li>
            <li>Share musical references or resources</li>
            <li>Look for collaborators on a track</li>
            <li>Request feedback on your style or approach</li>
            <li>Propose a challenge or activity</li>
            <li>Discuss trends in the genre</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
