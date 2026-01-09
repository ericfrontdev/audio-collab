-- Create project_hall_posts table for Hall discussion feed
-- This is separate from project_messages (studio chat)
-- Hall posts are public and visible to anyone viewing the project

-- ============================================================================
-- PROJECT HALL POSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_hall_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_content_length CHECK (char_length(content) BETWEEN 1 AND 2000)
);

-- Indexes for fast queries
CREATE INDEX idx_project_hall_posts_project ON project_hall_posts(project_id, created_at DESC);
CREATE INDEX idx_project_hall_posts_user ON project_hall_posts(user_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE project_hall_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view hall posts (public feed)
CREATE POLICY "Anyone can view hall posts"
  ON project_hall_posts FOR SELECT
  USING (true);

-- Authenticated users can create hall posts
CREATE POLICY "Authenticated users can create hall posts"
  ON project_hall_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own hall posts"
  ON project_hall_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own hall posts"
  ON project_hall_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE TRIGGER update_project_hall_posts_updated_at
  BEFORE UPDATE ON project_hall_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
