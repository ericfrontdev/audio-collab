-- =====================================================
-- FIX PROJECTS SCHEMA FOR PRODUCTION
-- =====================================================
-- Execute this SQL in your Supabase Dashboard SQL Editor
-- This migration updates the projects table to support
-- the new schema with owner_id, kind, and title columns
-- =====================================================

-- Add missing columns if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'personal' CHECK (kind IN ('personal', 'club', 'challenge'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bpm INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'private' CHECK (mode IN ('private', 'public', 'remixable'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS challenge_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Rename created_by to owner_id if it exists (for old data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name = 'created_by'
    AND table_schema = 'public'
  ) THEN
    -- Copy data from created_by to owner_id if owner_id is null
    UPDATE projects SET owner_id = created_by WHERE owner_id IS NULL;
    -- Drop created_by column
    ALTER TABLE projects DROP COLUMN created_by CASCADE;
  END IF;
END $$;

-- Make name nullable in case it's being used by old code
ALTER TABLE projects ALTER COLUMN name DROP NOT NULL;

-- Make owner_id NOT NULL (after data migration)
ALTER TABLE projects ALTER COLUMN owner_id SET NOT NULL;

-- Update or create index
DROP INDEX IF EXISTS idx_projects_created_by;
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

-- Create trigger to automatically add project creator as owner in project_members
CREATE OR REPLACE FUNCTION add_project_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert creator as owner in project_members
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_add_project_creator_as_owner ON projects;

-- Create trigger
CREATE TRIGGER trigger_add_project_creator_as_owner
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_creator_as_owner();

-- =====================================================
-- END OF MIGRATION
-- =====================================================
