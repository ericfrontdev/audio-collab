-- Allow users to join projects themselves as collaborators
CREATE POLICY "Users can join projects as collaborators"
ON project_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'collaborator'
);
