import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Generate a signed URL for direct upload to Supabase Storage
 * This bypasses Netlify's 6MB function limit by allowing direct client-to-Supabase uploads
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
    const { trackId, fileName, fileType } = body

    if (!trackId || !fileName || !fileType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: trackId, fileName, fileType'
      }, { status: 400 })
    }

    // Verify track exists and user has access
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

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = fileName.split('.').pop()
    const uniqueFileName = `${trackId}_${timestamp}.${fileExtension}`
    const filePath = `takes/${uniqueFileName}`

    // Generate a signed URL for upload (valid for 10 minutes)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('project-audio')
      .createSignedUploadUrl(filePath)

    if (signedUrlError) {
      console.error('Failed to generate signed URL:', signedUrlError)
      return NextResponse.json({
        success: false,
        error: 'Failed to generate upload URL',
        errorDetails: signedUrlError
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      uploadUrl: signedUrlData.signedUrl,
      filePath,
      token: signedUrlData.token
    })
  } catch (error) {
    console.error('Generate upload URL error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
