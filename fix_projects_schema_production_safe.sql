-- =====================================================
-- FIX PROJECTS SCHEMA FOR PRODUCTION (SAFE VERSION)
-- =====================================================
-- This version checks for column existence before modifying
-- Execute this SQL in your Supabase Dashboard SQL Editor
-- =====================================================

-- Add missing columns if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'club' CHECK (kind IN ('personal', 'club', 'challenge'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bpm INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'private' CHECK (mode IN ('private', 'public', 'remixable'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS challenge_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Migrate created_by to owner_id if created_by exists
DO $$
BEGIN
  -- Check if created_by column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name = 'created_by'
    AND table_schema = 'public'
  ) THEN
    -- Copy data from created_by to owner_id where owner_id is null
    UPDATE projects SET owner_id = created_by WHERE owner_id IS NULL;
    -- Drop created_by column
    ALTER TABLE projects DROP COLUMN created_by CASCADE;
  END IF;
END $$;

-- Make name nullable if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name = 'name'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE projects ALTER COLUMN name DROP NOT NULL;
  END IF;
END $$;

-- Make owner_id NOT NULL after data migration
DO $$
BEGIN
  -- First set owner_id from created_by for any null values
  UPDATE projects
  SET owner_id = (
    SELECT created_by
    FROM (SELECT id, created_by FROM projects) p
    WHERE p.id = projects.id
  )
  WHERE owner_id IS NULL
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name = 'created_by'
    AND table_schema = 'public'
  );

  -- Now make it NOT NULL if the column exists and has no nulls
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name = 'owner_id'
    AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM projects WHERE owner_id IS NULL
  ) THEN
    ALTER TABLE projects ALTER COLUMN owner_id SET NOT NULL;
  END IF;
END $$;

-- Update indexes
DROP INDEX IF EXISTS idx_projects_created_by;
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

-- Create or replace trigger function to add project creator as owner
CREATE OR REPLACE FUNCTION add_project_creator_as_owner()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert creator as owner in project_members
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_add_project_creator_as_owner ON projects;

CREATE TRIGGER trigger_add_project_creator_as_owner
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_creator_as_owner();

-- =====================================================
-- VERIFICATION - Run this to check the schema
-- =====================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'projects'
-- ORDER BY ordinal_position;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
