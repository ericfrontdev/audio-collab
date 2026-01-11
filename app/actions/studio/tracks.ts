'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ProjectTrack, TRACK_COLORS } from '@/lib/types/studio';
import { checkProjectAccess, SupabaseError } from './utils';

/**
 * ============================================================================
 * TRACK ACTIONS
 * ============================================================================
 */

/**
 * Create a new track in a project
 */
export async function createTrack(
  projectId: string,
  name: string,
  color?: string
): Promise<{ success: boolean; track?: ProjectTrack; error?: string }> {
  try {
    const access = await checkProjectAccess(projectId);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    const supabase = await createClient();

    // Get current track count for order_index
    const { count } = await supabase
      .from('project_tracks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    // Create track
    const { data: track, error } = await supabase
      .from('project_tracks')
      .insert({
        project_id: projectId,
        name,
        color: color || TRACK_COLORS[Math.floor(Math.random() * TRACK_COLORS.length)],
        order_index: count || 0,
        created_by: access.user!.id,
        is_collaborative: false, // Default to private (only creator can upload takes)
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, track };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error creating track:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Toggle collaborative mode for a track (only track creator can do this)
 */
export async function toggleTrackCollaborative(
  trackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current track
    const { data: track } = await supabase
      .from('project_tracks')
      .select('created_by, is_collaborative, project_id')
      .eq('id', trackId)
      .maybeSingle();

    if (!track) {
      return { success: false, error: 'Track not found' };
    }

    // Check project access
    const access = await checkProjectAccess(track.project_id);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    // Only the track creator can toggle collaborative mode
    if (track.created_by !== access.user!.id) {
      return { success: false, error: 'Only the track creator can change this setting' };
    }

    // Toggle the collaborative mode
    const { error } = await supabase
      .from('project_tracks')
      .update({ is_collaborative: !track.is_collaborative })
      .eq('id', trackId);

    if (error) throw error;

    revalidatePath(`/[locale]/projects/${track.project_id}/studio`, 'page');
    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error toggling collaborative mode:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create an empty track with auto-generated name (Audio 1, Audio 2, etc.)
 */
export async function createEmptyTrack(
  projectId: string
): Promise<{ success: boolean; track?: ProjectTrack; error?: string }> {
  try {
    const access = await checkProjectAccess(projectId);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    const supabase = await createClient();

    // Get current track count for auto-naming
    const { count } = await supabase
      .from('project_tracks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const trackNumber = (count || 0) + 1;
    const trackName = `Audio ${trackNumber}`;

    // Create empty track
    const { data: track, error } = await supabase
      .from('project_tracks')
      .insert({
        project_id: projectId,
        name: trackName,
        color: TRACK_COLORS[Math.floor(Math.random() * TRACK_COLORS.length)],
        order_index: count || 0,
        created_by: access.user!.id,
        is_collaborative: false,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, track };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error creating empty track:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update track name
 */
export async function updateTrackName(
  trackId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get track to verify it exists and get project_id
    const { data: track } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .maybeSingle();

    if (!track) {
      return { success: false, error: 'Track not found' };
    }

    // Check project access
    const access = await checkProjectAccess(track.project_id);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    const { error } = await supabase
      .from('project_tracks')
      .update({ name })
      .eq('id', trackId);

    if (error) throw error;

    revalidatePath(`/[locale]/projects/${track.project_id}/studio`, 'page');
    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error updating track name:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update track color
 */
export async function updateTrackColor(
  trackId: string,
  color: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get track to verify it exists and get project_id
    const { data: track } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .maybeSingle();

    if (!track) {
      return { success: false, error: 'Track not found' };
    }

    // Check project access
    const access = await checkProjectAccess(track.project_id);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    const { error } = await supabase
      .from('project_tracks')
      .update({ color })
      .eq('id', trackId);

    if (error) throw error;

    revalidatePath(`/[locale]/projects/${track.project_id}/studio`, 'page');
    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error updating track color:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update track name or color
 */
export async function updateTrack(
  trackId: string,
  updates: { name?: string; color?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get track to verify it exists and get project_id
    const { data: track } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .maybeSingle();

    if (!track) {
      return { success: false, error: 'Track not found' };
    }

    // Check project access
    const access = await checkProjectAccess(track.project_id);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    const { error } = await supabase
      .from('project_tracks')
      .update(updates)
      .eq('id', trackId);

    if (error) throw error;

    revalidatePath(`/[locale]/projects/${track.project_id}/studio`, 'page');
    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error updating track:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Duplicate a track (without takes)
 */
export async function duplicateTrack(
  trackId: string
): Promise<{ success: boolean; track?: ProjectTrack; error?: string }> {
  try {
    const supabase = await createClient();

    // Get original track
    const { data: originalTrack } = await supabase
      .from('project_tracks')
      .select('*')
      .eq('id', trackId)
      .maybeSingle();

    if (!originalTrack) {
      return { success: false, error: 'Track not found' };
    }

    // Check project access
    const access = await checkProjectAccess(originalTrack.project_id);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    // Get current track count for order_index
    const { count } = await supabase
      .from('project_tracks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', originalTrack.project_id);

    // Create duplicate track
    const { data: newTrack, error } = await supabase
      .from('project_tracks')
      .insert({
        project_id: originalTrack.project_id,
        name: `${originalTrack.name} (Copy)`,
        color: originalTrack.color,
        order_index: count || 0,
        created_by: access.user!.id,
        is_collaborative: originalTrack.is_collaborative,
      })
      .select()
      .single();

    if (error) throw error;

    // Duplicate all takes (references to same audio files)
    const { data: originalTakes } = await supabase
      .from('project_takes')
      .select('*')
      .eq('track_id', trackId);

    if (originalTakes && originalTakes.length > 0) {
      const duplicatedTakes = originalTakes.map((take) => ({
        track_id: newTrack.id,
        audio_url: take.audio_url, // Reference to same file
        duration: take.duration,
        waveform_data: take.waveform_data,
        file_size: take.file_size,
        file_format: take.file_format,
        is_active: take.is_active,
        uploaded_by: access.user!.id,
      }));

      await supabase.from('project_takes').insert(duplicatedTakes);
    }

    revalidatePath(`/[locale]/projects/${originalTrack.project_id}/studio`, 'page');
    return { success: true, track: newTrack };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error duplicating track:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a track and all its takes (including storage files)
 */
export async function deleteTrack(
  trackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get track and all takes before deletion
    const { data: track } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .maybeSingle();

    if (!track) {
      return { success: false, error: 'Track not found' };
    }

    // Check project access
    const access = await checkProjectAccess(track.project_id);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    // Get all takes to delete their files from storage
    const { data: takes } = await supabase
      .from('project_takes')
      .select('audio_url')
      .eq('track_id', trackId);

    // Delete audio files from storage
    if (takes && takes.length > 0) {
      const filePaths = takes
        .map(take => {
          const match = take.audio_url.match(/project-audio\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('project-audio')
          .remove(filePaths);

        if (storageError) {
          console.error('Error deleting files from storage:', storageError);
          // Continue anyway - we'll delete the database records
        }
      }
    }

    // Delete track (cascade will handle takes, comments, mixer_settings)
    const { error } = await supabase
      .from('project_tracks')
      .delete()
      .eq('id', trackId);

    if (error) throw error;

    revalidatePath(`/[locale]/projects/${track.project_id}/studio`, 'page');
    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error deleting track:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Reorder tracks by updating their order_index
 */
export async function reorderTracks(
  projectId: string,
  trackIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await checkProjectAccess(projectId);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    const supabase = await createClient();

    // Update order_index for each track
    for (let i = 0; i < trackIds.length; i++) {
      const { error } = await supabase
        .from('project_tracks')
        .update({ order_index: i })
        .eq('id', trackIds[i])
        .eq('project_id', projectId);

      if (error) throw error;
    }

    // Don't revalidate - let client handle UI updates optimistically
    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error reordering tracks:', err);
    return { success: false, error: err.message };
  }
}
