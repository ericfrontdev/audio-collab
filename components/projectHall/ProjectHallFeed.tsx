'use client'

import { useState, useEffect, useCallback } from 'react'
import { Send, Loader2, MessageSquare } from 'lucide-react'
import { HallPostCard } from './HallPostCard'
import { createHallPost, getProjectHallData } from '@/app/actions/projectHall'
import { toast } from 'react-toastify'
import { useRouter } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'

interface Post {
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

interface ProjectHallFeedProps {
  projectId: string
  initialPosts: Post[]
  currentUserId?: string
  isAuthenticated: boolean
}

export function ProjectHallFeed({
  projectId,
  initialPosts,
  currentUserId,
  isAuthenticated
}: ProjectHallFeedProps) {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch posts function
  const fetchPosts = useCallback(async () => {
    const { posts: newPosts } = await getProjectHallData(projectId)
    setPosts(newPosts)
  }, [projectId])

  // Real-time subscription for new posts
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`project_hall_posts:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_hall_posts',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Fetch updated posts when changes occur
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, fetchPosts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.error('You must be logged in to post')
      return
    }

    if (!content.trim()) {
      toast.error('Post cannot be empty')
      return
    }

    if (content.length > 2000) {
      toast.error('Post too long (max 2000 characters)')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createHallPost(projectId, content)

      if (result.success) {
        setContent('')
        toast.success('Post created successfully!')
        // Fetch updated posts immediately
        await fetchPosts()
      } else {
        toast.error(result.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('An error occurred while posting')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (content.trim() && !isSubmitting) {
        handleSubmit(e as any)
      }
    }
    // Shift+Enter allows new line (default behavior)
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-white">
          Discussion
          <span className="text-sm text-gray-400 font-normal ml-2">
            ({posts.length})
          </span>
        </h3>
      </div>

      {/* Post Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share an update, ask a question, or start a discussion... (Enter to post, Shift+Enter for new line)"
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-primary transition-colors"
            rows={3}
            maxLength={2000}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {content.length}/2000
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-center">
          <p className="text-sm text-gray-400">
            Log in to join the discussion
          </p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <HallPostCard
              key={post.id}
              post={post}
              projectId={projectId}
              currentUserId={currentUserId}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No posts yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Be the first to start a discussion!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
