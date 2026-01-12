'use client'

import { useState, useRef, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { Heart, MoreHorizontal, Edit, Trash2, Send } from 'lucide-react'
import { updateComment, deleteComment, addCommentReply } from '@/app/actions/feed/comments'
import { toggleCommentLike } from '@/app/actions/feed/likes'
import { toast } from 'react-toastify'
import { CommentReply } from './CommentReply'

interface CommentProps {
  comment: any
  postId: string
  currentUserId?: string
  onUpdate: (commentId: string, content: string) => void
  onDelete: (commentId: string) => void
  onLike: (commentId: string) => void
  onReplyUpdate: (commentId: string, replyId: string, content: string) => void
  onReplyDelete: (commentId: string, replyId: string) => void
  onReplyLike: (commentId: string, replyId: string) => void
  onReplyAdd: (commentId: string, reply: any) => void
  formatTimeAgo: (date: string) => string
}

export function Comment({
  comment,
  postId,
  currentUserId,
  onUpdate,
  onDelete,
  onLike,
  onReplyUpdate,
  onReplyDelete,
  onReplyLike,
  onReplyAdd,
  formatTimeAgo,
}: CommentProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const [replyingTo, setReplyingTo] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwnComment = currentUserId === comment.user_id

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
    setEditText(comment.content)
    setMenuOpen(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText(comment.content)
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    setIsUpdating(true)

    try {
      const result = await updateComment(comment.id, editText.trim())

      if (result.success) {
        onUpdate(comment.id, editText.trim())
        setIsEditing(false)
        toast.success('Comment updated!')
      } else {
        toast.error(result.error || 'Failed to update comment')
      }
    } catch (error) {
      toast.error('Failed to update comment')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = () => {
    setMenuOpen(false)
    onDelete(comment.id)
  }

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty')
      return
    }

    setIsSubmittingReply(true)

    try {
      const result = await addCommentReply(postId, comment.id, replyText.trim())

      if (result.success && result.reply) {
        onReplyAdd(comment.id, result.reply)
        setReplyText('')
        setReplyingTo(false)
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

  return (
    <div className="flex gap-3">
      {/* Commenter avatar */}
      <Link href={`/profile/${comment.user?.username}`} className="flex-shrink-0">
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
        {isEditing ? (
          <div className="mb-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              rows={2}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{editText.length}/500</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editText.trim()}
                  className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="group flex items-center gap-2">
            <div className="inline-block bg-zinc-800/50 rounded-2xl px-3 py-2">
              <p className="text-sm text-gray-200">{comment.content}</p>
            </div>

            {/* Three-dot menu - appears on hover for own comments */}
            {isOwnComment && (
              <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-gray-400 hover:text-white transition-all"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <div className="absolute left-0 top-6 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-white hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Modifier...
                    </button>
                    <button
                      onClick={handleDelete}
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
          <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              comment.is_liked_by_user ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${comment.is_liked_by_user ? 'fill-current' : ''}`} />
            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
          </button>
          <button
            onClick={() => setReplyingTo(!replyingTo)}
            className="text-xs text-gray-500 hover:text-primary transition-colors font-medium"
          >
            Répondre
          </button>
        </div>

        {/* Reply input - shows when replying to this comment */}
        {replyingTo && (
          <div className="mt-3 ml-11 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmitReply()
                } else if (e.key === 'Escape') {
                  setReplyingTo(false)
                  setReplyText('')
                }
              }}
              placeholder="Write a reply..."
              className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-gray-500"
              autoFocus
            />
            <button
              onClick={handleSubmitReply}
              disabled={isSubmittingReply || !replyText.trim()}
              className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send reply"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setReplyingTo(false)
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
            {comment.replies.map((reply: any) => (
              <CommentReply
                key={reply.id}
                reply={reply}
                parentCommentId={comment.id}
                currentUserId={currentUserId}
                onUpdate={(replyId, content) => onReplyUpdate(comment.id, replyId, content)}
                onDelete={(replyId) => onReplyDelete(comment.id, replyId)}
                onLike={(replyId) => onReplyLike(comment.id, replyId)}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
