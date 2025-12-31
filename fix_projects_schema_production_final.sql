-- =====================================================
-- FIX PROJECTS SCHEMA FOR PRODUCTION (FINAL SAFE VERSION)
-- =====================================================
-- Uses dynamic SQL to avoid parse errors on missing columns
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

-- Migrate created_by to owner_id using dynamic SQL (to avoid parse errors)
DO $$
DECLARE
  created_by_exists BOOLEAN;
BEGIN
  -- Check if created_by column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name = 'created_by'
    AND table_schema = 'public'
  ) INTO created_by_exists;

  -- Only migrate if created_by exists
  IF created_by_exists THEN
    -- Use dynamic SQL to avoid parse errors
    EXECUTE 'UPDATE projects SET owner_id = created_by WHERE owner_id IS NULL';
    -- Drop created_by column
    EXECUTE 'ALTER TABLE projects DROP COLUMN created_by CASCADE';
  END IF;
END $$;

-- Make name nullable if it exists and is NOT NULL
DO $$
DECLARE
  name_not_null BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name = 'name'
    AND is_nullable = 'NO'
    AND table_schema = 'public'
  ) INTO name_not_null;

  IF name_not_null THEN
    ALTER TABLE projects ALTER COLUMN name DROP NOT NULL;
  END IF;
END $$;

-- Make owner_id NOT NULL if all records have a value
DO $$
DECLARE
  has_null_owner_id BOOLEAN;
  owner_id_exists BOOLEAN;
BEGIN
  -- Check if owner_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name = 'owner_id'
    AND table_schema = 'public'
  ) INTO owner_id_exists;

  IF owner_id_exists THEN
    -- Check if there are any NULL values
    SELECT EXISTS (
      SELECT 1 FROM projects WHERE owner_id IS NULL LIMIT 1
    ) INTO has_null_owner_id;

    -- Only make NOT NULL if no nulls exist
    IF NOT has_null_owner_id THEN
      ALTER TABLE projects ALTER COLUMN owner_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Update indexes
DROP INDEX IF EXISTS idx_projects_created_by;
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_kind ON projects(kind);
CREATE INDEX IF NOT EXISTS idx_projects_club_id ON projects(club_id);

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
-- VERIFICATION - Uncomment and run to check the schema
-- =====================================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'projects'
-- AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
