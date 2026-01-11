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
    const { count: existingTakesCount } = await supabase
      .from('project_takes')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId)

    const isFirstTake = existingTakesCount === 0

    // Create take record
    // For retakes (not first take), is_active defaults to false
    // For first take, the trigger will set it to true
    const { data: take, error: takeError } = await supabase
      .from('project_takes')
      .insert({
        track_id: trackId,
        audio_url: publicUrl,
        duration: 0, // Will be updated later if needed
        file_size: fileSize || null,
        file_format: fileFormat || null,
        is_active: isFirstTake, // Only first take is active, retakes are inactive by default
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

    return NextResponse.json({ success: true, take })
  } catch (error) {
    console.error('Finalize upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
