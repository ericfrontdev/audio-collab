'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Image, Music, Sparkles, X } from 'lucide-react'
import { createPost } from '@/app/actions/feed'
import { uploadMediaToStorage, deleteMediaFromStorage } from '@/lib/storage/uploadMedia'
import { toast } from 'react-toastify'
import { createClient } from '@/lib/supabase/client'

interface CreatePostCardProps {
  userAvatar?: string | null
  username?: string
}

export function CreatePostCard({ userAvatar, username }: CreatePostCardProps) {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setSelectedImage(file)

    // Remove audio if image is selected
    if (selectedAudio) {
      setSelectedAudio(null)
      if (audioInputRef.current) {
        audioInputRef.current.value = ''
      }
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file')
      return
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Audio file must be less than 20MB')
      return
    }

    setSelectedAudio(file)
    // Remove image if audio is selected
    if (selectedImage) {
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveAudio = () => {
    setSelectedAudio(null)
    if (audioInputRef.current) {
      audioInputRef.current.value = ''
    }
  }

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error('Post cannot be empty')
      return
    }

    setIsPosting(true)
    let uploadedMediaUrl: string | undefined
    let mediaType: 'image' | 'audio' | undefined

    try {
      // Get current user
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      // Upload media first if exists
      if (selectedImage) {
        const { url, error } = await uploadMediaToStorage(
          selectedImage,
          user.id,
          'image',
          setUploadProgress
        )
        if (error) {
          toast.error(error)
          setUploadProgress(0)
          return
        }
        uploadedMediaUrl = url || undefined
        mediaType = 'image'
      } else if (selectedAudio) {
        const { url, error } = await uploadMediaToStorage(
          selectedAudio,
          user.id,
          'audio',
          setUploadProgress
        )
        if (error) {
          toast.error(error)
          setUploadProgress(0)
          return
        }
        uploadedMediaUrl = url || undefined
        mediaType = 'audio'
      }

      // Create post with media URL
      const result = await createPost(content, undefined, uploadedMediaUrl, mediaType)

      if (result.success) {
        toast.success('Posted successfully!')
        setContent('')
        handleRemoveImage()
        handleRemoveAudio()
        setUploadProgress(0)
      } else {
        // Clean up uploaded media if post creation failed
        if (uploadedMediaUrl) {
          await deleteMediaFromStorage(uploadedMediaUrl)
        }
        toast.error(result.error || 'Failed to create post')
        setUploadProgress(0)
      }
    } catch (error) {
      // Clean up uploaded media on error
      if (uploadedMediaUrl) {
        await deleteMediaFromStorage(uploadedMediaUrl)
      }
      toast.error('Failed to create post')
      setUploadProgress(0)
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <Card className="p-4 bg-zinc-900 border-zinc-800">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={username || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in your music world?"
            className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[80px] text-lg"
            maxLength={500}
            disabled={isPosting}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative mt-3 rounded-lg overflow-hidden border border-zinc-800">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-96 object-contain bg-zinc-950"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Audio preview */}
          {selectedAudio && (
            <div className="mt-3 bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Music className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-white truncate">
                  {selectedAudio.name}
                </span>
              </div>
              <button
                onClick={handleRemoveAudio}
                className="p-1.5 rounded-full hover:bg-zinc-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                title="Remove audio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Uploading...</span>
                <span className="text-xs text-gray-400">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPosting || !!selectedImage || !!selectedAudio}
                className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add image"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={isPosting || !!selectedAudio || !!selectedImage}
                className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add audio"
              >
                <Music className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                title="AI enhance"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${
                  content.length > 450
                    ? 'text-red-500'
                    : content.length > 400
                    ? 'text-yellow-500'
                    : 'text-gray-500'
                }`}
              >
                {content.length}/500
              </span>
              <Button
                onClick={handlePost}
                disabled={!content.trim() || isPosting}
                className="px-6"
              >
                {isPosting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
