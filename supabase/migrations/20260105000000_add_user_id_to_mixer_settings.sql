-- ============================================================================
-- Add user_id to project_mixer_settings for per-user preferences
-- ============================================================================

-- Add user_id column
ALTER TABLE project_mixer_settings
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to set user_id to track creator
-- (This is a best-effort migration - in practice, we can set to NULL and let users re-save)
UPDATE project_mixer_settings pms
SET user_id = pt.created_by
FROM project_tracks pt
WHERE pms.track_id = pt.id
AND pms.user_id IS NULL;

-- Make user_id NOT NULL now that we've populated it
ALTER TABLE project_mixer_settings
ALTER COLUMN user_id SET NOT NULL;

-- Drop the old unique constraint on track_id only
ALTER TABLE project_mixer_settings
DROP CONSTRAINT IF EXISTS project_mixer_settings_track_id_key;

-- Add new composite unique constraint on (track_id, user_id)
ALTER TABLE project_mixer_settings
ADD CONSTRAINT project_mixer_settings_track_id_user_id_key
UNIQUE (track_id, user_id);

-- Create index for fast lookups by user
CREATE INDEX idx_project_mixer_settings_user_id ON project_mixer_settings(user_id);

-- Update the existing index to be a composite index
DROP INDEX IF EXISTS idx_project_mixer_settings_track_id;
CREATE INDEX idx_project_mixer_settings_track_user
ON project_mixer_settings(track_id, user_id);
