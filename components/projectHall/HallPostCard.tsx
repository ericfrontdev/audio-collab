'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteHallPost } from '@/app/actions/projectHall'
import { toast } from 'react-toastify'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

interface HallPostCardProps {
  post: {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: {
      username: string
      display_name: string | null
      avatar_url: string | null
    } | null
  }
  projectId: string
  currentUserId?: string
}

export function HallPostCard({ post, projectId, currentUserId }: HallPostCardProps) {
  const router = useRouter()
  const tTime = useTranslations('feed.timeAgo')
  const t = useTranslations('projectHall.hallPost')
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = currentUserId === post.user_id
  const displayName = post.profiles?.display_name || post.profiles?.username || t('unknownUser')
  const avatarUrl = post.profiles?.avatar_url

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    if (diffInMinutes < 1) return tTime('justNow')
    if (diffInMinutes < 60) return tTime('minutesAgo', { minutes: diffInMinutes })

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return tTime('hoursAgo', { hours: diffInHours })

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return tTime('daysAgo', { days: diffInDays })

    return date.toLocaleDateString()
  }

  const handleDelete = async () => {
    if (!isOwner) return

    setIsDeleting(true)

    try {
      const result = await deleteHallPost(post.id, projectId)

      if (result.success) {
        toast.success(t('success.deleted'))
        router.refresh()
      } else {
        toast.error(result.error || t('errors.deleteFailed'))
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(t('errors.deleteError'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-400">
                {displayName[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-white">
              {displayName}
            </p>
            <p className="text-xs text-gray-500">
              {formatTimeAgo(post.created_at)}
            </p>
          </div>

          <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
            {post.content}
          </p>
        </div>

        {/* Delete button (owner only) */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
            title={t('deletePost')}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
