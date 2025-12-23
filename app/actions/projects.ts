'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/server'

export async function createProject(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const locale = formData.get('locale') as string || 'en'

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const bpm = formData.get('bpm') ? parseInt(formData.get('bpm') as string) : null
  const key = formData.get('key') as string || null
  const mode = formData.get('mode') as 'private' | 'public' | 'remixable'
  const tagsString = formData.get('tags') as string

  // Insert project (always kind = 'personal' for user-created projects)
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      kind: 'personal',
      title,
      description,
      bpm,
      key,
      mode,
      owner_id: user.id,
      club_id: null,
      challenge_id: null
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Insert tags if any
  if (tagsString && project) {
    const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean)
    if (tags.length > 0) {
      await supabase
        .from('project_tags')
        .insert(tags.map(tag => ({ project_id: project.id, tag })))
    }
  }

  revalidatePath(`/${locale}/projects`)
  redirect(`/projects/${project.id}`)
}

export async function updateProject(projectId: string, prevState: any, formData: FormData) {
  const supabase = await createClient()
  const locale = formData.get('locale') as string || 'en'

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check ownership
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project || project.owner_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const bpm = formData.get('bpm') ? parseInt(formData.get('bpm') as string) : null
  const key = formData.get('key') as string || null
  const mode = formData.get('mode') as 'private' | 'public' | 'remixable'

  const { error } = await supabase
    .from('projects')
    .update({ title, description, bpm, key, mode, updated_at: new Date().toISOString() })
    .eq('id', projectId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${locale}/projects/${projectId}`)
  revalidatePath(`/${locale}/projects`)

  return { success: true }
}

export async function deleteProject(projectId: string, locale: string = 'en') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check ownership
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project || project.owner_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${locale}/projects`)
  redirect(`/projects`)
}
