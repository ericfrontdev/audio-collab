'use server'

import type { Post } from '@/lib/types/feed'

export interface SupabaseError {
  message: string
}

/**
 * Enriches a shared post with user, project, likes, and comments data
 */
export async function getEnrichedSharedPost(
  supabase: any,
  sharedPostId: string,
  currentUserId?: string
): Promise<Post | null> {
  try {
    // Fetch the shared post
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', sharedPostId)
      .single()

    if (error || !post) {
      return null
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, display_name')
      .eq('id', post.user_id)
      .single()

    // Fetch project if exists
    let project = null
    if (post.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', post.project_id)
        .single()
      project = projectData
    }

    // Get likes count
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', post.id)

    const likes_count = likesData?.length || 0

    // Get comments count
    const { data: commentsData } = await supabase
      .from('post_comments')
      .select('id')
      .eq('post_id', post.id)

    const comments_count = commentsData?.length || 0

    // Check if current user liked the post
    let is_liked_by_user = false
    if (currentUserId) {
      const { data: userLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
        .maybeSingle()

      is_liked_by_user = !!userLike
    }

    return {
      ...post,
      user: profile,
      project,
      likes_count,
      comments_count,
      is_liked_by_user,
    }
  } catch (error) {
    console.error('Error fetching enriched shared post:', error)
    return null
  }
}
