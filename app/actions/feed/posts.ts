'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Post } from '@/lib/types/feed'
import { getEnrichedSharedPost, type SupabaseError } from './helpers'

/**
 * Create a new post
 */
export async function createPost(
  content: string,
  projectId?: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'audio' | 'video',
  linkUrl?: string,
  linkTitle?: string,
  linkDescription?: string,
  linkImage?: string,
  clubId?: string
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // If clubId provided, verify user is a member
    if (clubId) {
      const { data: membership } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership) {
        return { success: false, error: 'You must be a member of the club to post' }
      }
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
        club_id: clubId || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return { success: false, error: error.message }
    }

    // Fetch user profile to include in the response
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, display_name')
      .eq('id', user.id)
      .single()

    // Enrich post with user profile data
    const enrichedPost = {
      ...post,
      user: profile,
      likes_count: 0,
      comments_count: 0,
      is_liked_by_user: false,
    }

    revalidatePath('/feed')
    if (clubId) {
      // Also revalidate club page if posting to club
      const { data: club } = await supabase
        .from('clubs')
        .select('slug')
        .eq('id', clubId)
        .single()
      if (club) {
        revalidatePath(`/clubs/${club.slug}`)
      }
    }
    return { success: true, post: enrichedPost }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error creating post:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get posts for a user profile (created by user OR shared on their profile)
 */
export async function getProfilePosts(userId: string, limit = 20, offset = 0) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get posts created by user OR shared on their profile feed
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .or(`user_id.eq.${userId},profile_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching profile posts:', error)
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
    const transformedPosts: Post[] = await Promise.all(
      posts.map(async (post) => {
        const profile = profiles?.find((p) => p.id === post.user_id)
        const project = projects.find((p) => p.id === post.project_id)
        const likes_count = likeCounts?.filter((l) => l.post_id === post.id).length || 0
        const comments_count = commentCounts?.filter((c) => c.post_id === post.id).length || 0

        // Fetch shared post if exists
        let shared_post = null
        if (post.shared_post_id) {
          shared_post = await getEnrichedSharedPost(supabase, post.shared_post_id, user?.id)
        }

        // Fetch profile user if exists
        let profile_user = null
        if (post.profile_user_id) {
          const { data } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, display_name')
            .eq('id', post.profile_user_id)
            .single()
          profile_user = data
        }

        return {
          ...post,
          user: profile,
          project,
          likes_count,
          comments_count,
          is_liked_by_user: userLikes.includes(post.id),
          shared_post,
          profile_user,
        }
      })
    )

    return { success: true, posts: transformedPosts }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error fetching profile posts:', err)
    return { success: false, error: err.message, posts: [] }
  }
}

/**
 * Get posts for the main feed
 */
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
    const transformedPosts: Post[] = await Promise.all(
      posts.map(async (post) => {
        const profile = profiles?.find((p) => p.id === post.user_id)
        const project = projects.find((p) => p.id === post.project_id)
        const likes_count = likeCounts?.filter((l) => l.post_id === post.id).length || 0
        const comments_count = commentCounts?.filter((c) => c.post_id === post.id).length || 0

        // Fetch shared post if exists
        let shared_post = null
        if (post.shared_post_id) {
          shared_post = await getEnrichedSharedPost(supabase, post.shared_post_id, user?.id)
        }

        // Fetch profile user if exists
        let profile_user = null
        if (post.profile_user_id) {
          const { data } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, display_name')
            .eq('id', post.profile_user_id)
            .single()
          profile_user = data
        }

        return {
          ...post,
          user: profile,
          project,
          likes_count,
          comments_count,
          is_liked_by_user: userLikes.includes(post.id),
          shared_post,
          profile_user,
        }
      })
    )

    return { success: true, posts: transformedPosts }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error fetching posts:', err)
    return { success: false, error: err.message, posts: [] }
  }
}

/**
 * Get posts for a specific club
 */
export async function getClubPosts(clubId: string, limit = 20, offset = 0) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated', posts: [] }
    }

    // Verify user is a club member
    const { data: membership } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return { success: false, error: 'You must be a member to view club posts', posts: [] }
    }

    // Get club posts (RLS will also enforce this)
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching club posts:', error)
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

    // Get club info
    const { data: club } = await supabase
      .from('clubs')
      .select('id, name, slug')
      .eq('id', clubId)
      .single()

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

    // Get user's likes
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)

    const userLikes = likes?.map((like) => like.post_id) || []

    // Transform posts to include all related data
    const transformedPosts: Post[] = await Promise.all(
      posts.map(async (post) => {
        const profile = profiles?.find((p) => p.id === post.user_id)
        const project = projects.find((p) => p.id === post.project_id)
        const likes_count = likeCounts?.filter((l) => l.post_id === post.id).length || 0
        const comments_count = commentCounts?.filter((c) => c.post_id === post.id).length || 0

        // Fetch shared post if exists
        let shared_post = null
        if (post.shared_post_id) {
          shared_post = await getEnrichedSharedPost(supabase, post.shared_post_id, user?.id)
        }

        return {
          ...post,
          user: profile,
          project,
          club,
          likes_count,
          comments_count,
          is_liked_by_user: userLikes.includes(post.id),
          shared_post,
        }
      })
    )

    return { success: true, posts: transformedPosts }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error fetching club posts:', err)
    return { success: false, error: err.message, posts: [] }
  }
}

/**
 * Update a post's content and media
 */
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

/**
 * Delete a post
 */
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
