'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseError } from './helpers'

/**
 * Add a comment to a post
 */
export async function addPostComment(postId: string, content: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Insert the comment
    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      })
      .select('id, content, created_at, user_id')
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return { success: false, error: error.message }
    }

    // Get the user's profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    // Combine comment with profile
    const commentWithProfile = {
      ...comment,
      user: profile,
    }

    return { success: true, comment: commentWithProfile }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error creating comment:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get all comments for a post (with replies, likes, and profiles)
 */
export async function getPostComments(postId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get all comments for this post (only top-level, not replies)
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select('id, content, created_at, user_id')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return { success: false, error: error.message, comments: [] }
    }

    // Get all unique user IDs from comments
    const userIds = [...new Set(comments?.map((c) => c.user_id) || [])]

    // Get profiles for all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds)

    // Get like counts for all comments
    const commentIds = comments?.map((c) => c.id) || []
    const { data: likeCounts } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .in('comment_id', commentIds)

    // Get user's likes if authenticated
    let userLikes: string[] = []
    if (user) {
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds)

      userLikes = likes?.map((like) => like.comment_id) || []
    }

    // Get replies for all comments
    const { data: replies } = await supabase
      .from('post_comments')
      .select('id, content, created_at, user_id, parent_id')
      .in('parent_id', commentIds)
      .order('created_at', { ascending: true })

    // Get profiles for reply authors
    const replyUserIds = [...new Set(replies?.map((r) => r.user_id) || [])]
    const { data: replyProfiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', replyUserIds)

    // Get like counts for replies
    const replyIds = replies?.map((r) => r.id) || []
    const { data: replyLikeCounts } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .in('comment_id', replyIds)

    // Get user's likes on replies if authenticated
    let userReplyLikes: string[] = []
    if (user && replyIds.length > 0) {
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', replyIds)

      userReplyLikes = likes?.map((like) => like.comment_id) || []
    }

    // Format replies with profiles and like info
    const repliesWithProfiles = replies?.map((reply) => ({
      ...reply,
      user: replyProfiles?.find((p) => p.id === reply.user_id),
      likes_count: replyLikeCounts?.filter((l) => l.comment_id === reply.id).length || 0,
      is_liked_by_user: userReplyLikes.includes(reply.id),
    })) || []

    // Combine comments with profiles, like info, and replies
    const commentsWithProfiles = comments?.map((comment) => ({
      ...comment,
      user: profiles?.find((p) => p.id === comment.user_id),
      likes_count: likeCounts?.filter((l) => l.comment_id === comment.id).length || 0,
      is_liked_by_user: userLikes.includes(comment.id),
      replies: repliesWithProfiles.filter((r) => r.parent_id === comment.id),
    })) || []

    return { success: true, comments: commentsWithProfiles }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error fetching comments:', err)
    return { success: false, error: err.message, comments: [] }
  }
}

/**
 * Add a reply to a comment
 */
export async function addCommentReply(postId: string, parentCommentId: string, content: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Insert the reply
    const { data: reply, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        parent_id: parentCommentId,
        user_id: user.id,
        content,
      })
      .select('id, content, created_at, user_id, parent_id')
      .single()

    if (error) {
      console.error('Error creating reply:', error)
      return { success: false, error: error.message }
    }

    // Get the user's profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    // Combine reply with profile
    const replyWithProfile = {
      ...reply,
      user: profile,
      likes_count: 0,
      is_liked_by_user: false,
    }

    return { success: true, reply: replyWithProfile }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error creating reply:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Update a comment's content
 */
export async function updateComment(commentId: string, content: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('post_comments')
      .update({ content })
      .eq('id', commentId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating comment:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error updating comment:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting comment:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error deleting comment:', err)
    return { success: false, error: err.message }
  }
}
