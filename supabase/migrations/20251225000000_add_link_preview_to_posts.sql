-- Add link preview fields to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS link_url text,
ADD COLUMN IF NOT EXISTS link_title text,
ADD COLUMN IF NOT EXISTS link_description text,
ADD COLUMN IF NOT EXISTS link_image text;

-- Add index for link_url
CREATE INDEX IF NOT EXISTS idx_posts_link_url ON posts(link_url);
