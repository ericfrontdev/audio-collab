import { useState } from 'react'
import { updatePost, deletePost } from '@/app/actions/feed'
import { uploadMediaToStorage, deleteMediaFromStorage } from '@/lib/storage/uploadMedia'
import { toast } from 'react-toastify'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/lib/types/feed'

export function usePostEditor(post: Post, onSuccess: () => void) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editAudio, setEditAudio] = useState<File | null>(null)
  const [removeCurrentMedia, setRemoveCurrentMedia] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleEdit = () => {
    setIsEditing(true)
    setEditImage(null)
    setEditImagePreview(null)
    setEditAudio(null)
    setRemoveCurrentMedia(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(post.content)
    setEditImage(null)
    setEditImagePreview(null)
    setEditAudio(null)
    setRemoveCurrentMedia(false)
  }

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setEditImage(file)
    setEditAudio(null)
    setRemoveCurrentMedia(false)

    const reader = new FileReader()
    reader.onloadend = () => {
      setEditImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleEditAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Audio file must be less than 20MB')
      return
    }

    setEditAudio(file)
    setEditImage(null)
    setEditImagePreview(null)
    setRemoveCurrentMedia(false)
  }

  const handleRemoveEditMedia = (editFileInputRef: React.RefObject<HTMLInputElement>, editAudioInputRef: React.RefObject<HTMLInputElement>) => {
    setEditImage(null)
    setEditImagePreview(null)
    setEditAudio(null)
    setRemoveCurrentMedia(true)
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ''
    }
    if (editAudioInputRef.current) {
      editAudioInputRef.current.value = ''
    }
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Post cannot be empty')
      return
    }

    setIsUpdating(true)
    let newMediaUrl: string | null | undefined
    let newMediaType: 'image' | 'audio' | null | undefined

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      if (removeCurrentMedia) {
        if (post.media_url) {
          await deleteMediaFromStorage(post.media_url)
        }
        newMediaUrl = null
        newMediaType = null
      } else if (editImage) {
        if (post.media_url) {
          await deleteMediaFromStorage(post.media_url)
        }
        const { url, error } = await uploadMediaToStorage(
          editImage,
          user.id,
          'image',
          setUploadProgress
        )
        if (error) {
          toast.error(error)
          setUploadProgress(0)
          return
        }
        newMediaUrl = url
        newMediaType = 'image'
      } else if (editAudio) {
        if (post.media_url) {
          await deleteMediaFromStorage(post.media_url)
        }
        const { url, error } = await uploadMediaToStorage(
          editAudio,
          user.id,
          'audio',
          setUploadProgress
        )
        if (error) {
          toast.error(error)
          setUploadProgress(0)
          return
        }
        newMediaUrl = url
        newMediaType = 'audio'
      }

      const result = await updatePost(post.id, editContent, newMediaUrl, newMediaType)

      if (result.success) {
        toast.success('Post updated successfully!')
        setIsEditing(false)
        setUploadProgress(0)
        onSuccess()
      } else {
        if (newMediaUrl && (editImage || editAudio)) {
          await deleteMediaFromStorage(newMediaUrl)
        }
        toast.error(result.error || 'Failed to update post')
        setUploadProgress(0)
      }
    } catch (error) {
      if (newMediaUrl && (editImage || editAudio)) {
        await deleteMediaFromStorage(newMediaUrl)
      }
      toast.error('Failed to update post')
      setUploadProgress(0)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setShowDeleteConfirm(false)
    setIsDeleting(true)
    try {
      const result = await deletePost(post.id)

      if (result.success) {
        toast.success('Post deleted successfully!')
        onSuccess()
      } else {
        toast.error(result.error || 'Failed to delete post')
      }
    } catch (error) {
      toast.error('Failed to delete post')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  return {
    isEditing,
    editContent,
    setEditContent,
    isUpdating,
    isDeleting,
    showDeleteConfirm,
    editImage,
    editImagePreview,
    editAudio,
    removeCurrentMedia,
    uploadProgress,
    handleEdit,
    handleCancelEdit,
    handleEditImageSelect,
    handleEditAudioSelect,
    handleRemoveEditMedia,
    handleSaveEdit,
    handleDelete,
    confirmDelete,
    cancelDelete,
  }
}
