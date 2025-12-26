export interface ProjectMessage {
  id: string
  project_id: string
  user_id: string
  content: string
  reply_to: string | null
  is_edited: boolean
  created_at: string
  updated_at: string
  // Joined data
  user?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  reply_to_message?: {
    id: string
    content: string
    user?: {
      username: string
      display_name: string | null
    }
  } | null
}
