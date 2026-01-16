import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/commits/[id]
 * Get a specific commit with its stems
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: commitId } = await params

    // Get commit with stems
    const { data: commit, error: commitError } = await supabase
      .from('commits')
      .select(`
        *,
        stems (*,
          audio_file:file_storage!stems_audio_file_id_fkey (*)
        ),
        author:profiles!commits_author_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('id', commitId)
      .single()

    if (commitError || !commit) {
      return NextResponse.json({
        success: false,
        error: 'Commit not found'
      }, { status: 404 })
    }

    // Verify user has access to this commit's repository
    const { data: repo } = await supabase
      .from('repositories')
      .select('project_id')
      .eq('id', commit.repository_id)
      .single()

    if (!repo) {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      commit
    })

  } catch (error) {
    console.error('Get commit error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
