'use client'

import { ProjectDiscussionMessage } from '@/lib/types/multitrack'
import { useState } from 'react'
import { useActionState } from 'react'
import { createDiscussionMessage } from '@/app/actions/multitrack'

interface ProjectDiscussionProps {
  projectId: string
  messages: ProjectDiscussionMessage[]
  canPost: boolean
  currentUserId: string
  locale: string
}

export default function ProjectDiscussion({
  projectId,
  messages,
  canPost,
  currentUserId,
  locale
}: ProjectDiscussionProps) {
  const [newMessage, setNewMessage] = useState('')
  const [state, formAction] = useActionState(createDiscussionMessage, null)

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Discussion
        </h3>

        {/* Messages */}
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  {message.profiles?.avatar_url ? (
                    <img
                      src={message.profiles.avatar_url}
                      alt={message.profiles.display_name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {message.profiles?.display_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {message.profiles?.display_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(message.created_at).toLocaleString(locale, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Message Form */}
        {canPost && (
          <form action={formAction} className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <input type="hidden" name="project_id" value={projectId} />
            <textarea
              name="content"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
              placeholder="Write a message..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {state?.error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.error}</p>
            )}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (newMessage.trim()) {
                    setTimeout(() => setNewMessage(''), 100)
                  }
                }}
              >
                Post Message
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
