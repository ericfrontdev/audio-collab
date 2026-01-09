-- Add studio_visibility field to projects table
-- This field controls who can access the project studio (separate from 'mode' field)

-- Add studio_visibility field
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS studio_visibility TEXT
DEFAULT 'members_only'
CHECK (studio_visibility IN ('members_only', 'public'));

-- Set existing projects to members_only (safe default)
UPDATE projects SET studio_visibility = 'members_only' WHERE studio_visibility IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_studio_visibility ON projects(studio_visibility);
