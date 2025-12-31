-- Add club_id column to posts table for club feeds
-- Posts can optionally belong to a club (nullable)

ALTER TABLE posts ADD COLUMN club_id uuid REFERENCES clubs(id) ON DELETE CASCADE;

-- Create index for performance when filtering by club_id
CREATE INDEX idx_posts_club_id ON posts(club_id);

-- Add comment for documentation
COMMENT ON COLUMN posts.club_id IS 'Optional club ID if this post belongs to a club feed. NULL for public posts.';
