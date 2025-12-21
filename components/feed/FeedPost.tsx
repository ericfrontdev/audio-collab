'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AudioPlayer } from '@/components/ui/AudioPlayer'
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash2, X, Image as ImageIcon, Music } from 'lucide-react'
import { toggleLikePost, updatePost, deletePost } from '@/app/actions/feed'
import { toast } from 'react-toastify'
import type { Post } from '@/lib/types/feed'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface FeedPostProps {
  post: Post
  currentUserId?: string
}

export function FeedPost({ post, currentUserId }: FeedPostProps) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(post.is_liked_by_user || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editAudio, setEditAudio] = useState<File | null>(null)
  const [removeCurrentMedia, setRemoveCurrentMedia] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const editAudioInputRef = useRef<HTMLInputElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    const previousLiked = isLiked
    const previousCount = likesCount

    // Optimistic update
    setIsLiked(!isLiked)
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)

    try {
      const result = await toggleLikePost(post.id)

      if (!result.success) {
        // Revert on error
        setIsLiked(previousLiked)
        setLikesCount(previousCount)
        toast.error('Failed to like post')
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked)
      setLikesCount(previousCount)
      toast.error('Failed to like post')
    } finally {
      setIsLiking(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setShowMenu(false)
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

    setEditImage(file)
    setEditAudio(null)
    setRemoveCurrentMedia(false)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleEditAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setEditAudio(file)
    setEditImage(null)
    setEditImagePreview(null)
    setRemoveCurrentMedia(false)
  }

  const handleRemoveEditMedia = () => {
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
    try {
      const result = await updatePost(
        post.id,
        editContent,
        editImage || undefined,
        removeCurrentMedia,
        editAudio || undefined
      )

      if (result.success) {
        toast.success('Post updated successfully!')
        setIsEditing(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update post')
      }
    } catch (error) {
      toast.error('Failed to update post')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
    setShowMenu(false)
  }

  const confirmDelete = async () => {
    setShowDeleteConfirm(false)
    setIsDeleting(true)
    try {
      const result = await deletePost(post.id)

      if (result.success) {
        toast.success('Post deleted successfully!')
        router.refresh()
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

  const isOwnPost = currentUserId === post.user_id

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card className="p-4 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link
          href={`/profile/${post.user?.username}`}
          className="flex-shrink-0"
        >
          {post.user?.avatar_url ? (
            <img
              src={post.user.avatar_url}
              alt={post.user.username}
              className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
              <span className="text-primary font-semibold">
                {post.user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile/${post.user?.username}`}
                className="font-semibold text-white hover:underline"
              >
                {post.user?.display_name || post.user?.username}
              </Link>
              <Link
                href={`/profile/${post.user?.username}`}
                className="text-gray-500 hover:underline"
              >
                @{post.user?.username}
              </Link>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-sm">
                {formatTimeAgo(post.created_at)}
              </span>
            </div>

            {isOwnPost && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full hover:bg-zinc-800 text-gray-500 hover:text-white transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-white hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit post
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 text-left text-red-500 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isDeleting ? 'Deleting...' : 'Delete post'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post content - Edit mode or display mode */}
          {isEditing ? (
            <div className="mb-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">
                  {editContent.length}/500
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isUpdating || !editContent.trim()}
                    className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white whitespace-pre-wrap mb-3">{post.content}</p>
          )}

          {/* Post media - Edit mode */}
          {isEditing && (
            <>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleEditImageSelect}
                className="hidden"
              />
              <input
                ref={editAudioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleEditAudioSelect}
                className="hidden"
              />

              {/* Show new image preview, current image, new audio, current audio, or add buttons */}
              {editImagePreview ? (
                <div className="relative mb-3 rounded-lg overflow-hidden border border-zinc-800">
                  <img
                    src={editImagePreview}
                    alt="New image preview"
                    className="w-full max-h-[500px] object-contain bg-zinc-950"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => editFileInputRef.current?.click()}
                      className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                      title="Change image"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRemoveEditMedia}
                      className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : editAudio ? (
                <div className="mb-3 bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Music className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-white truncate">
                      {editAudio.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editAudioInputRef.current?.click()}
                      className="p-1.5 rounded-full hover:bg-zinc-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                      title="Change audio"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRemoveEditMedia}
                      className="p-1.5 rounded-full hover:bg-zinc-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                      title="Remove audio"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : post.media_url && post.media_type === 'image' && !removeCurrentMedia ? (
                <div className="relative mb-3 rounded-lg overflow-hidden border border-zinc-800">
                  <img
                    src={post.media_url}
                    alt="Current image"
                    className="w-full max-h-[500px] object-contain bg-zinc-950"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => editFileInputRef.current?.click()}
                      className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                      title="Change image"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRemoveEditMedia}
                      className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : post.media_url && post.media_type === 'audio' && !removeCurrentMedia ? (
                <div className="mb-3 relative">
                  <AudioPlayer src={post.media_url} />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => editAudioInputRef.current?.click()}
                      className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                      title="Change audio"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRemoveEditMedia}
                      className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                      title="Remove audio"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex-1 p-4 rounded-lg border-2 border-dashed border-zinc-700 hover:border-primary/50 text-zinc-500 hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>Add image</span>
                  </button>
                  <button
                    onClick={() => editAudioInputRef.current?.click()}
                    className="flex-1 p-4 rounded-lg border-2 border-dashed border-zinc-700 hover:border-primary/50 text-zinc-500 hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Music className="w-5 h-5" />
                    <span>Add audio</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Post image - Display mode */}
          {!isEditing && post.media_url && post.media_type === 'image' && (
            <div className="mb-3 rounded-lg overflow-hidden border border-zinc-800">
              <img
                src={post.media_url}
                alt="Post image"
                className="w-full max-h-[500px] object-contain bg-zinc-950"
              />
            </div>
          )}

          {/* Post audio - Display mode */}
          {!isEditing && post.media_url && post.media_type === 'audio' && (
            <div className="mb-3">
              <AudioPlayer src={post.media_url} />
            </div>
          )}

          {/* Project link if attached */}
          {post.project && (
            <Link
              href={`/projects/${post.project.id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm text-white mb-3 transition-colors"
            >
              <span>🎵</span>
              <span>{post.project.title}</span>
            </Link>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6 text-gray-500">
            <button className="flex items-center gap-2 hover:text-primary transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm">{post.comments_count || 0}</span>
            </button>

            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 transition-colors group ${
                isLiked
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  isLiked
                    ? 'bg-red-500/10'
                    : 'group-hover:bg-red-500/10'
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
                />
              </div>
              <span className="text-sm">{likesCount}</span>
            </button>

            <button className="flex items-center gap-2 hover:text-primary transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </Card>
  )
}
