'use client'

import { useState, useEffect } from 'react'
import { CreatePostCard } from '@/components/feed/CreatePostCard'
import { FeedPost } from '@/components/feed/FeedPost'
import { getClubPosts } from '@/app/actions/feed/posts'
import type { Post } from '@/lib/types/feed'
import { useTranslations } from 'next-intl'

interface Club {
  id: string
  name: string
  slug: string
}

interface ClubFeedProps {
  club: Club
  isMember: boolean
  userId?: string
  userAvatar?: string | null
  username?: string
}

export function ClubFeed({ club, isMember, userId, userAvatar, username }: ClubFeedProps) {
  const t = useTranslations('clubs.feed')
  const tGenres = useTranslations('clubs.genres')
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isMember) {
      loadPosts()
    } else {
      setIsLoading(false)
    }
  }, [isMember, club.id])

  const loadPosts = async () => {
    setIsLoading(true)
    setError(null)

    const result = await getClubPosts(club.id, 20, 0)

    if (result.success) {
      setPosts(result.posts)
    } else {
      setError(result.error || 'Failed to load club posts')
    }

    setIsLoading(false)
  }

  const handlePostCreated = () => {
    // Refresh posts after creating a new one
    loadPosts()
  }

  // Non-member view
  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('joinToView')}
          </h3>
          <p className="text-gray-400">
            {t('privateDescription', { clubName: tGenres(club.name as any) || club.name })}
          </p>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400">{t('loading')}</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadPosts}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t('tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  // Member view with posts
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Create Post Card */}
      {userId && (
        <CreatePostCard
          userId={userId}
          userAvatar={userAvatar}
          username={username}
          clubId={club.id}
          clubName={club.name}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {t('noPosts')}
            </h3>
            <p className="text-gray-400">
              {t('beFirst', { clubName: tGenres(club.name as any) || club.name })}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <FeedPost
              key={post.id}
              post={post}
              currentUserId={userId}
              currentUserAvatar={userAvatar}
            />
          ))}
        </div>
      )}
    </div>
  )
}
