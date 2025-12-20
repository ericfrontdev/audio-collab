-- Add uploaded_by field to project_takes to track who uploaded each audio file

ALTER TABLE project_takes
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_project_takes_uploaded_by ON project_takes(uploaded_by);

-- Update existing takes to set uploaded_by to project owner (best guess)
-- This is a one-time migration for existing data
UPDATE project_takes
SET uploaded_by = (
  SELECT p.owner_id
  FROM projects p
  JOIN project_tracks pt ON pt.project_id = p.id
  WHERE pt.id = project_takes.track_id
)
WHERE uploaded_by IS NULL;
