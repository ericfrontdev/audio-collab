'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface SupabaseError {
  message: string
}

export async function sendMessage(
  projectId: string,
  content: string,
  replyTo?: string
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Verify user is a project member or owner
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return { success: false, error: 'Projet introuvable' }
    }

    const isMember = project.owner_id === user.id ||
      await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => !!data)

    if (!isMember) {
      return { success: false, error: 'Vous n\'êtes pas membre de ce projet' }
    }

    const { data: message, error } = await supabase
      .from('project_messages')
      .insert({
        project_id: projectId,
        user_id: user.id,
        content: content.trim(),
        reply_to: replyTo || null,
      })
      .select(`
        *,
        user:profiles(id, username, display_name, avatar_url),
        reply_to_message:project_messages!reply_to(
          id,
          content,
          user:profiles(username, display_name)
        )
      `)
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true, message }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error sending message:', err)
    return { success: false, error: err.message }
  }
}

export async function getMessages(projectId: string, limit = 50, offset = 0) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non authentifié', messages: [] }
    }

    const { data: messages, error } = await supabase
      .from('project_messages')
      .select(`
        *,
        user:profiles(id, username, display_name, avatar_url),
        reply_to_message:project_messages!reply_to(
          id,
          content,
          user:profiles(username, display_name)
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return { success: false, error: error.message, messages: [] }
    }

    return { success: true, messages: messages || [] }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error fetching messages:', err)
    return { success: false, error: err.message, messages: [] }
  }
}

export async function updateMessage(messageId: string, content: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { data: message, error } = await supabase
      .from('project_messages')
      .update({
        content: content.trim(),
        is_edited: true,
      })
      .eq('id', messageId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating message:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error updating message:', err)
    return { success: false, error: err.message }
  }
}

export async function deleteMessage(messageId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { error } = await supabase
      .from('project_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting message:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error deleting message:', err)
    return { success: false, error: err.message }
  }
}
