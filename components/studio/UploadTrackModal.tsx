/**
 * Upload Track Modal
 *
 * Modal for uploading audio files as new tracks or additional takes.
 * Refactored to use modular hooks and sub-components.
 */

'use client'

import { Button } from '@/components/ui/button'
import { ProjectTrack, AUDIO_CONSTRAINTS } from '@/lib/types/studio'
import { useTranslations } from 'next-intl'
import { useUploadModalState } from '@/hooks/useUploadModalState'
import { useFileValidation } from '@/hooks/useFileValidation'
import { useUploadProcess } from '@/hooks/useUploadProcess'
import {
  UploadModalHeader,
  UploadTypeSelector,
  TrackNameInput,
  TrackSelector,
  FileInput,
  UploadProgressBar,
} from './upload'

interface UploadTrackModalProps {
  projectId: string
  existingTracks: ProjectTrack[]
  isOpen: boolean
  onClose: () => void
  onSuccess: (trackId: string) => void
  droppedFile?: File | null
  targetTrackId?: string | null
}

export function UploadTrackModal({
  projectId,
  existingTracks,
  isOpen,
  onClose,
  onSuccess,
  droppedFile,
  targetTrackId,
}: UploadTrackModalProps) {
  const t = useTranslations('studio.uploadModal')

  // Find target track if specified
  const targetTrack = targetTrackId ? existingTracks.find((t) => t.id === targetTrackId) : null

  // State management hook
  const state = useUploadModalState({
    isOpen,
    targetTrackId,
    droppedFile,
    t,
  })

  // File validation hook
  const validation = useFileValidation(t)

  // Upload process hook
  const { handleSubmit } = useUploadProcess({
    projectId,
    uploadType: state.uploadType,
    trackName: state.trackName,
    selectedTrackId: state.selectedTrackId,
    selectedFile: state.selectedFile,
    setUploadProgress: state.setUploadProgress,
    setIsUploading: state.setIsUploading,
    onSuccess,
    onClose,
    resetState: state.resetState,
    t,
  })

  // Handle file change with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validation.handleFileChange(e, (file) => state.setSelectedFile(file))
  }

  // Validate form before submit
  const handleFormSubmit = (e: React.FormEvent) => {
    const validationResult = validation.validateUploadForm(
      state.uploadType,
      state.trackName,
      state.selectedTrackId,
      state.selectedFile
    )

    if (!validationResult.valid) {
      e.preventDefault()
      return
    }

    handleSubmit(e)
  }

  // Reset and close
  const resetAndClose = () => {
    if (!state.isUploading) {
      state.resetState()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl">
        {/* Header */}
        <UploadModalHeader
          title={t('title')}
          targetTrackName={targetTrack?.name}
          forTrackLabel={t('forTrack')}
          onClose={resetAndClose}
          disabled={state.isUploading}
        />

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
          {/* Upload Type Selection - Only show if no target track specified */}
          {!targetTrackId && (
            <UploadTypeSelector
              uploadType={state.uploadType}
              onChange={state.setUploadType}
              disabled={state.isUploading}
              existingTracksCount={existingTracks.length}
              labels={{
                uploadType: t('uploadType'),
                newTrack: t('newTrack'),
                newTrackDesc: t('newTrackDesc'),
                addTake: t('addTake'),
                addTakeDesc: t('addTakeDesc'),
                createFirstTrack: t('createFirstTrack'),
              }}
            />
          )}

          {/* Track Name Input (for new tracks) */}
          {state.uploadType === 'new-track' && (
            <TrackNameInput
              value={state.trackName}
              onChange={state.setTrackName}
              disabled={state.isUploading}
              labels={{
                trackName: t('trackName'),
                required: t('required'),
                placeholder: t('trackNamePlaceholder'),
              }}
            />
          )}

          {/* Track Selection (for adding takes) - Only show if no target track specified */}
          {!targetTrackId && state.uploadType === 'add-take' && existingTracks.length > 0 && (
            <TrackSelector
              value={state.selectedTrackId}
              onChange={state.setSelectedTrackId}
              tracks={existingTracks}
              disabled={state.isUploading}
              labels={{
                selectTrack: t('selectTrack'),
                required: t('required'),
                chooseTrack: t('chooseTrack'),
              }}
            />
          )}

          {/* File Input */}
          <FileInput
            selectedFile={state.selectedFile}
            onChange={handleFileChange}
            onClear={() => state.setSelectedFile(null)}
            disabled={state.isUploading}
            labels={{
              audioFile: t('audioFile'),
              required: t('required'),
              chooseFile: t('chooseFile'),
              supportedFormats: t('supportedFormats', {
                maxSize: AUDIO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024),
              }),
              fileSize: t('fileSize'),
            }}
            maxSizeMB={AUDIO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}
          />

          {/* Progress Bar */}
          {state.isUploading && (
            <UploadProgressBar progress={state.uploadProgress} uploadingLabel={t('uploading')} />
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={state.isUploading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={state.isUploading || !state.selectedFile}>
              {state.isUploading ? t('uploading') : t('upload')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
