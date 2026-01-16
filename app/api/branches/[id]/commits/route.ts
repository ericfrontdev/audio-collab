import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/branches/[id]/commits
 * Get all commits for a specific branch
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

    const { id: branchId } = await params

    // Get branch info and verify access
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select(`
        *,
        repository:repositories!branches_repository_id_fkey (
          id,
          project_id
        )
      `)
      .eq('id', branchId)
      .single()

    if (branchError || !branch) {
      return NextResponse.json({
        success: false,
        error: 'Branch not found'
      }, { status: 404 })
    }

    // Get all commits for this branch
    const { data: commits, error: commitsError } = await supabase
      .from('commits')
      .select(`
        *,
        author:profiles!commits_author_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        ),
        stems (
          id,
          track_name,
          track_index,
          track_color,
          stem_type,
          duration
        )
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    if (commitsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch commits'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      branch: {
        id: branch.id,
        name: branch.name,
        head_commit_id: branch.head_commit_id,
        repository_id: branch.repository_id
      },
      commits
    })

  } catch (error) {
    console.error('Get branch commits error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
