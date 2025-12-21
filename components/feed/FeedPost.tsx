'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import { toggleLikePost } from '@/app/actions/feed'
import { toast } from 'react-toastify'
import type { Post } from '@/lib/types/feed'
import Link from 'next/link'

interface FeedPostProps {
  post: Post
}

export function FeedPost({ post }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked_by_user || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    const previousLiked = isLiked
    const previousCount = likesCount

    // Optimistic update
    setIsLiked(!isLiked)
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)

    try {
      const result = await toggleLikePost(post.id)

      if (!result.success) {
        // Revert on error
        setIsLiked(previousLiked)
        setLikesCount(previousCount)
        toast.error('Failed to like post')
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked)
      setLikesCount(previousCount)
      toast.error('Failed to like post')
    } finally {
      setIsLiking(false)
    }
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

  return (
    <Card className="p-4 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link
          href={`/profile/${post.user?.username}`}
          className="flex-shrink-0"
        >
          {post.user?.avatar_url ? (
            <img
              src={post.user.avatar_url}
              alt={post.user.username}
              className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
              <span className="text-primary font-semibold">
                {post.user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile/${post.user?.username}`}
                className="font-semibold text-white hover:underline"
              >
                {post.user?.display_name || post.user?.username}
              </Link>
              <Link
                href={`/profile/${post.user?.username}`}
                className="text-gray-500 hover:underline"
              >
                @{post.user?.username}
              </Link>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-sm">
                {formatTimeAgo(post.created_at)}
              </span>
            </div>

            <button className="p-1 rounded-full hover:bg-zinc-800 text-gray-500 hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Post content */}
          <p className="text-white whitespace-pre-wrap mb-3">{post.content}</p>

          {/* Project link if attached */}
          {post.project && (
            <Link
              href={`/projects/${post.project.id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm text-white mb-3 transition-colors"
            >
              <span>🎵</span>
              <span>{post.project.title}</span>
            </Link>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6 text-gray-500">
            <button className="flex items-center gap-2 hover:text-primary transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm">{post.comments_count || 0}</span>
            </button>

            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 transition-colors group ${
                isLiked
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  isLiked
                    ? 'bg-red-500/10'
                    : 'group-hover:bg-red-500/10'
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
                />
              </div>
              <span className="text-sm">{likesCount}</span>
            </button>

            <button className="flex items-center gap-2 hover:text-primary transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
