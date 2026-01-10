-- Refresh schema cache by making a trivial change to the table
-- This forces Supabase to reload the table schema

-- Add a comment to force schema reload
COMMENT ON COLUMN project_tracks.is_retake_folder_open IS 'Stores whether the retake folder is expanded for this track';

-- Verify column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'project_tracks'
        AND column_name = 'is_retake_folder_open'
    ) THEN
        RAISE NOTICE '✓ Column is_retake_folder_open exists and is ready to use';
    ELSE
        RAISE EXCEPTION '✗ Column is_retake_folder_open does not exist!';
    END IF;
END $$;
