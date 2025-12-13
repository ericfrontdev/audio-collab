-- Update RLS policies to make clubs admin-only for creation/editing

-- Drop existing club creation/update/delete policies
DROP POLICY IF EXISTS "Anyone can create clubs" ON clubs;
DROP POLICY IF EXISTS "Owners can update their clubs" ON clubs;
DROP POLICY IF EXISTS "Owners can delete their clubs" ON clubs;

-- Admins only can create/update/delete clubs
CREATE POLICY "Admins can create clubs"
  ON clubs FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update clubs"
  ON clubs FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete clubs"
  ON clubs FOR DELETE
  USING (is_admin(auth.uid()));

-- Update club_members policies to allow anyone to join (not just public clubs)
DROP POLICY IF EXISTS "Users can join public clubs" ON club_members;

CREATE POLICY "Users can join clubs"
  ON club_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Update club challenges policies - only admins can create/update challenges
DROP POLICY IF EXISTS "Owners/admins can create challenges" ON club_challenges;
DROP POLICY IF EXISTS "Owners/admins can update challenges" ON club_challenges;

CREATE POLICY "Admins can create challenges"
  ON club_challenges FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admins can update challenges"
  ON club_challenges FOR UPDATE
  USING (is_admin(auth.uid()));

-- Remove the owner role from club_members since clubs are managed by admins
-- Update the role check to only allow admin/member
ALTER TABLE club_members
  DROP CONSTRAINT IF EXISTS club_members_role_check;

ALTER TABLE club_members
  ADD CONSTRAINT club_members_role_check
  CHECK (role IN ('admin', 'member'));

-- Update the club_members UPDATE policy since we removed 'owner' role
DROP POLICY IF EXISTS "Owners/admins can manage members" ON club_members;

CREATE POLICY "Admins can manage members"
  ON club_members FOR UPDATE
  USING (is_admin(auth.uid()));
