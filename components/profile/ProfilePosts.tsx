'use client'

import { FeedPost } from '@/components/feed/FeedPost'
import type { Post } from '@/lib/types/feed'

interface ProfilePostsProps {
  initialPosts: Post[]
  currentUserId?: string
  currentUserAvatar?: string | null
}

export function ProfilePosts({
  initialPosts,
  currentUserId,
  currentUserAvatar
}: ProfilePostsProps) {
  if (initialPosts.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <p className="text-gray-400">Aucun post pour le moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {initialPosts.map((post) => (
        <FeedPost
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          currentUserAvatar={currentUserAvatar}
        />
      ))}
    </div>
  )
}
