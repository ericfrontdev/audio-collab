export interface Post {
  id: string
  user_id: string
  content: string
  media_url: string | null
  media_type: 'image' | 'audio' | 'video' | null
  project_id: string | null
  link_url: string | null
  link_title: string | null
  link_description: string | null
  link_image: string | null
  created_at: string
  updated_at: string
  // Sharing fields
  shared_post_id: string | null
  profile_user_id: string | null
  club_id: string | null
  shares_count: number
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
  // Joined shared post data (recursive)
  shared_post?: Post | null
  // Joined profile user data (for personal feed posts)
  profile_user?: {
    id: string
    username: string
    avatar_url: string | null
    display_name: string | null
  }
  // Joined club data (for club feed posts)
  club?: {
    id: string
    name: string
    slug: string
  } | null
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
