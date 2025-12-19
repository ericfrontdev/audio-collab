'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  ProjectTrack,
  ProjectTake,
  ProjectTrackComment,
  ProjectMixerSettings,
  CreateTrackData,
  CreateCommentData,
  UpdateMixerSettingsData,
  TRACK_COLORS,
} from '@/lib/types/studio';

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
    const supabase = await createClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get project and check access
    const { data: project } = await supabase
      .from('projects')
      .select('id, owner_id, club_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Check if user is project owner or club member
    const isOwner = project.owner_id === user.id;
    let isMember = isOwner;

    if (project.club_id && !isOwner) {
      const { data: clubMembership } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', project.club_id)
        .eq('user_id', user.id)
        .single();

      isMember = !!clubMembership;
    }

    if (!isMember) {
      return { success: false, error: 'You are not a member of this project' };
    }

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
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/[locale]/projects/${projectId}/studio`);
    return { success: true, track };
  } catch (error: any) {
    console.error('Error creating track:', error);
    return { success: false, error: error.message };
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

    const { error } = await supabase
      .from('project_tracks')
      .update(updates)
      .eq('id', trackId);

    if (error) throw error;

    // Get project_id for revalidation
    const { data: track } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .single();

    if (track) {
      revalidatePath(`/[locale]/projects/${track.project_id}/studio`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating track:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a track and all its takes
 */
export async function deleteTrack(
  trackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get project_id before deletion
    const { data: track } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .single();

    // Delete track (cascade will handle takes, comments, mixer_settings)
    const { error } = await supabase
      .from('project_tracks')
      .delete()
      .eq('id', trackId);

    if (error) throw error;

    if (track) {
      revalidatePath(`/[locale]/projects/${track.project_id}/studio`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting track:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ============================================================================
 * TAKE ACTIONS
 * ============================================================================
 */

/**
 * Extract waveform data from audio file
 */
async function extractWaveformData(audioBuffer: ArrayBuffer): Promise<number[]> {
  // This is a simplified version - in production, you'd use Web Audio API
  // For now, we'll just create dummy peaks
  // TODO: Implement proper waveform extraction using Web Audio API
  const peaks: number[] = [];
  const numPeaks = 1000; // Number of peaks to generate

  for (let i = 0; i < numPeaks; i++) {
    // Generate random peaks for now (will be replaced with real extraction)
    peaks.push(Math.random() * 2 - 1);
  }

  return peaks;
}

/**
 * Upload audio file to storage and create take record
 */
export async function uploadTake(
  trackId: string,
  formData: FormData
): Promise<{ success: boolean; take?: ProjectTake; error?: string }> {
  try {
    const supabase = await createClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get track info
    const { data: track } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .single();

    if (!track) {
      return { success: false, error: 'Track not found' };
    }

    // Get project and check access
    const { data: project } = await supabase
      .from('projects')
      .select('id, owner_id, club_id')
      .eq('id', track.project_id)
      .single();

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Check if user is project owner or club member
    const isOwner = project.owner_id === user.id;
    let isMember = isOwner;

    if (project.club_id && !isOwner) {
      const { data: clubMembership } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', project.club_id)
        .eq('user_id', user.id)
        .single();

      isMember = !!clubMembership;
    }

    if (!isMember) {
      return { success: false, error: 'You are not a member of this project' };
    }

    // Get file from form data
    const file = formData.get('audio') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const takeId = crypto.randomUUID();
    const filePath = `${track.project_id}/${trackId}/${takeId}.${fileExt}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('project-audio')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-audio')
      .getPublicUrl(filePath);

    // Extract audio metadata (duration, waveform)
    // For now, we'll use dummy values - in production, this would be done client-side
    // or using a worker/edge function
    const duration = 0; // TODO: Extract real duration
    const waveform_data = [] as number[]; // TODO: Extract real waveform

    // Create take record
    const { data: take, error: insertError } = await supabase
      .from('project_takes')
      .insert({
        id: takeId,
        track_id: trackId,
        audio_url: publicUrl,
        duration,
        waveform_data,
        file_size: file.size,
        file_format: fileExt,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    revalidatePath(`/[locale]/projects/${track.project_id}/studio`);
    return { success: true, take };
  } catch (error: any) {
    console.error('Error uploading take:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Set a take as the active take for its track
 */
export async function setActiveTake(
  takeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Update the take to be active (trigger will handle deactivating others)
    const { error } = await supabase
      .from('project_takes')
      .update({ is_active: true })
      .eq('id', takeId);

    if (error) throw error;

    // Get project_id for revalidation
    const { data: take } = await supabase
      .from('project_takes')
      .select('track_id, project_tracks(project_id)')
      .eq('id', takeId)
      .single();

    if (take && take.project_tracks) {
      const projectId = (take.project_tracks as any).project_id;
      revalidatePath(`/[locale]/projects/${projectId}/studio`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error setting active take:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a take (only if it's not the last one)
 */
export async function deleteTake(
  takeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get take info
    const { data: take } = await supabase
      .from('project_takes')
      .select('track_id, audio_url, project_tracks(project_id)')
      .eq('id', takeId)
      .single();

    if (!take) {
      return { success: false, error: 'Take not found' };
    }

    // Check if this is the last take for the track
    const { count } = await supabase
      .from('project_takes')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', take.track_id);

    if (count && count <= 1) {
      return { success: false, error: 'Cannot delete the last take of a track' };
    }

    // Delete from storage
    const pathMatch = take.audio_url.match(/project-audio\/(.+)$/);
    if (pathMatch) {
      await supabase.storage
        .from('project-audio')
        .remove([pathMatch[1]]);
    }

    // Delete take record
    const { error } = await supabase
      .from('project_takes')
      .delete()
      .eq('id', takeId);

    if (error) throw error;

    if (take.project_tracks) {
      const projectId = (take.project_tracks as any).project_id;
      revalidatePath(`/[locale]/projects/${projectId}/studio`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting take:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ============================================================================
 * COMMENT ACTIONS
 * ============================================================================
 */

/**
 * Add a comment to a track at a specific timestamp
 */
export async function addTrackComment(
  trackId: string,
  timestamp: number,
  text: string
): Promise<{ success: boolean; comment?: ProjectTrackComment; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: comment, error } = await supabase
      .from('project_track_comments')
      .insert({
        track_id: trackId,
        user_id: user.id,
        timestamp,
        text,
      })
      .select()
      .single();

    if (error) throw error;

    // Get project_id for revalidation
    const { data: track } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .single();

    if (track) {
      revalidatePath(`/[locale]/projects/${track.project_id}/studio`);
    }

    return { success: true, comment };
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a comment (users can only delete their own)
 */
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get project_id before deletion
    const { data: comment } = await supabase
      .from('project_track_comments')
      .select('track_id, project_tracks(project_id)')
      .eq('id', commentId)
      .single();

    const { error } = await supabase
      .from('project_track_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    if (comment && comment.project_tracks) {
      const projectId = (comment.project_tracks as any).project_id;
      revalidatePath(`/[locale]/projects/${projectId}/studio`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ============================================================================
 * MIXER ACTIONS
 * ============================================================================
 */

/**
 * Update mixer settings for a track
 */
export async function updateMixerSettings(
  trackId: string,
  settings: UpdateMixerSettingsData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('project_mixer_settings')
      .update(settings)
      .eq('track_id', trackId);

    if (error) throw error;

    // Get project_id for revalidation
    const { data: track } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .single();

    if (track) {
      revalidatePath(`/[locale]/projects/${track.project_id}/studio`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating mixer settings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all tracks with their details for a project
 */
export async function getProjectStudioData(projectId: string) {
  try {
    const supabase = await createClient();

    // Get all tracks with their related data
    const { data: tracks, error } = await supabase
      .from('project_tracks')
      .select(`
        *,
        takes:project_takes(*),
        comments:project_track_comments(*, profile:profiles(*)),
        mixer_settings:project_mixer_settings(*)
      `)
      .eq('project_id', projectId)
      .order('order_index');

    if (error) throw error;

    return { success: true, tracks };
  } catch (error: any) {
    console.error('Error fetching studio data:', error);
    return { success: false, error: error.message, tracks: [] };
  }
}
