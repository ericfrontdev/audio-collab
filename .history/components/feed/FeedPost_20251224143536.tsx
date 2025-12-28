'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AudioPlayer } from '@/components/ui/AudioPlayer'
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash2, X, Image as ImageIcon, Music } from 'lucide-react'
import { toggleLikePost, updatePost, deletePost, addPostComment, getPostComments, toggleCommentLike, addCommentReply, updateComment, deleteComment } from '@/app/actions/feed'
import { uploadMediaToStorage, deleteMediaFromStorage } from '@/lib/storage/uploadMedia'
import { toast } from 'react-toastify'
import type { Post } from '@/lib/types/feed'
import { Link } from '@/i18n/routing'
import { useRouter } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'

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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [commentMenuOpen, setCommentMenuOpen] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [isUpdatingComment, setIsUpdatingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false)
  const [replyMenuOpen, setReplyMenuOpen] = useState<string | null>(null)
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editReplyText, setEditReplyText] = useState('')
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null)
  const [showDeleteReplyConfirm, setShowDeleteReplyConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const commentMenuRef = useRef<HTMLDivElement>(null)
  const replyMenuRef = useRef<HTMLDivElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const editAudioInputRef = useRef<HTMLInputElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
      if (commentMenuRef.current && !commentMenuRef.current.contains(event.target as Node)) {
        setCommentMenuOpen(null)
      }
      if (replyMenuRef.current && !replyMenuRef.current.contains(event.target as Node)) {
        setReplyMenuOpen(null)
      }
    }

    if (showMenu || commentMenuOpen || replyMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu, commentMenuOpen, replyMenuOpen])

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

  const handleToggleCommentInput = async () => {
    const newShowState = !showCommentInput
    setShowCommentInput(newShowState)

    // Load comments when opening for the first time
    if (newShowState && !commentsLoaded && !loadingComments) {
      setLoadingComments(true)
      const result = await getPostComments(post.id)
      if (result.success) {
        setComments(result.comments)
        setCommentsLoaded(true)
      }
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    setIsSubmittingComment(true)
    const previousCount = commentsCount

    // Optimistic update: increment counter immediately
    setCommentsCount(commentsCount + 1)

    try {
      const result = await addPostComment(post.id, commentText.trim())

      if (result.success && result.comment) {
        // Success: add comment to local state immediately
        setComments([result.comment, ...comments])
        setCommentText('')
        toast.success('Comment added!')
        // Keep the field open so user can add more comments if they want
      } else {
        // Revert on error
        setCommentsCount(previousCount)
        toast.error(result.error || 'Failed to add comment')
      }
    } catch (error) {
      // Revert on error
      setCommentsCount(previousCount)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleCommentLike = async (commentId: string) => {
    const commentIndex = comments.findIndex((c) => c.id === commentId)
    if (commentIndex === -1) return

    const comment = comments[commentIndex]
    const previousLiked = comment.is_liked_by_user
    const previousCount = comment.likes_count || 0

    // Optimistic update
    const updatedComments = [...comments]
    updatedComments[commentIndex] = {
      ...comment,
      is_liked_by_user: !previousLiked,
      likes_count: previousLiked ? previousCount - 1 : previousCount + 1,
    }
    setComments(updatedComments)

    try {
      const result = await toggleCommentLike(commentId)

      if (!result.success) {
        // Revert on error
        const revertedComments = [...comments]
        revertedComments[commentIndex] = {
          ...comment,
          is_liked_by_user: previousLiked,
          likes_count: previousCount,
        }
        setComments(revertedComments)
        toast.error('Failed to like comment')
      }
    } catch (error) {
      // Revert on error
      const revertedComments = [...comments]
      revertedComments[commentIndex] = {
        ...comment,
        is_liked_by_user: previousLiked,
        likes_count: previousCount,
      }
      setComments(revertedComments)
      toast.error('Failed to like comment')
    }
  }

  const handleReplyLike = async (parentCommentId: string, replyId: string) => {
    // Find parent comment
    const commentIndex = comments.findIndex((c) => c.id === parentCommentId)
    if (commentIndex === -1) return

    const comment = comments[commentIndex]
    const replyIndex = comment.replies?.findIndex((r: any) => r.id === replyId) ?? -1
    if (replyIndex === -1) return

    const reply = comment.replies[replyIndex]
    const previousLiked = reply.is_liked_by_user
    const previousCount = reply.likes_count || 0

    // Optimistic update
    const updatedComments = [...comments]
    const updatedReplies = [...(comment.replies || [])]
    updatedReplies[replyIndex] = {
      ...reply,
      is_liked_by_user: !previousLiked,
      likes_count: previousLiked ? previousCount - 1 : previousCount + 1,
    }
    updatedComments[commentIndex] = {
      ...comment,
      replies: updatedReplies,
    }
    setComments(updatedComments)

    try {
      const result = await toggleCommentLike(replyId)

      if (!result.success) {
        // Revert on error
        const revertedComments = [...comments]
        const revertedReplies = [...(comment.replies || [])]
        revertedReplies[replyIndex] = {
          ...reply,
          is_liked_by_user: previousLiked,
          likes_count: previousCount,
        }
        revertedComments[commentIndex] = {
          ...comment,
          replies: revertedReplies,
        }
        setComments(revertedComments)
        toast.error('Failed to like reply')
      }
    } catch (error) {
      // Revert on error
      const revertedComments = [...comments]
      const revertedReplies = [...(comment.replies || [])]
      revertedReplies[replyIndex] = {
        ...reply,
        is_liked_by_user: previousLiked,
        likes_count: previousCount,
      }
      revertedComments[commentIndex] = {
        ...comment,
        replies: revertedReplies,
      }
      setComments(revertedComments)
      toast.error('Failed to like reply')
    }
  }

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty')
      return
    }

    setIsSubmittingReply(true)

    try {
      const result = await addCommentReply(post.id, parentCommentId, replyText.trim())

      if (result.success && result.reply) {
        // Add reply to the parent comment's replies array
        const updatedComments = comments.map((comment) => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), result.reply],
            }
          }
          return comment
        })
        setComments(updatedComments)
        setReplyText('')
        setReplyingTo(null)
        toast.success('Reply added!')
      } else {
        toast.error(result.error || 'Failed to add reply')
      }
    } catch (error) {
      toast.error('Failed to add reply')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId)
    setEditCommentText(currentContent)
    setCommentMenuOpen(null)
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditCommentText('')
  }

  const handleSaveEditComment = async (commentId: string) => {
    if (!editCommentText.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    setIsUpdatingComment(true)

    try {
      const result = await updateComment(commentId, editCommentText.trim())

      if (result.success) {
        // Update comment in local state
        const updatedComments = comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              content: editCommentText.trim(),
            }
          }
          return comment
        })
        setComments(updatedComments)
        setEditingCommentId(null)
        setEditCommentText('')
        toast.success('Comment updated!')
      } else {
        toast.error(result.error || 'Failed to update comment')
      }
    } catch (error) {
      toast.error('Failed to update comment')
    } finally {
      setIsUpdatingComment(false)
    }
  }

  const handleDeleteComment = (commentId: string) => {
    setDeletingCommentId(commentId)
    setShowDeleteCommentConfirm(true)
    setCommentMenuOpen(null)
  }

  const confirmDeleteComment = async () => {
    if (!deletingCommentId) return

    setShowDeleteCommentConfirm(false)

    try {
      const result = await deleteComment(deletingCommentId)

      if (result.success) {
        // Remove comment from local state
        const updatedComments = comments.filter((comment) => comment.id !== deletingCommentId)
        setComments(updatedComments)
        setCommentsCount(commentsCount - 1)
        setDeletingCommentId(null)
        toast.success('Comment deleted!')
      } else {
        toast.error(result.error || 'Failed to delete comment')
      }
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  const cancelDeleteComment = () => {
    setShowDeleteCommentConfirm(false)
    setDeletingCommentId(null)
  }

  const handleEditReply = (parentCommentId: string, replyId: string, currentContent: string) => {
    setEditingReplyId(replyId)
    setEditReplyText(currentContent)
    setReplyMenuOpen(null)
  }

  const handleCancelEditReply = () => {
    setEditingReplyId(null)
    setEditReplyText('')
  }

  const handleSaveEditReply = async (parentCommentId: string, replyId: string) => {
    if (!editReplyText.trim()) {
      toast.error('Reply cannot be empty')
      return
    }

    setIsUpdatingComment(true)

    try {
      const result = await updateComment(replyId, editReplyText.trim())

      if (result.success) {
        // Update reply in local state
        const updatedComments = comments.map((comment) => {
          if (comment.id === parentCommentId) {
            const updatedReplies = comment.replies?.map((reply: any) => {
              if (reply.id === replyId) {
                return {
                  ...reply,
                  content: editReplyText.trim(),
                }
              }
              return reply
            })
            return {
              ...comment,
              replies: updatedReplies,
            }
          }
          return comment
        })
        setComments(updatedComments)
        setEditingReplyId(null)
        setEditReplyText('')
        toast.success('Reply updated!')
      } else {
        toast.error(result.error || 'Failed to update reply')
      }
    } catch (error) {
      toast.error('Failed to update reply')
    } finally {
      setIsUpdatingComment(false)
    }
  }

  const handleDeleteReply = (parentCommentId: string, replyId: string) => {
    setDeletingReplyId(replyId)
    setShowDeleteReplyConfirm(true)
    setReplyMenuOpen(null)
  }

  const confirmDeleteReply = async () => {
    if (!deletingReplyId) return

    setShowDeleteReplyConfirm(false)

    try {
      const result = await deleteComment(deletingReplyId)

      if (result.success) {
        // Remove reply from local state
        const updatedComments = comments.map((comment) => {
          if (comment.replies) {
            const updatedReplies = comment.replies.filter((reply: any) => reply.id !== deletingReplyId)
            return {
              ...comment,
              replies: updatedReplies,
            }
          }
          return comment
        })
        setComments(updatedComments)
        setDeletingReplyId(null)
        toast.success('Reply deleted!')
      } else {
        toast.error(result.error || 'Failed to delete reply')
      }
    } catch (error) {
      toast.error('Failed to delete reply')
    }
  }

  const cancelDeleteReply = () => {
    setShowDeleteReplyConfirm(false)
    setDeletingReplyId(null)
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
    let newMediaUrl: string | null | undefined
    let newMediaType: 'image' | 'audio' | null | undefined

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

      // Handle media changes
      if (removeCurrentMedia) {
        // Delete old media from storage
        if (post.media_url) {
          await deleteMediaFromStorage(post.media_url)
        }
        newMediaUrl = null
        newMediaType = null
      } else if (editImage) {
        // Delete old media if exists
        if (post.media_url) {
          await deleteMediaFromStorage(post.media_url)
        }
        // Upload new image
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
        // Delete old media if exists
        if (post.media_url) {
          await deleteMediaFromStorage(post.media_url)
        }
        // Upload new audio
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

      // Update post
      const result = await updatePost(post.id, editContent, newMediaUrl, newMediaType)

      if (result.success) {
        toast.success('Post updated successfully!')
        setIsEditing(false)
        setUploadProgress(0)
        router.refresh()
      } else {
        // Clean up newly uploaded media if post update failed
        if (newMediaUrl && (editImage || editAudio)) {
          await deleteMediaFromStorage(newMediaUrl)
        }
        toast.error(result.error || 'Failed to update post')
        setUploadProgress(0)
      }
    } catch (error) {
      // Clean up newly uploaded media on error
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
    <Card className="p-4 rounded-xl bg-zinc-900/50 border-zinc-800 hover:border-primary/50 transition-colors">
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
              {/* Upload progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
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
            <button
              onClick={handleToggleCommentInput}
              className="flex items-center gap-2 hover:text-primary transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm">{commentsCount}</span>
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

          {/* Comment input - appears when user clicks comment button */}
          {showCommentInput && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="flex gap-3">
                {/* User avatar */}
                {currentUserId && (
                  <div className="flex-shrink-0">
                    {post.user?.avatar_url ? (
                      <img
                        src={post.user.avatar_url}
                        alt="Your avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {post.user?.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Comment input field */}
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      // Submit with Ctrl+Enter or Cmd+Enter
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        handleSubmitComment()
                      }
                    }}
                    placeholder="Write a comment..."
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-gray-500"
                    rows={2}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {commentText.length}/500
                    </span>
                    <button
                      onClick={handleSubmitComment}
                      disabled={isSubmittingComment || !commentText.trim()}
                      className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Display comments */}
              {comments.length > 0 && (
                <div className="mt-4 space-y-3">
                  {comments.map((comment) => {
                    const isOwnComment = currentUserId === comment.user_id
                    const isEditingThisComment = editingCommentId === comment.id

                    return (
                    <div key={comment.id} className="group flex gap-3">
                      {/* Commenter avatar */}
                      <Link
                        href={`/profile/${comment.user?.username}`}
                        className="flex-shrink-0"
                      >
                        {comment.user?.avatar_url ? (
                          <img
                            src={comment.user.avatar_url}
                            alt={comment.user.username}
                            className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
                            <span className="text-primary font-semibold text-sm">
                              {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </Link>

                      {/* Comment content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/profile/${comment.user?.username}`}
                            className="font-semibold text-white text-sm hover:underline"
                          >
                            {comment.user?.display_name || comment.user?.username}
                          </Link>
                        </div>

                        {/* Comment bubble or edit mode */}
                        {isEditingThisComment ? (
                          <div className="mb-2">
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                              rows={2}
                              maxLength={500}
                            />
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {editCommentText.length}/500
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleCancelEditComment}
                                  className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                                >
                                  Annuler
                                </button>
                                <button
                                  onClick={() => handleSaveEditComment(comment.id)}
                                  disabled={isUpdatingComment || !editCommentText.trim()}
                                  className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                  {isUpdatingComment ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="inline-block bg-zinc-800/50 rounded-2xl px-3 py-2">
                              <p className="text-sm text-gray-200">{comment.content}</p>
                            </div>

                            {/* Three-dot menu - appears on hover for own comments */}
                            {isOwnComment && (
                              <div className="relative flex-shrink-0" ref={commentMenuOpen === comment.id ? commentMenuRef : null}>
                                <button
                                  onClick={() => setCommentMenuOpen(commentMenuOpen === comment.id ? null : comment.id)}
                                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-gray-400 hover:text-white transition-all"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {commentMenuOpen === comment.id && (
                                  <div className="absolute left-0 top-6 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10">
                                    <button
                                      onClick={() => handleEditComment(comment.id, comment.content)}
                                      className="w-full px-4 py-2 text-left text-white hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      Modifier...
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="w-full px-4 py-2 text-left text-red-500 hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Supprimer
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Comment actions */}
                        <div className="flex items-center gap-3 ml-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                          <button
                            onClick={() => handleCommentLike(comment.id)}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                              comment.is_liked_by_user
                                ? 'text-red-500'
                                : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${comment.is_liked_by_user ? 'fill-current' : ''}`}
                            />
                            {comment.likes_count > 0 && (
                              <span>{comment.likes_count}</span>
                            )}
                          </button>
                          <button
                            onClick={() => setReplyingTo(comment.id)}
                            className="text-xs text-gray-500 hover:text-primary transition-colors font-medium"
                          >
                            Répondre
                          </button>
                        </div>

                        {/* Reply input - shows when replying to this comment */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 ml-11 flex gap-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSubmitReply(comment.id)
                                } else if (e.key === 'Escape') {
                                  setReplyingTo(null)
                                  setReplyText('')
                                }
                              }}
                              placeholder="Write a reply..."
                              className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-gray-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={isSubmittingReply || !replyText.trim()}
                              className="px-4 py-2 text-sm bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmittingReply ? 'Sending...' : 'Send'}
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyText('')
                              }}
                              className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Display replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 ml-11 space-y-3">
                            {comment.replies.map((reply: any) => {
                              const isOwnReply = currentUserId === reply.user_id
                              const isEditingThisReply = editingReplyId === reply.id

                              return (
                              <div key={reply.id} className="group flex gap-2">
                                {/* Reply avatar */}
                                <Link
                                  href={`/profile/${reply.user?.username}`}
                                  className="flex-shrink-0"
                                >
                                  {reply.user?.avatar_url ? (
                                    <img
                                      src={reply.user.avatar_url}
                                      alt={reply.user.username}
                                      className="w-6 h-6 rounded-full object-cover hover:opacity-80 transition-opacity"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
                                      <span className="text-primary font-semibold text-xs">
                                        {reply.user?.username?.[0]?.toUpperCase() || 'U'}
                                      </span>
                                    </div>
                                  )}
                                </Link>

                                {/* Reply content */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Link
                                      href={`/profile/${reply.user?.username}`}
                                      className="font-semibold text-white text-xs hover:underline"
                                    >
                                      {reply.user?.display_name || reply.user?.username}
                                    </Link>
                                  </div>

                                  {/* Reply bubble or edit mode */}
                                  {isEditingThisReply ? (
                                    <div className="mb-2">
                                      <textarea
                                        value={editReplyText}
                                        onChange={(e) => setEditReplyText(e.target.value)}
                                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2 text-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                        rows={2}
                                        maxLength={500}
                                      />
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-500">
                                          {editReplyText.length}/500
                                        </span>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={handleCancelEditReply}
                                            className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                                          >
                                            Annuler
                                          </button>
                                          <button
                                            onClick={() => handleSaveEditReply(comment.id, reply.id)}
                                            disabled={isUpdatingComment || !editReplyText.trim()}
                                            className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                                          >
                                            {isUpdatingComment ? 'Enregistrement...' : 'Enregistrer'}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="inline-block bg-zinc-800/50 rounded-2xl px-3 py-1.5">
                                        <p className="text-xs text-gray-200">{reply.content}</p>
                                      </div>

                                      {/* Three-dot menu - appears on hover for own replies */}
                                      {isOwnReply && (
                                        <div className="relative flex-shrink-0" ref={replyMenuOpen === reply.id ? replyMenuRef : null}>
                                          <button
                                            onClick={() => setReplyMenuOpen(replyMenuOpen === reply.id ? null : reply.id)}
                                            className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-gray-400 hover:text-white transition-all"
                                          >
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                          </button>

                                          {replyMenuOpen === reply.id && (
                                            <div className="absolute left-0 top-5 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10">
                                              <button
                                                onClick={() => handleEditReply(comment.id, reply.id, reply.content)}
                                                className="w-full px-3 py-1.5 text-left text-white hover:bg-zinc-700 transition-colors flex items-center gap-2 text-xs"
                                              >
                                                <Edit className="w-3 h-3" />
                                                Modifier...
                                              </button>
                                              <button
                                                onClick={() => handleDeleteReply(comment.id, reply.id)}
                                                className="w-full px-3 py-1.5 text-left text-red-500 hover:bg-zinc-700 transition-colors flex items-center gap-2 text-xs"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                                Supprimer
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Reply actions */}
                                  <div className="flex items-center gap-3 ml-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      {formatTimeAgo(reply.created_at)}
                                    </span>
                                    <button
                                      onClick={() => handleReplyLike(comment.id, reply.id)}
                                      className={`flex items-center gap-1 text-xs transition-colors ${
                                        reply.is_liked_by_user
                                          ? 'text-red-500'
                                          : 'text-gray-500 hover:text-red-500'
                                      }`}
                                    >
                                      <Heart
                                        className={`w-3 h-3 ${reply.is_liked_by_user ? 'fill-current' : ''}`}
                                      />
                                      {reply.likes_count > 0 && (
                                        <span>{reply.likes_count}</span>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
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

      <ConfirmDialog
        isOpen={showDeleteCommentConfirm}
        title="Supprimer le commentaire"
        message="Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action ne peut pas être annulée."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        onConfirm={confirmDeleteComment}
        onCancel={cancelDeleteComment}
      />
    </Card>
  )
}
