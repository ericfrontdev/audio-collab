import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configure body size limit for this route
export const maxDuration = 60 // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const trackId = formData.get('trackId') as string
    const waveformDataString = formData.get('waveformData') as string | null

    console.log('Upload request - trackId:', trackId, 'audioFile:', audioFile?.name)

    if (!audioFile || !trackId) {
      console.error('Missing data - audioFile:', !!audioFile, 'trackId:', !!trackId)
      return NextResponse.json({ success: false, error: 'Missing audio file or track ID' }, { status: 400 })
    }

    // Parse waveform data if provided
    let waveformData: number[] | null = null
    if (waveformDataString) {
      try {
        waveformData = JSON.parse(waveformDataString)
        if (waveformData) {
          console.log('Waveform data received:', waveformData.length, 'samples')
        }
      } catch (error) {
        console.warn('Failed to parse waveform data:', error)
      }
    }

    // Get track info
    const { data: track, error: trackError } = await supabase
      .from('project_tracks')
      .select('project_id')
      .eq('id', trackId)
      .single()

    console.log('Track query result - track:', track, 'error:', trackError)

    if (trackError || !track) {
      console.error('Track not found - trackId:', trackId, 'error:', trackError)
      return NextResponse.json({
        success: false,
        error: 'Track not found',
        debug: { trackId, error: trackError }
      }, { status: 404 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = audioFile.name.split('.').pop()
    const fileName = `${trackId}_${timestamp}.${fileExtension}`
    const filePath = `takes/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-audio')
      .upload(filePath, audioFile, {
        contentType: audioFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file',
        errorDetails: uploadError
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-audio')
      .getPublicUrl(filePath)

    // Deactivate all existing takes for this track
    await supabase
      .from('project_takes')
      .update({ is_active: false })
      .eq('track_id', trackId)

    // Create take record
    const { data: take, error: takeError } = await supabase
      .from('project_takes')
      .insert({
        track_id: trackId,
        audio_url: publicUrl,
        duration: 0, // Will be updated later
        file_size: audioFile.size,
        file_format: fileExtension,
        is_active: true,
        uploaded_by: user.id,
        waveform_data: waveformData, // Store pre-computed waveform peaks
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
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
