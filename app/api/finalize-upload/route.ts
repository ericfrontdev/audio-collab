import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Finalize the audio upload by creating the take record in the database
 * This is called after the file has been uploaded directly to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trackId, filePath, fileSize, fileFormat, waveformData } = body

    if (!trackId || !filePath) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: trackId, filePath'
      }, { status: 400 })
    }

    // Verify track exists
    const { data: track, error: trackError } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .single()

    if (trackError || !track) {
      return NextResponse.json({
        success: false,
        error: 'Track not found'
      }, { status: 404 })
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('project-audio')
      .getPublicUrl(filePath)

    // Check if this is the first take for this track
    const { data: trackData, error: trackDataError } = await supabase
      .from('project_tracks')
      .select('active_take_id')
      .eq('id', trackId)
      .single()

    if (trackDataError || !trackData) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch track data'
      }, { status: 500 })
    }

    const isFirstTake = trackData.active_take_id === null

    // Create take record (no is_active column anymore)
    const { data: take, error: takeError } = await supabase
      .from('project_takes')
      .insert({
        track_id: trackId,
        audio_url: publicUrl,
        duration: 0,
        file_size: fileSize || null,
        file_format: fileFormat || null,
        uploaded_by: user.id,
        waveform_data: waveformData || null,
      })
      .select()
      .single()

    if (takeError) {
      console.error('Take creation error:', takeError)
      // Try to delete the uploaded file
      await supabase.storage.from('project-audio').remove([filePath])
      return NextResponse.json({
        success: false,
        error: 'Failed to create take record',
        errorDetails: takeError
      }, { status: 500 })
    }

    // If this is the first take, set it as active on the track
    if (isFirstTake && take) {
      const { error: updateError } = await supabase
        .from('project_tracks')
        .update({ active_take_id: take.id })
        .eq('id', trackId)

      if (updateError) {
        console.error('Failed to set active take:', updateError)
        // Don't fail the whole operation, just log
      }
    }

    return NextResponse.json({ success: true, take })
  } catch (error) {
    console.error('Finalize upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
