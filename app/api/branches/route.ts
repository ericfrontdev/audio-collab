import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/branches
 * Create a new branch from an existing commit
 *
 * Body: {
 *   repositoryId: string
 *   name: string
 *   sourceCommitId: string (the commit to branch from)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { repositoryId, name, sourceCommitId } = body

    if (!repositoryId || !name || !sourceCommitId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: repositoryId, name, sourceCommitId'
      }, { status: 400 })
    }

    // Verify user has access to repository
    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('project_id')
      .eq('id', repositoryId)
      .single()

    if (repoError || !repo) {
      return NextResponse.json({
        success: false,
        error: 'Repository not found'
      }, { status: 404 })
    }

    // Verify source commit exists and belongs to this repository
    const { data: sourceCommit, error: commitError } = await supabase
      .from('commits')
      .select('id')
      .eq('id', sourceCommitId)
      .eq('repository_id', repositoryId)
      .single()

    if (commitError || !sourceCommit) {
      return NextResponse.json({
        success: false,
        error: 'Source commit not found in this repository'
      }, { status: 404 })
    }

    // Check if branch name already exists in this repository
    const { data: existingBranch } = await supabase
      .from('branches')
      .select('id')
      .eq('repository_id', repositoryId)
      .eq('name', name)
      .single()

    if (existingBranch) {
      return NextResponse.json({
        success: false,
        error: `Branch "${name}" already exists`
      }, { status: 409 })
    }

    // Create new branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({
        repository_id: repositoryId,
        name: name,
        head_commit_id: sourceCommitId,
        created_by: user.id
      })
      .select()
      .single()

    if (branchError) {
      console.error('Branch creation error:', branchError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create branch',
        details: branchError
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      branch
    })

  } catch (error) {
    console.error('Branch API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
