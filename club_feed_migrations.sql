-- =====================================================
-- CLUB FEED MIGRATIONS FOR PRODUCTION
-- =====================================================
-- Execute this SQL in your Supabase Dashboard SQL Editor
-- Go to: https://supabase.com/dashboard/project/ydmejoinermllumzjsgi/sql
-- =====================================================

-- Migration 1: Add club_id column to posts table
-- =====================================================

-- Add club_id column to posts table for club feeds
ALTER TABLE posts ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES clubs(id) ON DELETE CASCADE;

-- Create index for performance when filtering by club_id
CREATE INDEX IF NOT EXISTS idx_posts_club_id ON posts(club_id);

-- Add comment for documentation
COMMENT ON COLUMN posts.club_id IS 'Optional club ID if this post belongs to a club feed. NULL for public posts.';


-- Migration 2: Update RLS policies for club posts
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;

-- New SELECT policy: anyone can view public posts, only members can view club posts
CREATE POLICY "Anyone can view public posts, members can view club posts"
  ON posts FOR SELECT
  USING (
    club_id IS NULL  -- Public posts (not club-specific)
    OR
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = posts.club_id
      AND club_members.user_id = auth.uid()
    )
  );

-- New INSERT policy: users can create public posts, only members can create club posts
CREATE POLICY "Users can create posts with club membership check"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      club_id IS NULL  -- Regular public posts
      OR
      EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = posts.club_id
        AND club_members.user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- END OF MIGRATIONS
-- =====================================================
-- After running this, club feed functionality will be enabled!
-- Club posts will only be visible to club members.
-- =====================================================
