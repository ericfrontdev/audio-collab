'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadProjectCover, deleteProjectCover } from '@/app/actions/storage'
import { toast } from 'react-toastify'
import { useRouter } from '@/i18n/routing'

interface CoverImageUploadProps {
  projectId: string
  currentCoverUrl?: string | null
  canEdit: boolean
}

export function CoverImageUpload({ projectId, currentCoverUrl, canEdit }: CoverImageUploadProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!canEdit) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadProjectCover(projectId, formData)

      if (result.success) {
        toast.success('Cover image uploaded successfully!')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to upload cover image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('An error occurred while uploading')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!canEdit || !currentCoverUrl) return

    setIsDeleting(true)

    try {
      const result = await deleteProjectCover(projectId, currentCoverUrl)

      if (result.success) {
        toast.success('Cover image deleted successfully!')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete cover image')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('An error occurred while deleting')
    } finally {
      setIsDeleting(false)
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Display current cover or upload area
  if (currentCoverUrl) {
    return (
      <div className="relative w-full h-64 rounded-lg overflow-hidden group">
        <Image
          src={currentCoverUrl}
          alt="Project cover"
          fill
          className="object-cover"
        />
        {canEdit && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              {isDeleting ? 'Deleting...' : 'Remove Cover'}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="w-full h-64 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
        <p className="text-gray-500">No cover image</p>
      </div>
    )
  }

  return (
    <div
      className={`relative w-full h-64 rounded-lg border-2 border-dashed transition-colors ${
        dragActive
          ? 'border-primary bg-primary/5'
          : 'border-zinc-700 bg-zinc-900/50'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {isUploading ? (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-white font-medium">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-white font-medium mb-2">
              Drop cover image here or click to upload
            </p>
            <p className="text-sm text-gray-400 mb-1 text-center">
              Recommended: 1200x400px (3:1 ratio)
            </p>
            <p className="text-xs text-gray-500 mb-4 text-center">
              JPEG, PNG, WEBP, GIF (max 5MB)
            </p>
            <button
              onClick={onButtonClick}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              Choose File
            </button>
          </>
        )}
      </div>
    </div>
  )
}
