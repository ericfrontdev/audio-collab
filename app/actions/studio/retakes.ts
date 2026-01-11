'use server'

import { createClient } from '@/lib/supabase/server'
import { checkProjectAccess, SupabaseError } from './utils'

/**
 * Activate a retake (makes it the active take for its track)
 * Simple logic: Update track.active_take_id to point to this take
 */
export async function activateRetake(
  trackId: string,
  takeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get track to verify access
    const { data: track, error: trackError } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .single()

    if (trackError || !track) {
      return { success: false, error: 'Track not found' }
    }

    // Check project access
    const access = await checkProjectAccess(track.project_id)
    if (!access.success) {
      return { success: false, error: access.error }
    }

    // Verify the take exists and belongs to this track
    const { data: take, error: takeError } = await supabase
      .from('project_takes')
      .select('id')
      .eq('id', takeId)
      .eq('track_id', trackId)
      .single()

    if (takeError || !take) {
      return { success: false, error: 'Take not found or does not belong to this track' }
    }

    // Update track to point to this take
    const { error: updateError } = await supabase
      .from('project_tracks')
      .update({ active_take_id: takeId })
      .eq('id', trackId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error activating retake:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Deactivate current retake and return to original (first) take
 */
export async function deactivateRetake(
  trackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get track to verify access
    const { data: track, error: trackError } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .single()

    if (trackError || !track) {
      return { success: false, error: 'Track not found' }
    }

    // Check project access
    const access = await checkProjectAccess(track.project_id)
    if (!access.success) {
      return { success: false, error: access.error }
    }

    // Get the first take (original)
    const { data: takes, error: takesError } = await supabase
      .from('project_takes')
      .select('id, created_at')
      .eq('track_id', trackId)
      .order('created_at', { ascending: true })

    if (takesError || !takes || takes.length === 0) {
      return { success: false, error: 'No takes found' }
    }

    const firstTakeId = takes[0].id

    // Set track to point to first take
    const { error: updateError } = await supabase
      .from('project_tracks')
      .update({ active_take_id: firstTakeId })
      .eq('id', trackId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error deactivating retake:', err)
    return { success: false, error: err.message }
  }
}
