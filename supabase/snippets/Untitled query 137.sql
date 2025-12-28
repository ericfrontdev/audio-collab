-- Add parent_id column to post_comments table for threaded comments
ALTER TABLE post_comments
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES post_comments(id) ON DELETE CASCADE;

-- Add index for parent_id
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);