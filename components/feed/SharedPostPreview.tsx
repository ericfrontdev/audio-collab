'use client'

import { Link } from '@/i18n/routing'
import type { Post } from '@/lib/types/feed'
import { PostContent } from './PostContent'

interface SharedPostPreviewProps {
  post: Post | null
  compact?: boolean
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export function SharedPostPreview({ post, compact = false }: SharedPostPreviewProps) {
  // Handle deleted post
  if (!post) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-gray-400 text-sm italic">Ce post n&apos;est plus disponible</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/30 p-4 hover:bg-zinc-900/50 transition-colors">
      {/* Header with original author */}
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/profile/${post.user?.username}`}>
          {post.user?.avatar_url ? (
            <img
              src={post.user.avatar_url}
              alt={post.user.username}
              className="w-10 h-10 rounded-full object-cover hover:ring-2 ring-primary transition-all"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
              <span className="text-primary font-semibold">
                {post.user?.username?.[0].toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${post.user?.username}`}
            className="font-semibold text-white hover:text-primary transition-colors"
          >
            {post.user?.display_name || post.user?.username}
          </Link>
          {post.user?.username && (
            <p className="text-sm text-gray-400">@{post.user.username}</p>
          )}
        </div>

        <time className="text-xs text-gray-500 whitespace-nowrap">
          {formatTimeAgo(post.created_at)}
        </time>
      </div>

      {/* Post content */}
      {!compact && (
        <div className="text-sm">
          <PostContent
            content={post.content}
            mediaUrl={post.media_url}
            mediaType={post.media_type}
            project={post.project}
            linkUrl={post.link_url}
            linkTitle={post.link_title}
            linkDescription={post.link_description}
            linkImage={post.link_image}
          />
        </div>
      )}

      {compact && post.content && (
        <p className="text-sm text-white line-clamp-2">{post.content}</p>
      )}
    </div>
  )
}
