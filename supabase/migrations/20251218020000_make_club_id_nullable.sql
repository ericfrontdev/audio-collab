-- Make club_id nullable for personal projects

ALTER TABLE projects ALTER COLUMN club_id DROP NOT NULL;

-- Update the RLS policy for creating projects to allow personal projects without club_id
DROP POLICY IF EXISTS "Club members can create projects" ON projects;

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    -- Personal projects (no club): user must be authenticated
    (kind = 'personal' AND club_id IS NULL AND auth.uid() IS NOT NULL)
    OR
    -- Club projects: user must be a club member
    (kind = 'club' AND club_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = projects.club_id
      AND club_members.user_id = auth.uid()
    ))
    OR
    -- Challenge projects: user must be a club member
    (kind = 'challenge' AND club_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = projects.club_id
      AND club_members.user_id = auth.uid()
    ))
  );
