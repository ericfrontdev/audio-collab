import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import archiver from 'archiver'
import { Readable } from 'stream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for large projects

/**
 * POST /api/repositories/[id]/clone
 * Download entire project as ZIP with all commits and stems
 *
 * Body: {
 *   branchId?: string (optional, defaults to default branch)
 * }
 */
export async function POST(
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
    const body = await request.json()
    const branchId = body.branchId

    // Get repository info
    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select(`
        *,
        project:projects!repositories_project_id_fkey (
          id,
          name
        )
      `)
      .eq('id', repositoryId)
      .single()

    if (repoError || !repo) {
      return NextResponse.json({
        success: false,
        error: 'Repository not found'
      }, { status: 404 })
    }

    // Get target branch (or default branch)
    let targetBranch
    if (branchId) {
      const { data: branch } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .eq('repository_id', repositoryId)
        .single()
      targetBranch = branch
    } else {
      const { data: branch } = await supabase
        .from('branches')
        .select('*')
        .eq('repository_id', repositoryId)
        .eq('name', repo.default_branch)
        .single()
      targetBranch = branch
    }

    if (!targetBranch) {
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
        stems (
          *,
          audio_file:file_storage!stems_audio_file_id_fkey (*)
        ),
        author:profiles!commits_author_id_fkey (
          username,
          display_name
        )
      `)
      .eq('branch_id', targetBranch.id)
      .order('created_at', { ascending: true })

    if (commitsError || !commits) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch commits'
      }, { status: 500 })
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    // Create metadata file
    const metadata = {
      project: {
        id: repo.project_id,
        name: repo.project.name
      },
      repository: {
        id: repo.id,
        default_branch: repo.default_branch
      },
      branch: {
        id: targetBranch.id,
        name: targetBranch.name
      },
      cloned_at: new Date().toISOString(),
      cloned_by: user.id,
      commits: commits.map(c => ({
        id: c.id,
        message: c.message,
        author: c.author?.username || 'unknown',
        created_at: c.created_at,
        stems: c.stems?.map(s => ({
          track_name: s.track_name,
          track_index: s.track_index,
          stem_type: s.stem_type,
          audio_file_path: s.audio_file?.storage_path || null,
          fx_settings: s.fx_settings
        })) || []
      }))
    }

    archive.append(JSON.stringify(metadata, null, 2), { name: 'project.json' })

    // Add all audio files
    const filePromises = []
    for (const commit of commits) {
      if (!commit.stems) continue

      for (const stem of commit.stems) {
        if (!stem.audio_file?.storage_path) continue

        // Download file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('audio-commits')
          .download(stem.audio_file.storage_path)

        if (downloadError) {
          console.error('Failed to download:', stem.audio_file.storage_path, downloadError)
          continue
        }

        // Add to archive
        const buffer = await fileData.arrayBuffer()
        const fileName = `stems/${stem.audio_file.file_hash}.${stem.audio_file.file_format}`
        archive.append(Buffer.from(buffer), { name: fileName })
      }
    }

    // Finalize archive
    archive.finalize()

    // Convert archive stream to response
    const chunks: Uint8Array[] = []
    for await (const chunk of archive) {
      chunks.push(chunk)
    }
    const zipBuffer = Buffer.concat(chunks)

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${repo.project.name}_${targetBranch.name}.zip"`
      }
    })

  } catch (error) {
    console.error('Clone repository error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
