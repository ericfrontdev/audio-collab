-- Fix project_members RLS policy to allow project creator to add themselves

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;

-- Create new policy that allows:
-- 1. Existing project owners to add members
-- 2. Project creators to add themselves as owner
CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    -- Either the user is already an owner of this project
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
    OR
    -- Or the user is the owner of the project (from projects table) and adding themselves
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
      AND p.owner_id = auth.uid()
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'owner'
    )
  );

-- Also update the trigger function to use SECURITY DEFINER as a backup
-- This ensures the trigger can always add the owner even if RLS policies change
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
