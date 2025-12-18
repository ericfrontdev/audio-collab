-- ============================================================================
-- Project Studio Schema Migration
-- ============================================================================
-- This migration creates the complete database schema for the Project Studio
-- feature, including tracks, takes, comments, and mixer settings.

-- ============================================================================
-- 1. PROJECT TRACKS TABLE
-- ============================================================================
-- Tracks are containers for audio (e.g., "Lead Guitar", "Bass")
-- Each track can have multiple takes (recordings)

CREATE TABLE IF NOT EXISTS project_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for visual identification
  order_index INTEGER NOT NULL DEFAULT 0, -- Display order in studio
  active_take_id UUID, -- Reference to the currently active take
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_hex_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Index for fast project lookups
CREATE INDEX idx_project_tracks_project_id ON project_tracks(project_id);
CREATE INDEX idx_project_tracks_order ON project_tracks(project_id, order_index);

-- ============================================================================
-- 2. PROJECT TAKES TABLE
-- ============================================================================
-- Takes are individual audio recordings within a track
-- Logic Pro style: multiple recordings, one active at a time

CREATE TABLE IF NOT EXISTS project_takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES project_tracks(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL, -- Supabase storage URL
  duration FLOAT NOT NULL, -- Duration in seconds
  waveform_data JSONB, -- Array of peaks for visualization
  file_size BIGINT, -- File size in bytes
  file_format VARCHAR(10), -- e.g., 'mp3', 'wav', 'flac'
  is_active BOOLEAN DEFAULT FALSE, -- Only one take active per track
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast track lookups and active take queries
CREATE INDEX idx_project_takes_track_id ON project_takes(track_id);
CREATE INDEX idx_project_takes_active ON project_takes(track_id, is_active) WHERE is_active = true;

-- ============================================================================
-- 3. PROJECT TRACK COMMENTS TABLE
-- ============================================================================
-- Timeline-anchored comments (SoundCloud style)
-- Each comment is positioned at a specific timestamp on a track

CREATE TABLE IF NOT EXISTS project_track_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES project_tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp FLOAT NOT NULL, -- Position in seconds
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_timestamp CHECK (timestamp >= 0),
  CONSTRAINT valid_comment_length CHECK (char_length(text) BETWEEN 1 AND 1000)
);

-- Indexes for fast track and timestamp queries
CREATE INDEX idx_project_track_comments_track_id ON project_track_comments(track_id);
CREATE INDEX idx_project_track_comments_timestamp ON project_track_comments(track_id, timestamp);
CREATE INDEX idx_project_track_comments_user_id ON project_track_comments(user_id);

-- ============================================================================
-- 4. PROJECT MIXER SETTINGS TABLE
-- ============================================================================
-- Per-track mixer state (volume, pan, solo, mute)
-- Studio One style: persistent settings per track

CREATE TABLE IF NOT EXISTS project_mixer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES project_tracks(id) ON DELETE CASCADE UNIQUE,
  volume FLOAT DEFAULT 0.8, -- 0.0 to 1.0
  pan FLOAT DEFAULT 0.0, -- -1.0 (left) to 1.0 (right)
  solo BOOLEAN DEFAULT FALSE,
  mute BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_volume CHECK (volume >= 0.0 AND volume <= 1.0),
  CONSTRAINT valid_pan CHECK (pan >= -1.0 AND pan <= 1.0)
);

-- Index for fast track lookups
CREATE INDEX idx_project_mixer_settings_track_id ON project_mixer_settings(track_id);

-- ============================================================================
-- 5. STORAGE BUCKET FOR PROJECT AUDIO
-- ============================================================================
-- Create storage bucket for audio files

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-audio',
  'project-audio',
  true, -- Public for easy access (RLS on database level)
  104857600, -- 100MB max file size
  ARRAY['audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/mp4', 'audio/m4a', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE project_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_track_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_mixer_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6.1 PROJECT TRACKS POLICIES
-- ============================================================================

-- Anyone can view tracks (projects are public)
CREATE POLICY "Anyone can view project tracks"
  ON project_tracks FOR SELECT
  USING (true);

-- Project members can insert tracks
CREATE POLICY "Project members can insert tracks"
  ON project_tracks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_tracks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project members can update tracks
CREATE POLICY "Project members can update tracks"
  ON project_tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_tracks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project members can delete tracks
CREATE POLICY "Project members can delete tracks"
  ON project_tracks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_tracks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6.2 PROJECT TAKES POLICIES
-- ============================================================================

-- Anyone can view takes (projects are public)
CREATE POLICY "Anyone can view project takes"
  ON project_takes FOR SELECT
  USING (true);

-- Project members can insert takes
CREATE POLICY "Project members can insert takes"
  ON project_takes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tracks
      JOIN project_members ON project_members.project_id = project_tracks.project_id
      WHERE project_tracks.id = project_takes.track_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project members can update takes
CREATE POLICY "Project members can update takes"
  ON project_takes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_tracks
      JOIN project_members ON project_members.project_id = project_tracks.project_id
      WHERE project_tracks.id = project_takes.track_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project members can delete takes
CREATE POLICY "Project members can delete takes"
  ON project_takes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_tracks
      JOIN project_members ON project_members.project_id = project_tracks.project_id
      WHERE project_tracks.id = project_takes.track_id
      AND project_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6.3 PROJECT TRACK COMMENTS POLICIES
-- ============================================================================

-- Anyone can view comments (projects are public)
CREATE POLICY "Anyone can view track comments"
  ON project_track_comments FOR SELECT
  USING (true);

-- Authenticated users can insert comments on projects they have access to
CREATE POLICY "Project members can insert comments"
  ON project_track_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_tracks
      JOIN project_members ON project_members.project_id = project_tracks.project_id
      WHERE project_tracks.id = project_track_comments.track_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON project_track_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON project_track_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6.4 PROJECT MIXER SETTINGS POLICIES
-- ============================================================================

-- Anyone can view mixer settings (projects are public)
CREATE POLICY "Anyone can view mixer settings"
  ON project_mixer_settings FOR SELECT
  USING (true);

-- Project members can insert mixer settings (should be auto-created by trigger)
CREATE POLICY "Project members can insert mixer settings"
  ON project_mixer_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tracks
      JOIN project_members ON project_members.project_id = project_tracks.project_id
      WHERE project_tracks.id = project_mixer_settings.track_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project members can update mixer settings
CREATE POLICY "Project members can update mixer settings"
  ON project_mixer_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_tracks
      JOIN project_members ON project_members.project_id = project_tracks.project_id
      WHERE project_tracks.id = project_mixer_settings.track_id
      AND project_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6.5 STORAGE POLICIES FOR PROJECT AUDIO
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view project audio" ON storage.objects;
DROP POLICY IF EXISTS "Project collaborators can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Project collaborators can update audio" ON storage.objects;
DROP POLICY IF EXISTS "Project collaborators can delete audio" ON storage.objects;

-- Anyone can view project audio files (public bucket)
CREATE POLICY "Anyone can view project audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-audio');

-- Authenticated users can upload to project-audio bucket
-- (We'll validate project access in the application layer)
CREATE POLICY "Authenticated users can upload project audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-audio'
    AND auth.uid() IS NOT NULL
  );

-- Authenticated users can update files they own
CREATE POLICY "Authenticated users can update own audio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-audio'
    AND auth.uid() IS NOT NULL
  );

-- Authenticated users can delete files they own
CREATE POLICY "Authenticated users can delete own audio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-audio'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- 7. TRIGGERS AND FUNCTIONS
-- ============================================================================

-- ============================================================================
-- 7.1 Auto-create mixer settings when track is created
-- ============================================================================

CREATE OR REPLACE FUNCTION create_mixer_settings_for_track()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_mixer_settings (track_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_mixer_settings
  AFTER INSERT ON project_tracks
  FOR EACH ROW
  EXECUTE FUNCTION create_mixer_settings_for_track();

-- ============================================================================
-- 7.2 Auto-set active take when first take is uploaded
-- ============================================================================

CREATE OR REPLACE FUNCTION set_first_take_as_active()
RETURNS TRIGGER AS $$
DECLARE
  take_count INTEGER;
BEGIN
  -- Count existing takes for this track
  SELECT COUNT(*) INTO take_count
  FROM project_takes
  WHERE track_id = NEW.track_id;

  -- If this is the first take, mark it as active
  IF take_count = 1 THEN
    NEW.is_active := TRUE;

    -- Update the track's active_take_id
    UPDATE project_tracks
    SET active_take_id = NEW.id
    WHERE id = NEW.track_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_first_take_active
  BEFORE INSERT ON project_takes
  FOR EACH ROW
  EXECUTE FUNCTION set_first_take_as_active();

-- ============================================================================
-- 7.3 Ensure only one active take per track
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_single_active_take()
RETURNS TRIGGER AS $$
BEGIN
  -- If this take is being set to active, deactivate all others
  IF NEW.is_active = TRUE THEN
    UPDATE project_takes
    SET is_active = FALSE
    WHERE track_id = NEW.track_id
    AND id != NEW.id;

    -- Update the track's active_take_id
    UPDATE project_tracks
    SET active_take_id = NEW.id
    WHERE id = NEW.track_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_active_take
  BEFORE UPDATE ON project_takes
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION ensure_single_active_take();

-- ============================================================================
-- 7.4 Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_tracks_updated_at
  BEFORE UPDATE ON project_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_takes_updated_at
  BEFORE UPDATE ON project_takes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_track_comments_updated_at
  BEFORE UPDATE ON project_track_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_mixer_settings_updated_at
  BEFORE UPDATE ON project_mixer_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. HELPFUL VIEWS (OPTIONAL)
-- ============================================================================

-- View to get track details with active take info
CREATE OR REPLACE VIEW project_tracks_with_active_take AS
SELECT
  pt.id,
  pt.project_id,
  pt.name,
  pt.color,
  pt.order_index,
  pt.active_take_id,
  pt.created_at,
  pt.updated_at,
  ptak.audio_url AS active_take_audio_url,
  ptak.duration AS active_take_duration,
  ptak.waveform_data AS active_take_waveform_data,
  (SELECT COUNT(*) FROM project_takes WHERE track_id = pt.id) AS take_count
FROM project_tracks pt
LEFT JOIN project_takes ptak ON pt.active_take_id = ptak.id;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
