'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Get all Hall data for a project (posts, members, versions)
 */
export async function getProjectHallData(projectId: string) {
  const supabase = await createClient()

  // Get hall posts
  const { data: posts, error: postsError } = await supabase
    .from('project_hall_posts')
    .select('id, content, created_at, updated_at, user_id')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (postsError) {
    console.error('Error fetching hall posts:', postsError)
    return { posts: [], error: postsError.message }
  }

  // Get user profiles for all posts
  const userIds = posts?.map(p => p.user_id) || []
  const uniqueUserIds = [...new Set(userIds)]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', uniqueUserIds)

  // Create a map of profiles by user_id
  const profileMap = new Map()
  profiles?.forEach(profile => {
    profileMap.set(profile.id, profile)
  })

  // Attach profiles to posts
  const formattedPosts = posts?.map(p => ({
    ...p,
    profiles: profileMap.get(p.user_id) || null
  })) || []

  return { posts: formattedPosts, error: null }
}

/**
 * Create a new Hall post
 */
export async function createHallPost(projectId: string, content: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    return { success: false, error: 'Content cannot be empty' }
  }

  if (content.length > 2000) {
    return { success: false, error: 'Content too long (max 2000 characters)' }
  }

  // Insert post
  const { data, error } = await supabase
    .from('project_hall_posts')
    .insert({
      project_id: projectId,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating hall post:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true, post: data }
}

/**
 * Delete a Hall post (only owner can delete)
 */
export async function deleteHallPost(postId: string, projectId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Delete post (RLS will ensure user owns the post)
  const { error } = await supabase
    .from('project_hall_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id) // Extra check

  if (error) {
    console.error('Error deleting hall post:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

/**
 * Check if user can access studio and in what mode
 * Returns: { canAccess, isReadOnly }
 */
export async function checkStudioAccess(projectId: string, userId?: string) {
  const supabase = await createClient()

  // Get project with studio_visibility
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, studio_visibility, owner_id')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { canAccess: false, isReadOnly: false, error: 'Project not found' }
  }

  // No user = not authenticated
  if (!userId) {
    // Public studio = read-only access for non-authenticated
    if (project.studio_visibility === 'public') {
      return { canAccess: true, isReadOnly: true }
    }
    // Members only = no access
    return { canAccess: false, isReadOnly: false }
  }

  // Check if user is project member
  const { data: membership } = await supabase
    .from('project_members')
    .select('id, role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  // User is member = full access
  if (membership) {
    return { canAccess: true, isReadOnly: false }
  }

  // Non-member: check studio_visibility
  if (project.studio_visibility === 'public') {
    // Public studio = read-only access
    return { canAccess: true, isReadOnly: true }
  }

  // Members only = no access
  return { canAccess: false, isReadOnly: false }
}
