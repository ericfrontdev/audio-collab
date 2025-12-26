'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Post } from '@/lib/types/feed'

interface SupabaseError {
  message: string;
}

export async function createPost(
  content: string,
  projectId?: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'audio' | 'video',
  linkUrl?: string,
  linkTitle?: string,
  linkDescription?: string,
  linkImage?: string
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        project_id: projectId || null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        link_url: linkUrl || null,
        link_title: linkTitle || null,
        link_description: linkDescription || null,
        link_image: linkImage || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/feed')
    return { success: true, post }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error creating post:', err)
    return { success: false, error: err.message }
  }
}

export async function getFeedPosts(limit = 20, offset = 0) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get posts first
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      return { success: false, error: error.message, posts: [] }
    }

    if (!posts || posts.length === 0) {
      return { success: true, posts: [] }
    }

    // Get user profiles for all post authors
    const userIds = [...new Set(posts.map((p) => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, display_name')
      .in('id', userIds)

    // Get projects if any posts reference them
    const projectIds = posts.map((p) => p.project_id).filter(Boolean)
    interface ProjectInfo {
      id: string;
      title: string;
    }
    let projects: ProjectInfo[] = []
    if (projectIds.length > 0) {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, title')
        .in('id', projectIds)
      projects = projectsData || []
    }

    // Get like counts
    const postIds = posts.map((p) => p.id)
    const { data: likeCounts } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds)

    // Get comment counts
    const { data: commentCounts } = await supabase
      .from('post_comments')
      .select('post_id')
      .in('post_id', postIds)

    // Get user's likes if authenticated
    let userLikes: string[] = []
    if (user) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)

      userLikes = likes?.map((like) => like.post_id) || []
    }

    // Transform posts to include all related data
    const transformedPosts: Post[] = posts.map((post) => {
      const profile = profiles?.find((p) => p.id === post.user_id)
      const project = projects.find((p) => p.id === post.project_id)
      const likes_count = likeCounts?.filter((l) => l.post_id === post.id).length || 0
      const comments_count = commentCounts?.filter((c) => c.post_id === post.id).length || 0

      return {
        ...post,
        user: profile,
        project,
        likes_count,
        comments_count,
        is_liked_by_user: userLikes.includes(post.id),
      }
    })

    return { success: true, posts: transformedPosts }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error fetching posts:', err)
    return { success: false, error: err.message, posts: [] }
  }
}

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

export async function updatePost(
  postId: string,
  content: string,
  mediaUrl?: string | null,
  mediaType?: 'image' | 'audio' | null
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    interface UpdateData {
      content: string;
      media_url?: string | null;
      media_type?: 'image' | 'audio' | null;
    }

    const updateData: UpdateData = { content }

    // Only update media fields if they are provided
    if (mediaUrl !== undefined) updateData.media_url = mediaUrl
    if (mediaType !== undefined) updateData.media_type = mediaType

    const { error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating post:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/feed')
    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error updating post:', err)
    return { success: false, error: err.message }
  }
}

export async function deletePost(postId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting post:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/feed')
    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error deleting post:', err)
    return { success: false, error: err.message }
  }
}

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
