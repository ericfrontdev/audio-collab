import { useState } from 'react'
import { addPostComment, getPostComments, toggleCommentLike } from '@/app/actions/feed'
import { toast } from 'react-toastify'

export function useComments(postId: string) {
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentsCount, setCommentsCount] = useState(0)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false)
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null)
  const [showDeleteReplyConfirm, setShowDeleteReplyConfirm] = useState(false)

  const initializeCommentsCount = (count: number) => {
    setCommentsCount(count)
  }

  const handleToggleCommentInput = async () => {
    const newShowState = !showCommentInput
    setShowCommentInput(newShowState)

    if (newShowState && !commentsLoaded && !loadingComments) {
      setLoadingComments(true)
      const result = await getPostComments(postId)
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

    setCommentsCount(commentsCount + 1)

    try {
      const result = await addPostComment(postId, commentText.trim())

      if (result.success && result.comment) {
        setComments([result.comment, ...comments])
        setCommentText('')
        toast.success('Comment added!')
      } else {
        setCommentsCount(previousCount)
        toast.error(result.error || 'Failed to add comment')
      }
    } catch (error) {
      setCommentsCount(previousCount)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleCommentUpdate = (commentId: string, content: string) => {
    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return { ...comment, content }
      }
      return comment
    })
    setComments(updatedComments)
  }

  const handleCommentDelete = (commentId: string) => {
    setDeletingCommentId(commentId)
    setShowDeleteCommentConfirm(true)
  }

  const confirmDeleteComment = async () => {
    if (!deletingCommentId) return

    setShowDeleteCommentConfirm(false)

    const updatedComments = comments.filter((comment) => comment.id !== deletingCommentId)
    setComments(updatedComments)
    setCommentsCount(commentsCount - 1)
    setDeletingCommentId(null)
  }

  const cancelDeleteComment = () => {
    setShowDeleteCommentConfirm(false)
    setDeletingCommentId(null)
  }

  const handleCommentLike = async (commentId: string) => {
    const commentIndex = comments.findIndex((c) => c.id === commentId)
    if (commentIndex === -1) return

    const comment = comments[commentIndex]
    const previousLiked = comment.is_liked_by_user
    const previousCount = comment.likes_count || 0

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

  const handleReplyUpdate = (commentId: string, replyId: string, content: string) => {
    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        const updatedReplies = comment.replies?.map((reply: any) => {
          if (reply.id === replyId) {
            return { ...reply, content }
          }
          return reply
        })
        return { ...comment, replies: updatedReplies }
      }
      return comment
    })
    setComments(updatedComments)
  }

  const handleReplyDelete = (commentId: string, replyId: string) => {
    setDeletingReplyId(replyId)
    setShowDeleteReplyConfirm(true)
  }

  const confirmDeleteReply = async () => {
    if (!deletingReplyId) return

    setShowDeleteReplyConfirm(false)

    const updatedComments = comments.map((comment) => {
      if (comment.replies) {
        const updatedReplies = comment.replies.filter((reply: any) => reply.id !== deletingReplyId)
        return { ...comment, replies: updatedReplies }
      }
      return comment
    })
    setComments(updatedComments)
    setDeletingReplyId(null)
  }

  const cancelDeleteReply = () => {
    setShowDeleteReplyConfirm(false)
    setDeletingReplyId(null)
  }

  const handleReplyLike = async (commentId: string, replyId: string) => {
    const commentIndex = comments.findIndex((c) => c.id === commentId)
    if (commentIndex === -1) return

    const comment = comments[commentIndex]
    const replyIndex = comment.replies?.findIndex((r: any) => r.id === replyId) ?? -1
    if (replyIndex === -1) return

    const reply = comment.replies[replyIndex]
    const previousLiked = reply.is_liked_by_user
    const previousCount = reply.likes_count || 0

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

  const handleReplyAdd = (commentId: string, reply: any) => {
    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply],
        }
      }
      return comment
    })
    setComments(updatedComments)
  }

  return {
    showCommentInput,
    commentText,
    setCommentText,
    commentsCount,
    isSubmittingComment,
    comments,
    showDeleteCommentConfirm,
    showDeleteReplyConfirm,
    initializeCommentsCount,
    handleToggleCommentInput,
    handleSubmitComment,
    handleCommentUpdate,
    handleCommentDelete,
    confirmDeleteComment,
    cancelDeleteComment,
    handleCommentLike,
    handleReplyUpdate,
    handleReplyDelete,
    confirmDeleteReply,
    cancelDeleteReply,
    handleReplyLike,
    handleReplyAdd,
  }
}
