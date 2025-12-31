import type { Post } from './feed'

export interface Conversation {
  id: string
  user_1_id: string
  user_2_id: string
  last_message_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  other_user?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  last_message?: {
    content: string
    created_at: string
    user_id: string
  }
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  user_id: string
  content: string
  is_read: boolean
  is_edited: boolean
  created_at: string
  updated_at: string
  // Sharing fields
  shared_post_id: string | null
  // Joined data
  user?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  // Joined shared post
  shared_post?: Post | null
}
