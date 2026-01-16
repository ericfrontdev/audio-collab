import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/commits
 * Create a new commit with stems
 *
 * Body: {
 *   repositoryId: string
 *   branchId: string
 *   message: string
 *   stems: Array<{
 *     trackName: string
 *     trackIndex: number
 *     trackColor: string
 *     stemType: 'audio' | 'midi' | 'both'
 *     audioFile?: File
 *     midiData?: object
 *     fxSettings?: {
 *       eq?: { low: number, mid: number, high: number }
 *       compressor?: { threshold: number, ratio: number, attack: number, release: number }
 *       reverb?: { decay: number, wet: number }
 *     }
 *   }>
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

    // Get form data
    const formData = await request.formData()
    const repositoryId = formData.get('repositoryId') as string
    const branchId = formData.get('branchId') as string
    const message = formData.get('message') as string
    const stemsDataString = formData.get('stemsData') as string

    if (!repositoryId || !branchId || !message || !stemsDataString) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Parse stems metadata
    const stemsData = JSON.parse(stemsDataString)

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

    // Get parent commit (head of branch)
    const { data: branch } = await supabase
      .from('branches')
      .select('head_commit_id')
      .eq('id', branchId)
      .single()

    // Create commit
    const { data: commit, error: commitError } = await supabase
      .from('commits')
      .insert({
        repository_id: repositoryId,
        branch_id: branchId,
        parent_commit_id: branch?.head_commit_id || null,
        author_id: user.id,
        message: message
      })
      .select()
      .single()

    if (commitError) {
      console.error('Commit creation error:', commitError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create commit',
        details: commitError
      }, { status: 500 })
    }

    // Process each stem
    const stems = []
    for (let i = 0; i < stemsData.length; i++) {
      const stemData = stemsData[i]
      const audioFile = formData.get(`stem_${i}_audio`) as File | null

      let audioFileId = null

      // Handle audio file upload
      if (audioFile && stemData.stemType !== 'midi') {
        // Calculate file hash for deduplication
        const arrayBuffer = await audioFile.arrayBuffer()
        const hash = crypto.createHash('sha256').update(Buffer.from(arrayBuffer)).digest('hex')

        // Check if file already exists
        const { data: existingFile } = await supabase
          .from('file_storage')
          .select('id')
          .eq('file_hash', hash)
          .single()

        if (existingFile) {
          // File exists, reuse it
          audioFileId = existingFile.id

          // Increment reference count
          await supabase.rpc('increment_file_reference', { file_id: existingFile.id })
        } else {
          // Upload new file
          const fileName = `${hash}.${audioFile.name.split('.').pop()}`
          const filePath = `projects/${repo.project_id}/commits/${commit.id}/${fileName}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('audio-commits')
            .upload(filePath, audioFile, {
              contentType: audioFile.type,
              upsert: false
            })

          if (uploadError) {
            console.error('Storage upload error:', uploadError)
            continue // Skip this stem but continue with others
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('audio-commits')
            .getPublicUrl(filePath)

          // Create file_storage entry
          const { data: fileStorage, error: fileError } = await supabase
            .from('file_storage')
            .insert({
              file_hash: hash,
              storage_url: publicUrl,
              storage_path: filePath,
              file_size_bytes: audioFile.size,
              file_format: audioFile.name.split('.').pop() || 'unknown',
              mime_type: audioFile.type,
              duration: stemData.duration || null,
              uploaded_by: user.id,
              reference_count: 1
            })
            .select()
            .single()

          if (fileError) {
            console.error('File storage creation error:', fileError)
            continue
          }

          audioFileId = fileStorage.id
        }
      }

      // Create stem entry
      const { data: stem, error: stemError } = await supabase
        .from('stems')
        .insert({
          commit_id: commit.id,
          track_name: stemData.trackName,
          track_index: stemData.trackIndex,
          track_color: stemData.trackColor,
          stem_type: stemData.stemType,
          audio_file_id: audioFileId,
          midi_data: stemData.midiData || null,
          fx_settings: stemData.fxSettings || null,
          audio_url: audioFileId ? null : stemData.audioUrl, // For backward compat
          duration: stemData.duration,
          waveform_data: stemData.waveformData
        })
        .select()
        .single()

      if (!stemError) {
        stems.push(stem)
      }
    }

    // Update branch head to point to new commit
    await supabase
      .from('branches')
      .update({ head_commit_id: commit.id })
      .eq('id', branchId)

    return NextResponse.json({
      success: true,
      commit,
      stems
    })

  } catch (error) {
    console.error('Commit API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
