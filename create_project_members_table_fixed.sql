-- =====================================================
-- CREATE PROJECT_MEMBERS TABLE FOR PRODUCTION
-- =====================================================
-- Execute this SQL in your Supabase Dashboard SQL Editor
-- =====================================================

-- Create project_members table (collaborators on a project)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_members
-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Anyone can view project members" ON project_members;
CREATE POLICY "Anyone can view project members"
  ON project_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Project owners can add members" ON project_members;
CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
    OR
    -- Allow the trigger to add the creator as owner
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
      AND p.owner_id = auth.uid()
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Project owners can remove members" ON project_members;
CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );

-- =====================================================
-- END OF MIGRATION
-- =====================================================
