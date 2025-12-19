-- ============================================================================
-- Fix Studio RLS Policies Migration
-- ============================================================================
-- This migration fixes the RLS policies for project studio tables
-- to check owner_id and club_members instead of non-existent project_members table

-- ============================================================================
-- 1. DROP OLD PROJECT TRACKS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Project members can insert tracks" ON project_tracks;
DROP POLICY IF EXISTS "Project members can update tracks" ON project_tracks;
DROP POLICY IF EXISTS "Project members can delete tracks" ON project_tracks;

-- ============================================================================
-- 2. CREATE NEW PROJECT TRACKS POLICIES
-- ============================================================================

-- Project owners and club members can insert tracks
CREATE POLICY "Project owners and club members can insert tracks"
  ON project_tracks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_tracks.project_id
      AND (
        -- User is the project owner
        p.owner_id = auth.uid()
        OR
        -- User is a member of the project's club
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- Project owners and club members can update tracks
CREATE POLICY "Project owners and club members can update tracks"
  ON project_tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_tracks.project_id
      AND (
        -- User is the project owner
        p.owner_id = auth.uid()
        OR
        -- User is a member of the project's club
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- Project owners and club members can delete tracks
CREATE POLICY "Project owners and club members can delete tracks"
  ON project_tracks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_tracks.project_id
      AND (
        -- User is the project owner
        p.owner_id = auth.uid()
        OR
        -- User is a member of the project's club
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- ============================================================================
-- 3. DROP OLD PROJECT TAKES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Project members can insert takes" ON project_takes;
DROP POLICY IF EXISTS "Project members can update takes" ON project_takes;
DROP POLICY IF EXISTS "Project members can delete takes" ON project_takes;

-- ============================================================================
-- 4. CREATE NEW PROJECT TAKES POLICIES
-- ============================================================================

-- Project owners and club members can insert takes
CREATE POLICY "Project owners and club members can insert takes"
  ON project_takes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_takes.track_id
      AND (
        -- User is the project owner
        p.owner_id = auth.uid()
        OR
        -- User is a member of the project's club
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- Project owners and club members can update takes
CREATE POLICY "Project owners and club members can update takes"
  ON project_takes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_takes.track_id
      AND (
        -- User is the project owner
        p.owner_id = auth.uid()
        OR
        -- User is a member of the project's club
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- Project owners and club members can delete takes
CREATE POLICY "Project owners and club members can delete takes"
  ON project_takes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_takes.track_id
      AND (
        -- User is the project owner
        p.owner_id = auth.uid()
        OR
        -- User is a member of the project's club
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- ============================================================================
-- 5. DROP OLD PROJECT TRACK COMMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Project members can insert comments" ON project_track_comments;

-- ============================================================================
-- 6. CREATE NEW PROJECT TRACK COMMENTS POLICIES
-- ============================================================================

-- Project owners and club members can insert comments
CREATE POLICY "Project owners and club members can insert comments"
  ON project_track_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_track_comments.track_id
      AND (
        -- User is the project owner
        p.owner_id = auth.uid()
        OR
        -- User is a member of the project's club
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- ============================================================================
-- 7. DROP OLD PROJECT MIXER SETTINGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Project members can insert mixer settings" ON project_mixer_settings;
DROP POLICY IF EXISTS "Project members can update mixer settings" ON project_mixer_settings;

-- ============================================================================
-- 8. CREATE NEW PROJECT MIXER SETTINGS POLICIES
-- ============================================================================

-- Project owners and club members can insert mixer settings
CREATE POLICY "Project owners and club members can insert mixer settings"
  ON project_mixer_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_mixer_settings.track_id
      AND (
        -- User is the project owner
        p.owner_id = auth.uid()
        OR
        -- User is a member of the project's club
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- Project owners and club members can update mixer settings
CREATE POLICY "Project owners and club members can update mixer settings"
  ON project_mixer_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = project_mixer_settings.track_id
      AND (
        -- User is the project owner
        p.owner_id = auth.uid()
        OR
        -- User is a member of the project's club
        (p.club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = p.club_id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
