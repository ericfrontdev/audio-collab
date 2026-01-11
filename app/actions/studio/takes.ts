'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ProjectTake } from '@/lib/types/studio';
import { SupabaseError, checkProjectAccess } from './utils';

/**
 * ============================================================================
 * TAKE ACTIONS
 * ============================================================================
 */

/**
 * Upload audio file to storage and create take record
 *
 * Note: Duration and waveform data extraction is currently done client-side
 * before the file is uploaded. The client generates waveform peaks using the
 * Web Audio API and passes them in the audio metadata. Server-side extraction
 * would require additional processing resources and add latency to uploads.
 */
export async function uploadTake(
  trackId: string,
  formData: FormData
): Promise<{ success: boolean; take?: ProjectTake; error?: string; errorDetails?: SupabaseError }> {
  try {
    const supabase = await createClient();

    // Get track info
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

    // Duration and waveform data are extracted client-side before upload
    // Using placeholder values here - real values should be passed from client
    const duration = 0;
    const waveform_data = [] as number[];

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
        uploaded_by: access.user!.id,
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

    revalidatePath(`/[locale]/projects/${track.project_id}/studio`, 'page');
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

    // Get take info to verify access
    const { data: take } = await supabase
      .from('project_takes')
      .select('track_id, project_tracks(project_id)')
      .eq('id', takeId)
      .maybeSingle();

    if (!take) {
      return { success: false, error: 'Take not found' };
    }

    // Get project_id from the nested relation
    const projectTracks = Array.isArray(take.project_tracks)
      ? take.project_tracks[0]
      : take.project_tracks;

    if (!projectTracks || !('project_id' in projectTracks)) {
      return { success: false, error: 'Project not found' };
    }

    const projectId = projectTracks.project_id;

    // Check project access
    const access = await checkProjectAccess(projectId);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    // Update track to point to this take
    const { error } = await supabase
      .from('project_tracks')
      .update({ active_take_id: takeId })
      .eq('id', take.track_id);

    if (error) throw error;

    revalidatePath(`/[locale]/projects/${projectId}/studio`, 'page');
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

    // Get project_id from the nested relation
    const projectTracks = Array.isArray(take.project_tracks)
      ? take.project_tracks[0]
      : take.project_tracks;

    if (!projectTracks || !('project_id' in projectTracks)) {
      return { success: false, error: 'Project not found' };
    }

    const projectId = projectTracks.project_id;

    // Check project access
    const access = await checkProjectAccess(projectId);
    if (!access.success) {
      return { success: false, error: access.error };
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

    // Don't revalidate - the client handles optimistic update
    // revalidatePath would cause unnecessary page reloads (3 POST requests)
    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error deleting take:', err);
    return { success: false, error: err.message };
  }
}
