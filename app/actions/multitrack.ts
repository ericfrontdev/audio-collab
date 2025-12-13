'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// =====================================================
// STEMS ACTIONS
// =====================================================

export async function createStem(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const projectId = formData.get('project_id') as string
  const name = formData.get('name') as string
  const fileUrl = formData.get('file_url') as string
  const orderIndex = formData.get('order_index') ? parseInt(formData.get('order_index') as string) : 0
  const volume = formData.get('volume') ? parseFloat(formData.get('volume') as string) : 0.8
  const pan = formData.get('pan') ? parseFloat(formData.get('pan') as string) : 0.0
  const color = formData.get('color') as string || null

  // Check if user can edit this project
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { error: 'Project not found' }
  }

  // Check if user is owner or collaborator
  const { data: collaborator } = await supabase
    .from('project_collaborators')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  const canEdit = project.owner_id === user.id || !!collaborator

  if (!canEdit) {
    return { error: 'Not authorized to add stems to this project' }
  }

  const { data: stem, error } = await supabase
    .from('project_stems')
    .insert({
      project_id: projectId,
      name,
      file_url: fileUrl,
      order_index: orderIndex,
      volume,
      pan,
      color,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true, stem }
}

export async function updateStem(stemId: string, updates: {
  name?: string
  order_index?: number
  volume?: number
  pan?: number
  is_muted?: boolean
  is_solo?: boolean
  color?: string | null
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get stem to check permissions
  const { data: stem } = await supabase
    .from('project_stems')
    .select('project_id, created_by')
    .eq('id', stemId)
    .single()

  if (!stem) {
    return { error: 'Stem not found' }
  }

  // Check if user is owner or collaborator
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', stem.project_id)
    .single()

  const { data: collaborator } = await supabase
    .from('project_collaborators')
    .select('role')
    .eq('project_id', stem.project_id)
    .eq('user_id', user.id)
    .single()

  const canEdit = project?.owner_id === user.id || !!collaborator

  if (!canEdit) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('project_stems')
    .update(updates)
    .eq('id', stemId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${stem.project_id}`)
  return { success: true }
}

export async function deleteStem(stemId: string, projectId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get stem to check permissions
  const { data: stem } = await supabase
    .from('project_stems')
    .select('created_by, file_url')
    .eq('id', stemId)
    .single()

  if (!stem) {
    return { error: 'Stem not found' }
  }

  // Only stem creator can delete
  if (stem.created_by !== user.id) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('project_stems')
    .delete()
    .eq('id', stemId)

  if (error) {
    return { error: error.message }
  }

  // TODO: Delete file from storage
  // const fileName = stem.file_url.split('/').pop()
  // await supabase.storage.from('stems').remove([fileName])

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

// =====================================================
// DISCUSSION MESSAGES ACTIONS
// =====================================================

export async function createDiscussionMessage(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const projectId = formData.get('project_id') as string
  const content = formData.get('content') as string

  if (!content || !content.trim()) {
    return { error: 'Content is required' }
  }

  // Check if user can post (owner, collaborator, or public/remixable project)
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id, mode')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { error: 'Project not found' }
  }

  const { data: collaborator } = await supabase
    .from('project_collaborators')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  const canPost = project.owner_id === user.id ||
                  !!collaborator ||
                  project.mode === 'public' ||
                  project.mode === 'remixable'

  if (!canPost) {
    return { error: 'Not authorized to post in this project' }
  }

  const { error } = await supabase
    .from('project_discussion_messages')
    .insert({
      project_id: projectId,
      author_id: user.id,
      content: content.trim()
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteDiscussionMessage(messageId: string, projectId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get message to check permissions
  const { data: message } = await supabase
    .from('project_discussion_messages')
    .select('author_id')
    .eq('id', messageId)
    .single()

  if (!message) {
    return { error: 'Message not found' }
  }

  // Only author can delete
  if (message.author_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('project_discussion_messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

// =====================================================
// TIMELINE COMMENTS ACTIONS
// =====================================================

export async function createTimelineComment(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const projectId = formData.get('project_id') as string
  const timeSeconds = parseFloat(formData.get('time_seconds') as string)
  const content = formData.get('content') as string

  if (!content || !content.trim()) {
    return { error: 'Content is required' }
  }

  if (isNaN(timeSeconds) || timeSeconds < 0) {
    return { error: 'Invalid time position' }
  }

  // Check if user can comment
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id, mode')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { error: 'Project not found' }
  }

  const { data: collaborator } = await supabase
    .from('project_collaborators')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  const canComment = project.owner_id === user.id ||
                     !!collaborator ||
                     project.mode === 'public' ||
                     project.mode === 'remixable'

  if (!canComment) {
    return { error: 'Not authorized to comment on this project' }
  }

  const { error } = await supabase
    .from('project_timeline_comments')
    .insert({
      project_id: projectId,
      author_id: user.id,
      time_seconds: timeSeconds,
      content: content.trim()
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteTimelineComment(commentId: string, projectId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get comment to check permissions
  const { data: comment } = await supabase
    .from('project_timeline_comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (!comment) {
    return { error: 'Comment not found' }
  }

  // Only author can delete
  if (comment.author_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('project_timeline_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

// =====================================================
// VERSIONS ACTIONS
// =====================================================

export async function createVersion(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const projectId = formData.get('project_id') as string
  const label = formData.get('label') as string
  const notes = formData.get('notes') as string || null
  const mixdownUrl = formData.get('mixdown_url') as string || null

  if (!label || !label.trim()) {
    return { error: 'Version label is required' }
  }

  // Check if user can create version (owner or collaborator)
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { error: 'Project not found' }
  }

  const { data: collaborator } = await supabase
    .from('project_collaborators')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  const canCreate = project.owner_id === user.id || !!collaborator

  if (!canCreate) {
    return { error: 'Not authorized to create versions' }
  }

  const { error } = await supabase
    .from('project_versions')
    .insert({
      project_id: projectId,
      label: label.trim(),
      notes: notes?.trim() || null,
      mixdown_url: mixdownUrl,
      created_by: user.id
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

// =====================================================
// COLLABORATORS ACTIONS
// =====================================================

export async function addCollaborator(projectId: string, userId: string, instrument?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if current user is owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { error: 'Project not found' }
  }

  if (project.owner_id !== user.id) {
    return { error: 'Only project owner can add collaborators' }
  }

  const { error } = await supabase
    .from('project_collaborators')
    .insert({
      project_id: projectId,
      user_id: userId,
      role: 'collaborator',
      instrument: instrument || null
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function removeCollaborator(collaboratorId: string, projectId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if current user is owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { error: 'Project not found' }
  }

  if (project.owner_id !== user.id) {
    return { error: 'Only project owner can remove collaborators' }
  }

  const { error } = await supabase
    .from('project_collaborators')
    .delete()
    .eq('id', collaboratorId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
