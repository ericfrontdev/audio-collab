'use server';

import { createClient } from '@/lib/supabase/server';

export async function testDatabaseConnection() {
  try {
    const supabase = await createClient();

    // Test 1: Check if we can connect
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Test 2: Try to query project_tracks table
    const { data: tracks, error: tracksError } = await supabase
      .from('project_tracks')
      .select('id')
      .limit(1);

    // Test 3: Try to query projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    // Test 4: List storage buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    return {
      success: true,
      tests: {
        auth: {
          success: !authError,
          hasUser: !!user,
          error: authError?.message,
        },
        project_tracks_table: {
          success: !tracksError,
          exists: !tracksError,
          error: tracksError?.message,
          errorCode: (tracksError as any)?.code,
        },
        projects_table: {
          success: !projectsError,
          exists: !projectsError,
          error: projectsError?.message,
        },
        storage_buckets: {
          success: !bucketsError,
          buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })) || [],
          hasProjectAudio: buckets?.some(b => b.id === 'project-audio') || false,
          error: bucketsError?.message,
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
}
