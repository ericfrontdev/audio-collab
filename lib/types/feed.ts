export interface Post {
  id: string
  user_id: string
  content: string
  media_url: string | null
  media_type: 'image' | 'audio' | 'video' | null
  project_id: string | null
  created_at: string
  updated_at: string
  // Joined data
  user?: {
    id: string
    username: string
    avatar_url: string | null
    display_name: string | null
  }
  project?: {
    id: string
    title: string
  }
  likes_count?: number
  comments_count?: number
  is_liked_by_user?: boolean
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  // Joined data
  user?: {
    id: string
    username: string
    avatar_url: string | null
    display_name: string | null
  }
}
