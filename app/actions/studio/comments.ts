'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ProjectTrackComment } from '@/lib/types/studio';
import { SupabaseError, checkProjectAccess } from './utils';

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

    // Get track to verify access to the project
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

    const { data: comment, error } = await supabase
      .from('project_track_comments')
      .insert({
        track_id: trackId,
        user_id: access.user!.id,
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
      .eq('id', access.user!.id)
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

    // Get comment with track and project info
    const { data: comment } = await supabase
      .from('project_track_comments')
      .select('user_id, track_id, project_tracks(project_id)')
      .eq('id', commentId)
      .maybeSingle();

    if (!comment) {
      return { success: false, error: 'Comment not found' };
    }

    // Get project_id from the nested relation
    const projectTracks = Array.isArray(comment.project_tracks)
      ? comment.project_tracks[0]
      : comment.project_tracks;

    if (!projectTracks || !('project_id' in projectTracks)) {
      return { success: false, error: 'Project not found' };
    }

    const projectId = projectTracks.project_id;

    // Check project access
    const access = await checkProjectAccess(projectId);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    // Only the comment creator can delete their own comment
    if (comment.user_id !== access.user!.id) {
      return { success: false, error: 'You can only delete your own comments' };
    }

    const { error } = await supabase
      .from('project_track_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    revalidatePath(`/[locale]/projects/${projectId}/studio`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error deleting comment:', err);
    return { success: false, error: err.message };
  }
}
