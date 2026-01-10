'use server';

import { createClient } from '@/lib/supabase/server';
import { SupabaseError } from './utils';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Get all tracks with their details for a project
 */
export async function getProjectStudioData(projectId: string) {
  // Disable Next.js caching for this function
  noStore();

  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

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

    // Get all comped sections for these tracks
    const { data: compedSections } = await supabase
      .from('project_comped_sections')
      .select('*')
      .in('track_id', trackIds)
      .order('start_time', { ascending: true });

    // Get all comments for these tracks
    const { data: comments } = await supabase
      .from('project_track_comments')
      .select('*')
      .in('track_id', trackIds)
      .order('timestamp');

    // Get mixer settings for these tracks (filtered by current user)
    const { data: mixerSettings } = user
      ? await supabase
          .from('project_mixer_settings')
          .select('*')
          .in('track_id', trackIds)
          .eq('user_id', user.id)
      : { data: [] };

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
      compedSections: compedSections?.filter(s => s.track_id === track.id) || [],
      isRetakeFolderOpen: track.is_retake_folder_open || false,
      mixer_settings: mixerSettings?.find(m => m.track_id === track.id) || null,
    }));

    return { success: true, tracks: tracksWithDetails };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error fetching studio data:', err);
    return { success: false, error: err.message, tracks: [] };
  }
}
