export type ShareDestination = 'message' | 'feed'

export interface ShareToMessageParams {
  postId: string
  conversationId: string
  content?: string
}

export interface ShareToFeedParams {
  postId: string
  targetUserId: string
  content?: string
}
