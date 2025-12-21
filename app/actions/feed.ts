'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Post } from '@/lib/types/feed'

export async function createPost(content: string, projectId?: string) {
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
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/feed')
    return { success: true, post }
  } catch (error: any) {
    console.error('Error creating post:', error)
    return { success: false, error: error.message }
  }
}

export async function getFeedPosts(limit = 20, offset = 0) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get posts with user info, like counts, and comment counts
    const { data: posts, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        user:profiles!posts_user_id_fkey(id, username, avatar_url, display_name),
        project:projects(id, title),
        likes:post_likes(count),
        comments:post_comments(count)
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      return { success: false, error: error.message, posts: [] }
    }

    // Get user's likes if authenticated
    let userLikes: string[] = []
    if (user) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)

      userLikes = likes?.map((like) => like.post_id) || []
    }

    // Transform posts to include counts and like status
    const transformedPosts: Post[] = (posts || []).map((post: any) => ({
      ...post,
      likes_count: post.likes?.[0]?.count || 0,
      comments_count: post.comments?.[0]?.count || 0,
      is_liked_by_user: userLikes.includes(post.id),
    }))

    return { success: true, posts: transformedPosts }
  } catch (error: any) {
    console.error('Error fetching posts:', error)
    return { success: false, error: error.message, posts: [] }
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
      .single()

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
  } catch (error: any) {
    console.error('Error toggling like:', error)
    return { success: false, error: error.message }
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
  } catch (error: any) {
    console.error('Error deleting post:', error)
    return { success: false, error: error.message }
  }
}
