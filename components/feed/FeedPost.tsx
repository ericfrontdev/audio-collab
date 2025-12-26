'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MoreHorizontal, Edit, Trash2, Send } from 'lucide-react'
import type { Post } from '@/lib/types/feed'
import { Link } from '@/i18n/routing'
import { useRouter } from '@/i18n/routing'
import { PostContent } from './PostContent'
import { PostActions } from './PostActions'
import { Comment } from './Comment'
import { usePostLike } from './hooks/usePostLike'
import { usePostEditor } from './hooks/usePostEditor'
import { useComments } from './hooks/useComments'

interface FeedPostProps {
  post: Post
  currentUserId?: string
}

export function FeedPost({ post, currentUserId }: FeedPostProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const editAudioInputRef = useRef<HTMLInputElement>(null)

  // Custom hooks for managing different aspects of the post
  const { isLiked, likesCount, isLiking, handleLike } = usePostLike(
    post.is_liked_by_user || false,
    post.likes_count || 0,
    post.id
  )

  const editor = usePostEditor(post, () => router.refresh())

  const commentManager = useComments(post.id)

  // Initialize comments count from post
  useEffect(() => {
    commentManager.initializeCommentsCount(post.comments_count || 0)
  }, [post.comments_count])

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

  const handleEditClick = () => {
    editor.handleEdit()
    setShowMenu(false)
  }

  const handleDeleteClick = () => {
    editor.handleDelete()
    setShowMenu(false)
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
        <Link href={`/profile/${post.user?.username}`} className="flex-shrink-0">
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
              <span className="text-gray-500 text-sm">{formatTimeAgo(post.created_at)}</span>
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
                      onClick={handleEditClick}
                      className="w-full px-4 py-2 text-left text-white hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit post
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      disabled={editor.isDeleting}
                      className="w-full px-4 py-2 text-left text-red-500 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {editor.isDeleting ? 'Deleting...' : 'Delete post'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post content - Edit mode or display mode */}
          {editor.isEditing ? (
            <div className="mb-3">
              <textarea
                value={editor.editContent}
                onChange={(e) => editor.setEditContent(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                maxLength={500}
              />
              {editor.uploadProgress > 0 && editor.uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Uploading...</span>
                    <span className="text-xs text-gray-400">{editor.uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${editor.uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">{editor.editContent.length}/500</span>
                <div className="flex gap-2">
                  <button
                    onClick={editor.handleCancelEdit}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editor.handleSaveEdit}
                    disabled={editor.isUpdating || !editor.editContent.trim()}
                    className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {editor.isUpdating ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <PostContent
              content={post.content}
              mediaUrl={post.media_url}
              mediaType={post.media_type}
              project={post.project}
              linkUrl={post.link_url}
              linkTitle={post.link_title}
              linkDescription={post.link_description}
              linkImage={post.link_image}
            />
          )}

          {/* Actions */}
          <PostActions
            likesCount={likesCount}
            commentsCount={commentManager.commentsCount}
            isLiked={isLiked}
            isLiking={isLiking}
            onLike={handleLike}
            onToggleComments={commentManager.handleToggleCommentInput}
          />

          {/* Comment input - appears when user clicks comment button */}
          {commentManager.showCommentInput && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="flex gap-3">
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

                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={commentManager.commentText}
                      onChange={(e) => commentManager.setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          commentManager.handleSubmitComment()
                        }
                      }}
                      placeholder="Write a comment..."
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 pr-12 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-gray-500"
                      rows={2}
                      maxLength={500}
                    />
                    <button
                      onClick={commentManager.handleSubmitComment}
                      disabled={commentManager.isSubmittingComment || !commentManager.commentText.trim()}
                      className="absolute right-2 bottom-2 p-2 text-primary hover:text-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Send comment"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-end mt-1">
                    <span className="text-xs text-gray-500">{commentManager.commentText.length}/500</span>
                  </div>
                </div>
              </div>

              {/* Display comments */}
              {commentManager.comments.length > 0 && (
                <div className="mt-4 space-y-3">
                  {commentManager.comments.map((comment) => (
                    <Comment
                      key={comment.id}
                      comment={comment}
                      postId={post.id}
                      currentUserId={currentUserId}
                      onUpdate={commentManager.handleCommentUpdate}
                      onDelete={commentManager.handleCommentDelete}
                      onLike={commentManager.handleCommentLike}
                      onReplyUpdate={commentManager.handleReplyUpdate}
                      onReplyDelete={commentManager.handleReplyDelete}
                      onReplyLike={commentManager.handleReplyLike}
                      onReplyAdd={commentManager.handleReplyAdd}
                      formatTimeAgo={formatTimeAgo}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={editor.showDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={editor.confirmDelete}
        onCancel={editor.cancelDelete}
      />

      <ConfirmDialog
        isOpen={commentManager.showDeleteCommentConfirm}
        title="Supprimer le commentaire"
        message="Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action ne peut pas être annulée."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        onConfirm={commentManager.confirmDeleteComment}
        onCancel={commentManager.cancelDeleteComment}
      />

      <ConfirmDialog
        isOpen={commentManager.showDeleteReplyConfirm}
        title="Supprimer la réponse"
        message="Êtes-vous sûr de vouloir supprimer cette réponse ? Cette action ne peut pas être annulée."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        onConfirm={commentManager.confirmDeleteReply}
        onCancel={commentManager.cancelDeleteReply}
      />
    </Card>
  )
}
