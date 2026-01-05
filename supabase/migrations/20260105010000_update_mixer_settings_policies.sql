-- ============================================================================
-- Update mixer settings policies to enforce per-user permissions
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Project owners and club members can insert mixer settings" ON project_mixer_settings;
DROP POLICY IF EXISTS "Project owners and club members can update mixer settings" ON project_mixer_settings;

-- Users can insert their own mixer settings if they have access to the project
CREATE POLICY "Users can insert their own mixer settings"
  ON project_mixer_settings FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
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

-- Users can update only their own mixer settings
CREATE POLICY "Users can update their own mixer settings"
  ON project_mixer_settings FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
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

-- Users can delete their own mixer settings
CREATE POLICY "Users can delete their own mixer settings"
  ON project_mixer_settings FOR DELETE
  USING (user_id = auth.uid());
