'use client'

import { useState, useEffect } from 'react'
import { FeedPost } from './FeedPost'
import { createClient } from '@/lib/supabase/client'

interface FeedPostsListProps {
  initialPosts: any[]
  currentUserId: string
  currentUserAvatar?: string | null
}

export function FeedPostsList({ initialPosts, currentUserId, currentUserAvatar }: FeedPostsListProps) {
  const [posts, setPosts] = useState(initialPosts)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('feed_posts')
      .on('broadcast', { event: 'post_created' }, (payload) => {
        const newPost = payload.payload
        // Add new post to the beginning of the list
        setPosts((prevPosts) => [newPost, ...prevPosts])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Update posts when initialPosts changes (e.g., on navigation)
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            No posts yet. Be the first to share something!
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <FeedPost
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            currentUserAvatar={currentUserAvatar}
          />
        ))
      )}
    </div>
  )
}
