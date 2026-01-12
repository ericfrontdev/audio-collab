'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Toggle l'état du folder de retakes
 */
export async function toggleRetakeFolder(
  trackId: string,
  isOpen: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Check user authentication
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update folder state (RLS policies handle permissions)
    const { data, error: updateError } = await supabase
      .from('project_tracks')
      .update({ is_retake_folder_open: isOpen })
      .eq('id', trackId)
      .select()

    if (updateError) {
      console.error('Update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
      return {
        success: false,
        error: `Failed to update folder state: ${updateError.message || 'Unknown error'}`
      }
    }

    if (!data || data.length === 0) {
      console.error('No rows updated for track:', trackId)
      return { success: false, error: 'Track not found or no permission to update' }
    }

    console.log('Successfully updated folder state:', { trackId, isOpen, data })
    return { success: true }
  } catch (error) {
    console.error('Error toggling retake folder:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Active une retake complète (désactive toutes les sections partielles)
 */
export async function activateFullRetake(
  trackId: string,
  takeId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('🚀 activateFullRetake START:', { trackId, takeId })

  try {
    const supabase = await createClient()

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      console.log('❌ User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }
    console.log('✅ User authenticated:', userData.user.id)

    // Verify user is project member
    const { data: track, error: trackError } = await supabase
      .from('project_tracks')
      .select(`
        id,
        project_id,
        projects (
          id,
          project_members (
            user_id
          )
        )
      `)
      .eq('id', trackId)
      .single()

    if (trackError || !track) {
      return { success: false, error: 'Track not found' }
    }

    // @ts-ignore - Complex nested type
    const members = track.projects?.project_members || []
    const isMember = members.some((m: any) => m.user_id === userData.user.id)

    if (!isMember) {
      return { success: false, error: 'Not a project member' }
    }

    // 1. Delete all comped sections for this track
    const { error: deleteError } = await supabase
      .from('project_comped_sections')
      .delete()
      .eq('track_id', trackId)

    if (deleteError) {
      console.error('Error deleting sections:', deleteError)
      // Continue anyway, we still want to activate the take
    }

    // 2. Set all takes for this track to inactive
    const { data: deactivatedTakes, error: deactivateError } = await supabase
      .from('project_takes')
      .update({ is_active: false })
      .eq('track_id', trackId)
      .select()

    console.log('✅ Deactivated takes:', deactivatedTakes?.length || 0, 'takes')
    if (deactivateError) {
      console.log('❌ Deactivate error:', deactivateError)
    }

    if (deactivateError) {
      return { success: false, error: 'Failed to deactivate takes' }
    }

    // 3. Activate the specified take
    console.log('🎯 About to activate take ID:', takeId)
    const { data: activatedTake, error: activateError } = await supabase
      .from('project_takes')
      .update({ is_active: true })
      .eq('id', takeId)
      .select()

    console.log('✅ Activated take result:', {
      count: activatedTake?.length || 0,
      activatedId: activatedTake?.[0]?.id,
      requestedId: takeId,
      match: activatedTake?.[0]?.id === takeId
    })
    if (activateError) {
      console.log('❌ Activate error:', activateError)
    }

    if (activateError) {
      return { success: false, error: 'Failed to activate take' }
    }

    if (!activatedTake || activatedTake.length === 0) {
      return { success: false, error: 'No take was activated - possible permissions issue' }
    }

    // Don't use revalidatePath as it causes a full page reload
    // The UI will refresh via loadStudioData() called from the handler

    return { success: true }
  } catch (error) {
    console.error('Error activating full retake:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
