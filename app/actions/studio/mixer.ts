'use server';

import { createClient } from '@/lib/supabase/server';
import { UpdateMixerSettingsData } from '@/lib/types/studio';
import { SupabaseError } from './utils';

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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Use upsert to insert if not exists, update if exists
    console.log('🔧 Attempting to upsert mixer settings:', {
      track_id: trackId,
      user_id: user.id,
      settings
    });

    const { data, error } = await supabase
      .from('project_mixer_settings')
      .upsert(
        {
          track_id: trackId,
          user_id: user.id,
          ...settings,
        },
        {
          onConflict: 'track_id,user_id',
        }
      )
      .select();

    console.log('🔧 Upsert result:', { data, error });

    if (error) {
      console.error('❌ Upsert error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    // Don't revalidate here - let the client handle UI updates optimistically
    // revalidatePath would cause a page reload which defeats the purpose

    return { success: true };
  } catch (error: unknown) {
    const err = error as SupabaseError;
    console.error('Error updating mixer settings:', err);
    return { success: false, error: err.message };
  }
}
