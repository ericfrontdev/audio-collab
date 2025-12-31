-- Add created_by and is_collaborative columns to project_tracks
ALTER TABLE project_tracks
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN is_collaborative boolean DEFAULT false;

-- Set existing tracks to be owned by the project owner
UPDATE project_tracks pt
SET created_by = p.owner_id
FROM projects p
WHERE pt.project_id = p.id;

-- Make created_by required for new tracks
ALTER TABLE project_tracks
ALTER COLUMN created_by SET NOT NULL;

-- Update the RLS policy for inserting takes
-- Allow if: user is track creator OR (track is collaborative AND user is club member)
DROP POLICY IF EXISTS "Project owners and club members can insert takes" ON project_takes;

CREATE POLICY "Track creator or collaborators can insert takes" ON project_takes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_takes.track_id
      AND (
        -- User is the track creator
        pt.created_by = auth.uid()
        OR
        -- Track is collaborative AND user is a club member
        (pt.is_collaborative = true AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- Update the RLS policy for updating takes (same logic)
DROP POLICY IF EXISTS "Project owners and club members can update takes" ON project_takes;

CREATE POLICY "Track creator or collaborators can update takes" ON project_takes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_takes.track_id
      AND (
        pt.created_by = auth.uid()
        OR
        (pt.is_collaborative = true AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- Update the RLS policy for deleting takes (same logic)
DROP POLICY IF EXISTS "Project owners and club members can delete takes" ON project_takes;

CREATE POLICY "Track creator or collaborators can delete takes" ON project_takes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_takes.track_id
      AND (
        pt.created_by = auth.uid()
        OR
        (pt.is_collaborative = true AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );
