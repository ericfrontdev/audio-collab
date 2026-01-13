/**
 * Upload Process Hook
 *
 * Orchestrates the 3-step upload process:
 * 1. Create track if needed
 * 2. Generate waveform
 * 3. Request signed URL, upload file, finalize
 */

import { useCallback } from 'react'
import { toast } from 'react-toastify'
import { createTrack } from '@/app/actions/studio/tracks'
import { generateWaveformPeaks } from '@/lib/studio/audioUtils'
import { extractFileExtension } from '@/lib/studio/fileUtils'
import {
  requestSignedUploadUrl,
  uploadFileToStorage,
  finalizeUpload,
} from '@/lib/studio/uploadClient'
import { isFileSizeValid, AUDIO_CONSTRAINTS } from '@/lib/types/studio'

export interface UploadProcessOptions {
  projectId: string
  uploadType: 'new-track' | 'add-take'
  trackName: string
  selectedTrackId: string
  selectedFile: File | null
  setUploadProgress: (progress: number) => void
  setIsUploading: (uploading: boolean) => void
  onSuccess: (trackId: string) => void
  onClose: () => void
  resetState: () => void
  t: (key: string) => string
}

export function useUploadProcess(options: UploadProcessOptions) {
  const {
    projectId,
    uploadType,
    trackName,
    selectedTrackId,
    selectedFile,
    setUploadProgress,
    setIsUploading,
    onSuccess,
    onClose,
    resetState,
    t,
  } = options

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!selectedFile) {
        toast.error(t('errors.selectFile'))
        return
      }

      try {
        setIsUploading(true)
        setUploadProgress(10)

        let trackId = selectedTrackId

        // Step 1: Create track if needed
        if (uploadType === 'new-track') {
          console.log('Creating new track:', trackName)
          setUploadProgress(20)
          const trackResult = await createTrack(projectId, trackName.trim())
          console.log('Track creation result:', trackResult)

          if (!trackResult.success || !trackResult.track) {
            throw new Error(trackResult.error || 'Failed to create track')
          }

          trackId = trackResult.track.id
          setUploadProgress(40)
        } else {
          setUploadProgress(30)
        }

        // Step 2: Generate waveform peaks
        console.log('🔧 Generating waveform data...')
        setUploadProgress(40)
        const waveformStartTime = performance.now()
        let waveformPeaks: number[] = []
        try {
          waveformPeaks = await generateWaveformPeaks(selectedFile)
          const waveformEndTime = performance.now()
          const waveformDuration = ((waveformEndTime - waveformStartTime) / 1000).toFixed(2)
          console.log(
            `✅ Waveform peaks generated in ${waveformDuration}s:`,
            waveformPeaks.length,
            'samples'
          )
          console.log('📊 First 10 peaks:', waveformPeaks.slice(0, 10))
        } catch (error) {
          console.error('❌ Failed to generate waveform peaks:', error)
          // Continue without peaks if generation fails
        }

        // Double-check file size (failsafe)
        if (!isFileSizeValid(selectedFile)) {
          throw new Error(
            `File is too large (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${AUDIO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB. Please compress your audio file.`
          )
        }

        // Step 3: Request signed upload URL
        console.log('📝 Requesting signed upload URL...')
        setUploadProgress(50)
        const { uploadUrl, filePath } = await requestSignedUploadUrl(
          trackId,
          selectedFile.name,
          selectedFile.type
        )
        console.log('✅ Got signed URL, uploading file directly to Supabase Storage...')

        // Step 4: Upload file to storage with progress tracking
        console.log('📤 Uploading file to Supabase Storage with progress tracking...')
        console.log(`📦 File size: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`)
        setUploadProgress(60)

        await uploadFileToStorage(uploadUrl, selectedFile, (uploadPercent, loaded, total, speed, elapsed) => {
          // Map upload progress from 60% to 90%
          const mappedProgress = 60 + uploadPercent * 0.3
          setUploadProgress(Math.round(mappedProgress))
          console.log(
            `📊 Upload: ${uploadPercent.toFixed(1)}% | ${(loaded / 1024 / 1024).toFixed(2)}MB/${(total / 1024 / 1024).toFixed(2)}MB | ${speed.toFixed(2)}MB/s | ${elapsed.toFixed(1)}s`
          )
        })

        // Step 5: Finalize upload
        console.log('📝 Creating take record in database...')
        const fileFormat = extractFileExtension(selectedFile.name).slice(1) // Remove leading dot
        const uploadResult = await finalizeUpload(
          trackId,
          filePath,
          selectedFile.size,
          fileFormat,
          waveformPeaks.length > 0 ? waveformPeaks : null
        )

        if (!uploadResult.success) {
          console.error('Upload failed with details:', uploadResult.errorDetails)
          throw new Error(uploadResult.error || 'Failed to upload audio')
        }

        setUploadProgress(100)
        toast.success(
          uploadType === 'new-track' ? t('success.trackCreated') : t('success.takeAdded')
        )

        // Reset form and close
        resetState()
        onSuccess(trackId)
        onClose()
      } catch (error: unknown) {
        const err = error as Error
        console.error('Upload error:', err)
        toast.error(err.message || 'Failed to upload audio')
        setUploadProgress(0)
      } finally {
        setIsUploading(false)
      }
    },
    [
      selectedFile,
      uploadType,
      trackName,
      selectedTrackId,
      projectId,
      setIsUploading,
      setUploadProgress,
      onSuccess,
      onClose,
      resetState,
      t,
    ]
  )

  return {
    handleSubmit,
  }
}
