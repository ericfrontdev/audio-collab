-- Fix infinite recursion in club_members SELECT policy
-- The previous policy tried to check if user is a member by querying club_members itself
-- This created an infinite loop when Postgres tried to verify the policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Club members are viewable by club members" ON club_members;
DROP POLICY IF EXISTS "Anyone can view club members" ON club_members;

-- Create a simple policy without recursion
-- For now, allow everyone to view all club members (we can refine this later)
CREATE POLICY "Anyone can view club members"
  ON club_members FOR SELECT
  USING (true);

-- Ensure clubs are viewable by everyone (needed for public club listings)
DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON clubs;

CREATE POLICY "Clubs are viewable by everyone"
  ON clubs FOR SELECT
  USING (true);
