import { useState, useEffect, useRef } from 'react'
import { toggleLikePost } from '@/app/actions/feed'
import { toast } from 'react-toastify'
import { createClient } from '@/lib/supabase/client'

export function usePostLike(initialIsLiked: boolean, initialLikesCount: number, postId: string) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLiking, setIsLiking] = useState(false)
  const channelRef = useRef<any>(null)

  // Subscribe to real-time like updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`post_likes:${postId}`)
      .on('broadcast', { event: 'like_changed' }, (payload) => {
        const { likesCount: newCount, userId, isLiked: newIsLiked } = payload.payload
        setLikesCount(newCount)
        // Don't update isLiked for other users' actions
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    const previousLiked = isLiked
    const previousCount = likesCount

    // Optimistic update
    const newIsLiked = !isLiked
    const newCount = isLiked ? likesCount - 1 : likesCount + 1
    setIsLiked(newIsLiked)
    setLikesCount(newCount)

    try {
      const result = await toggleLikePost(postId)

      if (!result.success) {
        // Revert on error
        setIsLiked(previousLiked)
        setLikesCount(previousCount)
        toast.error('Failed to like post')
      } else {
        // Broadcast the like change to other users using the existing channel
        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'like_changed',
            payload: {
              likesCount: newCount,
              isLiked: newIsLiked,
            },
          })
        }
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

  return {
    isLiked,
    likesCount,
    isLiking,
    handleLike,
  }
}
