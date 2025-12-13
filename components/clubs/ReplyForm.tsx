'use client'

import { useActionState } from 'react'
import { replyToDiscussion } from '@/app/actions/clubs'

export default function ReplyForm({
  threadId,
  clubSlug,
  locale
}: {
  threadId: string
  clubSlug: string
  locale: string
}) {
  const [state, formAction] = useActionState(replyToDiscussion, null)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="clubSlug" value={clubSlug} />
      <input type="hidden" name="locale" value={locale} />

      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <textarea
          name="content"
          rows={4}
          required
          placeholder="Write your reply..."
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
        >
          Post Reply
        </button>
      </div>
    </form>
  )
}
