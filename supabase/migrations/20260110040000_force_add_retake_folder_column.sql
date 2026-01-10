-- Force add is_retake_folder_open column if it doesn't exist
-- This migration ensures the column is actually created in the database

DO $$
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'project_tracks'
        AND column_name = 'is_retake_folder_open'
    ) THEN
        ALTER TABLE project_tracks
        ADD COLUMN is_retake_folder_open BOOLEAN DEFAULT FALSE;

        RAISE NOTICE 'Column is_retake_folder_open added to project_tracks';
    ELSE
        RAISE NOTICE 'Column is_retake_folder_open already exists in project_tracks';
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_tracks_folder_open
  ON project_tracks(is_retake_folder_open);
