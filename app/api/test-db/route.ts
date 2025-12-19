import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
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

    return NextResponse.json({
      success: true,
      tests: {
        auth: {
          success: !authError,
          user: user ? { id: user.id } : null,
          error: authError?.message,
        },
        project_tracks_table: {
          success: !tracksError,
          count: tracks?.length || 0,
          error: tracksError?.message,
        },
        projects_table: {
          success: !projectsError,
          count: projects?.length || 0,
          error: projectsError?.message,
        },
        storage_buckets: {
          success: !bucketsError,
          buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })) || [],
          error: bucketsError?.message,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
