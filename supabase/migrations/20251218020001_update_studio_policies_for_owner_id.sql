-- Update studio schema policies to use owner_id instead of created_by
-- This runs after the projects table has been updated to use owner_id

-- Drop old policies that referenced created_by (which was CASCADE deleted)
DROP POLICY IF EXISTS "Project owners and club members can insert tracks" ON project_tracks;
DROP POLICY IF EXISTS "Project owners and club members can update tracks" ON project_tracks;
DROP POLICY IF EXISTS "Project owners and club members can delete tracks" ON project_tracks;

DROP POLICY IF EXISTS "Project owners and club members can insert takes" ON project_takes;
DROP POLICY IF EXISTS "Project owners and club members can update takes" ON project_takes;
DROP POLICY IF EXISTS "Project owners and club members can delete takes" ON project_takes;

DROP POLICY IF EXISTS "Project owners and club members can insert comments" ON project_track_comments;

DROP POLICY IF EXISTS "Project owners and club members can insert mixer settings" ON project_mixer_settings;
DROP POLICY IF EXISTS "Project owners and club members can update mixer settings" ON project_mixer_settings;

-- Recreate policies using owner_id

-- PROJECT TRACKS POLICIES
CREATE POLICY "Project owners and club members can insert tracks"
  ON project_tracks FOR INSERT
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
      )
    )
  );

CREATE POLICY "Project owners and club members can update tracks"
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
      )
    )
  );

CREATE POLICY "Project owners and club members can delete tracks"
  ON project_tracks FOR DELETE
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
      )
    )
  );

-- PROJECT TAKES POLICIES
CREATE POLICY "Project owners and club members can insert takes"
  ON project_takes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_takes.track_id
      AND (
        p.owner_id = auth.uid()
        OR
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Project owners and club members can update takes"
  ON project_takes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_takes.track_id
      AND (
        p.owner_id = auth.uid()
        OR
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Project owners and club members can delete takes"
  ON project_takes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_takes.track_id
      AND (
        p.owner_id = auth.uid()
        OR
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- PROJECT TRACK COMMENTS POLICIES
CREATE POLICY "Project owners and club members can insert comments"
  ON project_track_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_track_comments.track_id
      AND (
        p.owner_id = auth.uid()
        OR
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- PROJECT MIXER SETTINGS POLICIES
CREATE POLICY "Project owners and club members can insert mixer settings"
  ON project_mixer_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_mixer_settings.track_id
      AND (
        p.owner_id = auth.uid()
        OR
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Project owners and club members can update mixer settings"
  ON project_mixer_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_mixer_settings.track_id
      AND (
        p.owner_id = auth.uid()
        OR
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );
