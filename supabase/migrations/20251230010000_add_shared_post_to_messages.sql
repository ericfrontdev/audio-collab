-- Add column to messages table to support sharing posts in messages
ALTER TABLE messages
  ADD COLUMN shared_post_id uuid REFERENCES posts(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_messages_shared_post_id ON messages(shared_post_id) WHERE shared_post_id IS NOT NULL;

-- Modify content constraint to allow NULL when shared_post_id exists
ALTER TABLE messages
  DROP CONSTRAINT messages_content_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_content_check
  CHECK (
    (shared_post_id IS NULL AND char_length(content) > 0 AND char_length(content) <= 2000) OR
    (shared_post_id IS NOT NULL AND (content IS NULL OR char_length(content) <= 500))
  );

-- Comment for documentation
COMMENT ON COLUMN messages.shared_post_id IS 'Reference to shared post in messages (can be sent with optional commentary)';
