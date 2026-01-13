'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Paperclip, Link as LinkIcon, X, Music, Loader2, ExternalLink } from 'lucide-react'
import { createPost } from '@/app/actions/feed/posts'
import { uploadMediaToStorage, deleteMediaFromStorage } from '@/lib/storage/uploadMedia'
import { fetchLinkMetadata, type LinkMetadata } from '@/app/actions/linkPreview'
import { toast } from 'react-toastify'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useCurrentUserStore } from '@/lib/stores'

interface CreatePostCardProps {
  username?: string
  userId: string
  clubId?: string
  clubName?: string
  onPostCreated?: () => void
}

export function CreatePostCard({ username, userId, clubId, clubName, onPostCreated }: CreatePostCardProps) {
  const userAvatar = useCurrentUserStore((state) => state.user?.avatarUrl)
  const t = useTranslations('feed.create')
  const tGenres = useTranslations('clubs.genres')
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | null>(null)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [isFetchingLink, setIsFetchingLink] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const broadcastChannelRef = useRef<any>(null)

  // Initialize broadcast channel
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('feed_posts')

    channel.subscribe()

    broadcastChannelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Detect media type
    if (file.type.startsWith('image/')) {
      // Validate file size (max 5MB for images)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image doit faire moins de 5 Mo')
        return
      }

      setSelectedImage(file)
      setSelectedAudio(null)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('audio/')) {
      // Validate file size (max 20MB for audio)
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Le fichier audio doit faire moins de 20 Mo')
        return
      }

      setSelectedAudio(file)
      setSelectedImage(null)
      setImagePreview(null)
    } else if (file.type.startsWith('video/')) {
      // Validate file size (max 50MB for video)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('La vidéo doit faire moins de 50 Mo')
        return
      }

      setSelectedVideo(file)
      setSelectedImage(null)
      setSelectedAudio(null)
      setImagePreview(null)

      // Create video preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setVideoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      toast.error('Veuillez sélectionner une image, un fichier audio ou une vidéo')
      return
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveVideo = () => {
    setSelectedVideo(null)
    setVideoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFetchLinkPreview = async () => {
    if (!linkUrl.trim()) {
      toast.error('Veuillez entrer une URL')
      return
    }

    setIsFetchingLink(true)

    try {
      const result = await fetchLinkMetadata(linkUrl.trim())

      if (result.success && result.metadata) {
        setLinkMetadata(result.metadata)
        setShowLinkDialog(false)
        setLinkUrl('')
        toast.success('Lien ajouté!')
      } else {
        toast.error(result.error || 'Impossible de récupérer le lien')
      }
    } catch (error) {
      toast.error('Erreur lors de la récupération du lien')
    } finally {
      setIsFetchingLink(false)
    }
  }

  const handleRemoveLink = () => {
    setLinkMetadata(null)
    setLinkUrl('')
  }

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error(t('postEmpty'))
      return
    }

    setIsPosting(true)
    let uploadedMediaUrl: string | undefined
    let mediaType: 'image' | 'audio' | 'video' | undefined

    try {
      // Upload media first if exists
      if (selectedImage) {
        const { url, error } = await uploadMediaToStorage(
          selectedImage,
          userId,
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
          userId,
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
      } else if (selectedVideo) {
        const { url, error } = await uploadMediaToStorage(
          selectedVideo,
          userId,
          'video',
          setUploadProgress
        )
        if (error) {
          toast.error(error)
          setUploadProgress(0)
          return
        }
        uploadedMediaUrl = url || undefined
        mediaType = 'video'
      }

      // Create post with media URL and link metadata
      const result = await createPost(
        content,
        undefined,
        uploadedMediaUrl,
        mediaType,
        linkMetadata?.url || undefined,
        linkMetadata?.title || undefined,
        linkMetadata?.description || undefined,
        linkMetadata?.image || undefined,
        clubId
      )

      if (result.success) {
        // Broadcast the new post to other users
        if (result.post && broadcastChannelRef.current) {
          try {
            await broadcastChannelRef.current.send({
              type: 'broadcast',
              event: 'post_created',
              payload: result.post,
            })
          } catch (error) {
            console.error('Error broadcasting post:', error)
          }
        }

        toast.success(t('postSuccess'))
        setContent('')
        handleRemoveImage()
        handleRemoveAudio()
        handleRemoveVideo()
        handleRemoveLink()
        setUploadProgress(0)

        // Call onPostCreated callback if provided
        if (onPostCreated) {
          onPostCreated()
        }
      } else {
        // Clean up uploaded media if post creation failed
        if (uploadedMediaUrl) {
          await deleteMediaFromStorage(uploadedMediaUrl)
        }
        toast.error(result.error || t('postFailed'))
        setUploadProgress(0)
      }
    } catch (error) {
      // Clean up uploaded media on error
      if (uploadedMediaUrl) {
        await deleteMediaFromStorage(uploadedMediaUrl)
      }
      toast.error(t('postFailed'))
      setUploadProgress(0)
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <Card className="p-4 rounded-xl bg-zinc-900/50 border-zinc-800 hover:border-primary/50 transition-colors">
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
          {/* Club badge */}
          {clubId && clubName && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-medium text-primary">{t('postingTo')} {tGenres(clubName as any) || clubName}</span>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('placeholder')}
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

          {/* Video preview */}
          {videoPreview && (
            <div className="relative mt-3 rounded-lg overflow-hidden border border-zinc-800">
              <video
                src={videoPreview}
                controls
                className="w-full max-h-96 bg-zinc-950"
              />
              <button
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                title="Remove video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Link preview */}
          {linkMetadata && (
            <div className="relative mt-3 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors group">
              <a
                href={linkMetadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {linkMetadata.image && (
                  <div className="relative w-full h-48 bg-zinc-950">
                    <img
                      src={linkMetadata.image}
                      alt={linkMetadata.title || 'Link preview'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-3 bg-zinc-900/50">
                  {linkMetadata.title && (
                    <h4 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                      {linkMetadata.title}
                    </h4>
                  )}
                  {linkMetadata.description && (
                    <p className="text-gray-400 text-xs line-clamp-2 mb-2">
                      {linkMetadata.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">{new URL(linkMetadata.url).hostname}</span>
                  </div>
                </div>
              </a>
              <button
                onClick={handleRemoveLink}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                title="Remove link"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{t('uploading')}</span>
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
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPosting || !!selectedImage || !!selectedAudio || !!selectedVideo}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800/50 text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add media"
              >
                <Paperclip className="w-5 h-5" />
                <span className="text-sm font-medium">Média</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLinkDialog(true)}
                disabled={isPosting || !!linkMetadata}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800/50 text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add link"
              >
                <LinkIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Lien</span>
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
                className="px-6 text-white"
              >
                {isPosting ? t('posting') : t('post')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowLinkDialog(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Ajouter un lien</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleFetchLinkPreview()
                } else if (e.key === 'Escape') {
                  setShowLinkDialog(false)
                  setLinkUrl('')
                }
              }}
              placeholder="https://example.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              autoFocus
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowLinkDialog(false)
                  setLinkUrl('')
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <Button
                onClick={handleFetchLinkPreview}
                disabled={isFetchingLink || !linkUrl.trim()}
                className="px-4 py-2 text-white"
              >
                {isFetchingLink ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
