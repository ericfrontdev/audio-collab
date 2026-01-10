-- Fix project_tracks UPDATE policy to include WITH CHECK clause
-- This is required for UPDATE policies to work properly

-- Drop the existing policy
DROP POLICY IF EXISTS "Project owners, club members, and project members can update tracks" ON project_tracks;
DROP POLICY IF EXISTS "Project owners, club members, and project members can update tr" ON project_tracks;

-- Recreate policy with both USING and WITH CHECK
CREATE POLICY "Project owners, club and project members can update tracks"
  ON project_tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_tracks.project_id
      AND (
        p.owner_id = auth.uid()
        OR
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
        OR
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
        p.owner_id = auth.uid()
        OR
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
        OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
          AND pm.user_id = auth.uid()
        )
      )
    )
  );
