'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Upload project cover image
 * Returns the public URL of the uploaded image
 */
export async function uploadProjectCover(projectId: string, formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if user is project member
  const { data: membership } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return { success: false, error: 'Not authorized' }
  }

  // Get file from form data
  const file = formData.get('file') as File
  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.' }
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'File too large. Maximum size is 5MB.' }
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${projectId}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('project-covers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading cover:', uploadError)
    return { success: false, error: uploadError.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('project-covers')
    .getPublicUrl(filePath)

  // Update project cover_url in database
  const { error: updateError } = await supabase
    .from('projects')
    .update({ cover_url: publicUrl })
    .eq('id', projectId)

  if (updateError) {
    console.error('Error updating project cover_url:', updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true, url: publicUrl }
}

/**
 * Delete project cover image
 */
export async function deleteProjectCover(projectId: string, coverUrl: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if user is project member
  const { data: membership } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return { success: false, error: 'Not authorized' }
  }

  // Extract file path from URL
  const fileName = coverUrl.split('/').pop()
  if (!fileName) {
    return { success: false, error: 'Invalid cover URL' }
  }

  // Delete from storage
  const { error: deleteError } = await supabase.storage
    .from('project-covers')
    .remove([fileName])

  if (deleteError) {
    console.error('Error deleting cover:', deleteError)
    return { success: false, error: deleteError.message }
  }

  // Remove cover_url from project
  const { error: updateError } = await supabase
    .from('projects')
    .update({ cover_url: null })
    .eq('id', projectId)

  if (updateError) {
    console.error('Error updating project:', updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
