/**
 * File Validation Hook
 *
 * Custom hook for audio file validation with toast notifications.
 */

import { useCallback } from 'react'
import { toast } from 'react-toastify'
import { isAudioFile, isFileSizeValid, AUDIO_CONSTRAINTS } from '@/lib/types/studio'

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export function useFileValidation(t: (key: string, params?: Record<string, any>) => string) {
  /**
   * Validate file type and size
   *
   * @param file - File to validate
   * @param showToast - Whether to show toast notifications (default: true)
   * @returns Validation result
   */
  const validateFile = useCallback(
    (file: File | null, showToast: boolean = true): FileValidationResult => {
      if (!file) {
        const error = t('errors.selectFile')
        if (showToast) toast.error(error)
        return { valid: false, error }
      }

      // Validate file type
      if (!isAudioFile(file)) {
        const error = 'Please select a valid audio file (MP3, WAV, FLAC, M4A, or OGG)'
        if (showToast) toast.error(error)
        return { valid: false, error }
      }

      // Validate file size
      if (!isFileSizeValid(file)) {
        const maxSizeMB = AUDIO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)
        const error = t('errors.fileTooLarge', { maxSize: maxSizeMB })
        if (showToast) toast.error(error)
        return { valid: false, error }
      }

      return { valid: true }
    },
    [t]
  )

  /**
   * Validate upload form inputs
   *
   * @param uploadType - Type of upload ("new-track" or "add-take")
   * @param trackName - Name for new track
   * @param selectedTrackId - ID of selected existing track
   * @param selectedFile - Selected file
   * @returns Validation result
   */
  const validateUploadForm = useCallback(
    (
      uploadType: 'new-track' | 'add-take',
      trackName: string,
      selectedTrackId: string,
      selectedFile: File | null
    ): FileValidationResult => {
      // Validate file first
      const fileValidation = validateFile(selectedFile)
      if (!fileValidation.valid) {
        return fileValidation
      }

      // Validate track name for new track
      if (uploadType === 'new-track' && !trackName.trim()) {
        const error = t('errors.enterName')
        toast.error(error)
        return { valid: false, error }
      }

      // Validate track selection for add-take
      if (uploadType === 'add-take' && !selectedTrackId) {
        const error = t('errors.selectTrack')
        toast.error(error)
        return { valid: false, error }
      }

      return { valid: true }
    },
    [validateFile, t]
  )

  /**
   * Handle file input change with validation
   *
   * @param e - Change event from file input
   * @param onValid - Callback when file is valid
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, onValid: (file: File) => void) => {
      const file = e.target.files?.[0]
      if (!file) return

      const validation = validateFile(file)
      if (validation.valid) {
        onValid(file)
      }
    },
    [validateFile]
  )

  return {
    validateFile,
    validateUploadForm,
    handleFileChange,
  }
}
