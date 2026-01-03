-- Allow users to join projects themselves as collaborators
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can join projects as collaborators" ON project_members;
  CREATE POLICY "Users can join projects as collaborators"
ON project_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'collaborator'
);
EXCEPTION WHEN OTHERS THEN NULL; END $$;
