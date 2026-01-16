import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/repositories/[id]/commits
 * Get commit history for a repository (all branches or specific branch)
 * Query params: ?branchId=xxx (optional)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const repositoryId = params.id
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    // Verify user has access to repository
    const { data: repo } = await supabase
      .from('repositories')
      .select('project_id')
      .eq('id', repositoryId)
      .single()

    if (!repo) {
      return NextResponse.json({
        success: false,
        error: 'Repository not found'
      }, { status: 404 })
    }

    // Build query for commits
    let query = supabase
      .from('commits')
      .select(`
        *,
        author:profiles!commits_author_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        ),
        branch:branches!commits_branch_id_fkey (
          id,
          name
        )
      `)
      .eq('repository_id', repositoryId)
      .order('created_at', { ascending: false })

    // Filter by branch if specified
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data: commits, error: commitsError } = await query

    if (commitsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch commits'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      commits
    })

  } catch (error) {
    console.error('Get commits error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
