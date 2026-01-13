/**
 * Upload Modal State Hook
 *
 * Manages state for the upload track modal.
 */

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { isAudioFile } from '@/lib/types/studio'

export interface UploadModalState {
  uploadType: 'new-track' | 'add-take'
  trackName: string
  selectedTrackId: string
  selectedFile: File | null
  isUploading: boolean
  uploadProgress: number
}

export interface UploadModalStateActions {
  setUploadType: (type: 'new-track' | 'add-take') => void
  setTrackName: (name: string) => void
  setSelectedTrackId: (id: string) => void
  setSelectedFile: (file: File | null) => void
  setIsUploading: (uploading: boolean) => void
  setUploadProgress: (progress: number) => void
  resetState: () => void
}

export interface UseUploadModalStateOptions {
  isOpen: boolean
  targetTrackId?: string | null
  droppedFile?: File | null
  t: (key: string) => string
}

export function useUploadModalState({
  isOpen,
  targetTrackId,
  droppedFile,
  t,
}: UseUploadModalStateOptions): UploadModalState & UploadModalStateActions {
  const [uploadType, setUploadType] = useState<'new-track' | 'add-take'>(
    targetTrackId ? 'add-take' : 'new-track'
  )
  const [trackName, setTrackName] = useState('')
  const [selectedTrackId, setSelectedTrackId] = useState<string>(targetTrackId || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Reset state when modal opens or targetTrackId changes
  useEffect(() => {
    if (isOpen) {
      // Set upload type based on targetTrackId
      setUploadType(targetTrackId ? 'add-take' : 'new-track')
      // Set selected track ID
      setSelectedTrackId(targetTrackId || '')
    }
  }, [isOpen, targetTrackId])

  // Handle dropped file from drag & drop
  useEffect(() => {
    if (droppedFile && isOpen) {
      // Validate file type
      if (!isAudioFile(droppedFile)) {
        toast.error(t('errors.invalidFile'))
        return
      }

      // Set the file
      setSelectedFile(droppedFile)
    }
  }, [droppedFile, isOpen, t])

  const resetState = () => {
    setTrackName('')
    setSelectedFile(null)
    setSelectedTrackId('')
    setUploadType('new-track')
    setUploadProgress(0)
  }

  return {
    // State
    uploadType,
    trackName,
    selectedTrackId,
    selectedFile,
    isUploading,
    uploadProgress,
    // Actions
    setUploadType,
    setTrackName,
    setSelectedTrackId,
    setSelectedFile,
    setIsUploading,
    setUploadProgress,
    resetState,
  }
}
