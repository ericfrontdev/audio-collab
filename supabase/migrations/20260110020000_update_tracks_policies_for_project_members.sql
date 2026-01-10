-- Update project_tracks policies to include project_members
-- This ensures project members (not just club members) can update tracks

-- Drop existing policies
DROP POLICY IF EXISTS "Project owners and club members can update tracks" ON project_tracks;

-- Recreate policy with project_members support
CREATE POLICY "Project owners, club members, and project members can update tracks"
  ON project_tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_tracks.project_id
      AND (
        -- Project owner
        p.owner_id = auth.uid()
        OR
        -- Club member (if project is in a club)
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
        OR
        -- Project member
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
          AND pm.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_tracks.project_id
      AND (
        -- Project owner
        p.owner_id = auth.uid()
        OR
        -- Club member (if project is in a club)
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
        OR
        -- Project member
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
          AND pm.user_id = auth.uid()
        )
      )
    )
  );
