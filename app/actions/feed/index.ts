/**
 * Feed actions - modular exports
 *
 * This file provides convenient re-exports of all feed-related server actions.
 * Components can import from this index or directly from specific modules.
 */

// Post actions
export {
  createPost,
  getProfilePosts,
  getFeedPosts,
  getClubPosts,
  updatePost,
  deletePost,
} from './posts'

// Comment actions
export {
  addPostComment,
  getPostComments,
  addCommentReply,
  updateComment,
  deleteComment,
} from './comments'

// Like actions
export {
  toggleLikePost,
  toggleCommentLike,
} from './likes'

// Share actions
export {
  sharePostToMessage,
  sharePostToFeed,
  sharePostToClub,
} from './shares'

// Helper utilities
export { getEnrichedSharedPost, type SupabaseError } from './helpers'
