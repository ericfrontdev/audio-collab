-- Update RLS policies for posts to support club feeds
-- Club posts should only be visible to club members

-- Drop existing permissive policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
  DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
  DROP POLICY IF EXISTS "Anyone can view public posts, members can view club posts" ON posts;
  DROP POLICY IF EXISTS "Users can create posts with club membership check" ON posts;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- New SELECT policy: anyone can view public posts, only members can view club posts
DO $$ BEGIN
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
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- New INSERT policy: users can create public posts, only members can create club posts
DO $$ BEGIN
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
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Note: UPDATE and DELETE policies remain unchanged (already check ownership)
