-- Persiste l'état d'expansion du folder de retakes
ALTER TABLE project_tracks
ADD COLUMN IF NOT EXISTS is_retake_folder_open BOOLEAN DEFAULT FALSE;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_tracks_folder_open
  ON project_tracks(is_retake_folder_open);
