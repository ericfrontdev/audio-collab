'use client'

import { useState, useRef, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { Heart, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { updateComment, deleteComment } from '@/app/actions/feed/comments'
import { toggleCommentLike } from '@/app/actions/feed/likes'
import { toast } from 'react-toastify'
import { useCurrentUserStore, useFeedStore } from '@/lib/stores'
import { formatTimeAgo } from '@/lib/utils/timeUtils'

interface CommentReplyProps {
  reply: any
  parentCommentId: string
}

export function CommentReply({ reply, parentCommentId }: CommentReplyProps) {
  const currentUserId = useCurrentUserStore((state) => state.user?.id)
  const currentPostId = useFeedStore((state) => state.currentPostId)
  const updateReplyContent = useFeedStore((state) => state.updateReplyContent)
  const removeReply = useFeedStore((state) => state.removeReply)
  const toggleReplyLikeStore = useFeedStore((state) => state.toggleReplyLike)

  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(reply.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwnReply = currentUserId === reply.user_id

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const handleEdit = () => {
    setIsEditing(true)
    setEditText(reply.content)
    setMenuOpen(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText(reply.content)
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      toast.error('Reply cannot be empty')
      return
    }

    if (!currentPostId) return

    setIsUpdating(true)

    try {
      const result = await updateComment(reply.id, editText.trim())

      if (result.success) {
        // Update store
        updateReplyContent(currentPostId, parentCommentId, reply.id, editText.trim())
        setIsEditing(false)
        toast.success('Reply updated!')
      } else {
        toast.error(result.error || 'Failed to update reply')
      }
    } catch (error) {
      toast.error('Failed to update reply')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!currentPostId) return

    setMenuOpen(false)

    try {
      const result = await deleteComment(reply.id)

      if (result.success) {
        // Update store
        removeReply(currentPostId, parentCommentId, reply.id)
        toast.success('Reply deleted!')
      } else {
        toast.error(result.error || 'Failed to delete reply')
      }
    } catch (error) {
      toast.error('Failed to delete reply')
    }
  }

  const handleLike = async () => {
    if (!currentPostId) return

    try {
      const result = await toggleCommentLike(reply.id)

      if (result.success) {
        const newCount = result.liked ? reply.likes_count + 1 : reply.likes_count - 1
        // Update store
        toggleReplyLikeStore(currentPostId, parentCommentId, reply.id, newCount, result.liked || false)
      } else {
        toast.error(result.error || 'Failed to like reply')
      }
    } catch (error) {
      toast.error('Failed to like reply')
    }
  }

  return (
    <div className="flex gap-2">
      {/* Reply avatar */}
      <Link href={`/profile/${reply.user?.username}`} className="flex-shrink-0">
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
        {isEditing ? (
          <div className="mb-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2 text-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              rows={2}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{editText.length}/500</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editText.trim()}
                  className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="group flex items-center gap-2">
            <div className="inline-block bg-zinc-800/50 rounded-2xl px-3 py-1.5">
              <p className="text-xs text-gray-200">{reply.content}</p>
            </div>

            {/* Three-dot menu - appears on hover for own replies */}
            {isOwnReply && (
              <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-gray-400 hover:text-white transition-all"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {menuOpen && (
                  <div className="absolute left-0 top-5 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      onClick={handleEdit}
                      className="w-full px-3 py-1.5 text-left text-white hover:bg-zinc-700 transition-colors flex items-center gap-2 text-xs"
                    >
                      <Edit className="w-3 h-3" />
                      Modifier...
                    </button>
                    <button
                      onClick={handleDelete}
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
          <span className="text-xs text-gray-500">{formatTimeAgo(reply.created_at)}</span>
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-colors ${
              reply.is_liked_by_user ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-3 h-3 ${reply.is_liked_by_user ? 'fill-current' : ''}`} />
            {reply.likes_count > 0 && <span>{reply.likes_count}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
