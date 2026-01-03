-- Add columns to posts table to support shared posts (like Twitter/X retweets)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS profile_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0 NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_shared_post_id ON posts(shared_post_id) WHERE shared_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_profile_user_id ON posts(profile_user_id) WHERE profile_user_id IS NOT NULL;

-- Add constraint: if shared_post_id exists, content should be limited to 500 chars
DO $$ BEGIN
  ALTER TABLE posts DROP CONSTRAINT IF EXISTS shared_post_content_check;
  ALTER TABLE posts
    ADD CONSTRAINT shared_post_content_check
    CHECK (
      (shared_post_id IS NULL) OR
      (shared_post_id IS NOT NULL AND (content IS NULL OR length(content) <= 500))
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function to increment shares_count when a post is shared
CREATE OR REPLACE FUNCTION increment_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shared_post_id IS NOT NULL AND NEW.profile_user_id IS NOT NULL THEN
    -- Only count shares to feeds, not DMs
    UPDATE posts
    SET shares_count = shares_count + 1
    WHERE id = NEW.shared_post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement shares_count when a shared post is deleted
CREATE OR REPLACE FUNCTION decrement_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.shared_post_id IS NOT NULL AND OLD.profile_user_id IS NOT NULL THEN
    UPDATE posts
    SET shares_count = GREATEST(shares_count - 1, 0)
    WHERE id = OLD.shared_post_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for posts table
DROP TRIGGER IF EXISTS increment_post_shares ON posts;
CREATE TRIGGER increment_post_shares
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION increment_shares_count();

DROP TRIGGER IF EXISTS decrement_post_shares ON posts;
CREATE TRIGGER decrement_post_shares
  AFTER DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION decrement_shares_count();

-- Comments for documentation
COMMENT ON COLUMN posts.shared_post_id IS 'Reference to original post if this is a shared post (like a retweet)';
COMMENT ON COLUMN posts.profile_user_id IS 'User whose profile feed this post appears on (NULL = main feed)';
COMMENT ON COLUMN posts.shares_count IS 'Number of times this post has been shared to feeds (not counting DMs)';
