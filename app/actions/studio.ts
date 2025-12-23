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
      .maybeSingle();

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
        .maybeSingle();

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
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error creating track:', err);
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
      .maybeSingle();

    if (track) {
      revalidatePath(`/[locale]/projects/${track.project_id}/studio`);
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error updating track:', err);
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

    revalidatePath(`/[locale]/projects/${track.project_id}/studio`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error deleting track:', err);
    return { success: false, error: err.message };
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
interface SupabaseError {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

export async function uploadTake(
  trackId: string,
  formData: FormData
): Promise<{ success: boolean; take?: ProjectTake; error?: string; errorDetails?: SupabaseError }> {
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
      .maybeSingle();

    if (!track) {
      return { success: false, error: 'Track not found' };
    }

    // Get project and check access
    const { data: project } = await supabase
      .from('projects')
      .select('id, owner_id, club_id')
      .eq('id', track.project_id)
      .maybeSingle();

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
        .maybeSingle();

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
    console.log('Uploading to storage:', filePath);
    const { error: uploadError } = await supabase.storage
      .from('project-audio')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }
    console.log('Storage upload successful');

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
    console.log('Creating take record:', {
      id: takeId,
      track_id: trackId,
      audio_url: publicUrl,
      duration,
      file_size: file.size,
      file_format: fileExt,
    });

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
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      throw insertError;
    }
    console.log('Take record created successfully:', take);

    revalidatePath(`/[locale]/projects/${track.project_id}/studio`);
    return { success: true, take };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error uploading take:', err);
    return {
      success: false,
      error: err.message,
      errorDetails: {
        code: err.code,
        details: err.details,
        hint: err.hint,
        message: err.message,
      }
    };
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
      .maybeSingle();

    if (take && take.project_tracks) {
      const projectTracks = take.project_tracks as { project_id: string };
      revalidatePath(`/[locale]/projects/${projectTracks.project_id}/studio`);
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error setting active take:', err);
    return { success: false, error: err.message };
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
      .maybeSingle();

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
      const projectTracks = take.project_tracks as { project_id: string };
      revalidatePath(`/[locale]/projects/${projectTracks.project_id}/studio`);
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error deleting take:', err);
    return { success: false, error: err.message };
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

    // Get user profile for the comment
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    return {
      success: true,
      comment: {
        ...comment,
        profile: profile || null,
      }
    };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error adding comment:', err);
    return { success: false, error: err.message };
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
      .maybeSingle();

    const { error } = await supabase
      .from('project_track_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    if (comment && comment.project_tracks) {
      const projectTracks = comment.project_tracks as { project_id: string };
      revalidatePath(`/[locale]/projects/${projectTracks.project_id}/studio`);
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error deleting comment:', err);
    return { success: false, error: err.message };
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
      .maybeSingle();

    if (track) {
      revalidatePath(`/[locale]/projects/${track.project_id}/studio`);
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error updating mixer settings:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all tracks with their details for a project
 */
export async function getProjectStudioData(projectId: string) {
  try {
    const supabase = await createClient();

    // Get all tracks
    const { data: tracks, error: tracksError } = await supabase
      .from('project_tracks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index');

    if (tracksError) throw tracksError;

    if (!tracks || tracks.length === 0) {
      return { success: true, tracks: [] };
    }

    const trackIds = tracks.map(t => t.id);

    // Get all takes for these tracks
    const { data: takes } = await supabase
      .from('project_takes')
      .select('*')
      .in('track_id', trackIds)
      .order('created_at', { ascending: false });

    // Get all comments for these tracks
    const { data: comments } = await supabase
      .from('project_track_comments')
      .select('*')
      .in('track_id', trackIds)
      .order('timestamp');

    // Get all mixer settings for these tracks
    const { data: mixerSettings } = await supabase
      .from('project_mixer_settings')
      .select('*')
      .in('track_id', trackIds);

    // Get user profiles for comments and takes
    const commentUserIds = comments?.map(c => c.user_id).filter(Boolean) || [];
    const takeUserIds = takes?.map(t => t.uploaded_by).filter(Boolean) || [];
    const allUserIds = [...new Set([...commentUserIds, ...takeUserIds])];

    const { data: profiles } = allUserIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', allUserIds)
      : { data: [] };

    // Merge data together
    const tracksWithDetails = tracks.map(track => ({
      ...track,
      takes: takes
        ?.filter(t => t.track_id === track.id)
        .map(take => ({
          ...take,
          uploader: profiles?.find(p => p.id === take.uploaded_by) || null,
        })) || [],
      comments: comments
        ?.filter(c => c.track_id === track.id)
        .map(comment => ({
          ...comment,
          profile: profiles?.find(p => p.id === comment.user_id) || null,
        })) || [],
      mixer_settings: mixerSettings?.find(m => m.track_id === track.id) || null,
    }));

    return { success: true, tracks: tracksWithDetails };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error fetching studio data:', err);
    return { success: false, error: err.message, tracks: [] };
  }
}
