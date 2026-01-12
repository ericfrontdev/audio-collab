'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SupabaseError } from './helpers'

/**
 * Toggle like on a post (like if not liked, unlike if already liked)
 */
export async function toggleLikePost(postId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error unliking post:', error)
        return { success: false, error: error.message }
      }

      revalidatePath('/feed')
      return { success: true, liked: false }
    } else {
      // Like
      const { error } = await supabase.from('post_likes').insert({
        post_id: postId,
        user_id: user.id,
      })

      if (error) {
        console.error('Error liking post:', error)
        return { success: false, error: error.message }
      }

      revalidatePath('/feed')
      return { success: true, liked: true }
    }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error toggling like:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Toggle like on a comment (like if not liked, unlike if already liked)
 */
export async function toggleCommentLike(commentId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error unliking comment:', error)
        return { success: false, error: error.message }
      }

      return { success: true, liked: false }
    } else {
      // Like
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
        })

      if (error) {
        console.error('Error liking comment:', error)
        return { success: false, error: error.message }
      }

      return { success: true, liked: true }
    }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error toggling comment like:', err)
    return { success: false, error: err.message }
  }
}
