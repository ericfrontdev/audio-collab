/**
 * Feed Store
 *
 * Global state management for feed posts, comments, and replies.
 * Eliminates prop drilling in Comment/CommentReply components.
 */

import { create } from 'zustand'

// Types
export interface Reply {
  id: string
  content: string
  user_id: string
  user?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  created_at: string
  likes_count: number
  is_liked_by_user: boolean
}

export interface Comment {
  id: string
  post_id: string
  content: string
  user_id: string
  user?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  created_at: string
  likes_count: number
  is_liked_by_user: boolean
  replies?: Reply[]
}

interface FeedState {
  // Context - which post we're currently viewing/interacting with
  currentPostId: string | null

  // Comments data indexed by post ID
  commentsByPost: Record<string, Comment[]>

  // Loading states
  loadingComments: Record<string, boolean>
  submittingComment: boolean
  submittingReply: Record<string, boolean> // indexed by commentId

  // Editing states
  editingCommentId: string | null
  editingReplyId: string | null

  // Delete confirmation states
  deletingCommentId: string | null
  deletingReplyId: string | null

  // Actions - Context
  setCurrentPost: (postId: string | null) => void

  // Actions - Comments CRUD
  setComments: (postId: string, comments: Comment[]) => void
  addComment: (postId: string, comment: Comment) => void
  updateCommentContent: (postId: string, commentId: string, content: string) => void
  removeComment: (postId: string, commentId: string) => void
  toggleCommentLike: (postId: string, commentId: string, newCount: number, isLiked: boolean) => void

  // Actions - Replies CRUD
  addReply: (postId: string, commentId: string, reply: Reply) => void
  updateReplyContent: (postId: string, commentId: string, replyId: string, content: string) => void
  removeReply: (postId: string, commentId: string, replyId: string) => void
  toggleReplyLike: (postId: string, commentId: string, replyId: string, newCount: number, isLiked: boolean) => void

  // Actions - UI State
  setEditingComment: (commentId: string | null) => void
  setEditingReply: (replyId: string | null) => void
  setDeletingComment: (commentId: string | null) => void
  setDeletingReply: (replyId: string | null) => void
  setLoadingComments: (postId: string, loading: boolean) => void
  setSubmittingComment: (submitting: boolean) => void
  setSubmittingReply: (commentId: string, submitting: boolean) => void

  // Utility
  getComments: (postId: string) => Comment[]
  reset: () => void
}

const initialState = {
  currentPostId: null,
  commentsByPost: {},
  loadingComments: {},
  submittingComment: false,
  submittingReply: {},
  editingCommentId: null,
  editingReplyId: null,
  deletingCommentId: null,
  deletingReplyId: null,
}

export const useFeedStore = create<FeedState>((set, get) => ({
  ...initialState,

  // Context
  setCurrentPost: (postId) => set({ currentPostId: postId }),

  // Comments CRUD
  setComments: (postId, comments) =>
    set((state) => ({
      commentsByPost: {
        ...state.commentsByPost,
        [postId]: comments,
      },
    })),

  addComment: (postId, comment) =>
    set((state) => {
      const existing = state.commentsByPost[postId] || []
      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: [...existing, comment],
        },
      }
    }),

  updateCommentContent: (postId, commentId, content) =>
    set((state) => {
      const comments = state.commentsByPost[postId] || []
      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: comments.map((c) =>
            c.id === commentId ? { ...c, content } : c
          ),
        },
      }
    }),

  removeComment: (postId, commentId) =>
    set((state) => {
      const comments = state.commentsByPost[postId] || []
      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: comments.filter((c) => c.id !== commentId),
        },
      }
    }),

  toggleCommentLike: (postId, commentId, newCount, isLiked) =>
    set((state) => {
      const comments = state.commentsByPost[postId] || []
      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: comments.map((c) =>
            c.id === commentId
              ? { ...c, likes_count: newCount, is_liked_by_user: isLiked }
              : c
          ),
        },
      }
    }),

  // Replies CRUD
  addReply: (postId, commentId, reply) =>
    set((state) => {
      const comments = state.commentsByPost[postId] || []
      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: comments.map((c) =>
            c.id === commentId
              ? { ...c, replies: [...(c.replies || []), reply] }
              : c
          ),
        },
      }
    }),

  updateReplyContent: (postId, commentId, replyId, content) =>
    set((state) => {
      const comments = state.commentsByPost[postId] || []
      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: comments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  replies: (c.replies || []).map((r) =>
                    r.id === replyId ? { ...r, content } : r
                  ),
                }
              : c
          ),
        },
      }
    }),

  removeReply: (postId, commentId, replyId) =>
    set((state) => {
      const comments = state.commentsByPost[postId] || []
      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: comments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  replies: (c.replies || []).filter((r) => r.id !== replyId),
                }
              : c
          ),
        },
      }
    }),

  toggleReplyLike: (postId, commentId, replyId, newCount, isLiked) =>
    set((state) => {
      const comments = state.commentsByPost[postId] || []
      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: comments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  replies: (c.replies || []).map((r) =>
                    r.id === replyId
                      ? { ...r, likes_count: newCount, is_liked_by_user: isLiked }
                      : r
                  ),
                }
              : c
          ),
        },
      }
    }),

  // UI State
  setEditingComment: (commentId) => set({ editingCommentId: commentId }),
  setEditingReply: (replyId) => set({ editingReplyId: replyId }),
  setDeletingComment: (commentId) => set({ deletingCommentId: commentId }),
  setDeletingReply: (replyId) => set({ deletingReplyId: replyId }),

  setLoadingComments: (postId, loading) =>
    set((state) => ({
      loadingComments: {
        ...state.loadingComments,
        [postId]: loading,
      },
    })),

  setSubmittingComment: (submitting) => set({ submittingComment: submitting }),

  setSubmittingReply: (commentId, submitting) =>
    set((state) => ({
      submittingReply: {
        ...state.submittingReply,
        [commentId]: submitting,
      },
    })),

  // Utility
  getComments: (postId) => {
    const state = get()
    return state.commentsByPost[postId] || []
  },

  reset: () => set(initialState),
}))
