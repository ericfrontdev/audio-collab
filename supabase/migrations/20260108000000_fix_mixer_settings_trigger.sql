-- ============================================================================
-- Fix mixer settings trigger to include user_id
-- ============================================================================

-- Drop old trigger and function
DROP TRIGGER IF EXISTS trigger_create_mixer_settings ON project_tracks;
DROP FUNCTION IF EXISTS create_mixer_settings_for_track();

-- Recreate function with user_id
CREATE OR REPLACE FUNCTION create_mixer_settings_for_track()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_mixer_settings (track_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER trigger_create_mixer_settings
  AFTER INSERT ON project_tracks
  FOR EACH ROW
  EXECUTE FUNCTION create_mixer_settings_for_track();
