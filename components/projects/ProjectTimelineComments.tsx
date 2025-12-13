'use client'

import { ProjectTimelineComment } from '@/lib/types/multitrack'

interface ProjectTimelineCommentsProps {
  projectId: string
  comments: ProjectTimelineComment[]
  canComment: boolean
  locale: string
}

export default function ProjectTimelineComments({
  projectId,
  comments,
  canComment,
  locale
}: ProjectTimelineCommentsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Timeline Comments ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No timeline comments yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <span className="text-xs font-medium text-red-600 dark:text-red-300">
                      {formatTime(comment.time_seconds)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {comment.profiles?.display_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {comment.content}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(comment.created_at).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
