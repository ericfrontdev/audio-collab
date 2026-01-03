-- Create project_messages table for project chat
CREATE TABLE IF NOT EXISTS project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  reply_to uuid REFERENCES project_messages(id) ON DELETE SET NULL,
  is_edited boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_messages_project_id ON project_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_user_id ON project_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_created_at ON project_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_messages_reply_to ON project_messages(reply_to);

-- Enable RLS
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view messages in projects they're a member of
DO $$ BEGIN
  DROP POLICY IF EXISTS "Project members can view messages" ON project_messages;
  CREATE POLICY "Project members can view messages"
    ON project_messages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = project_messages.project_id
        AND project_members.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_messages.project_id
        AND projects.owner_id = auth.uid()
      )
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Project members can send messages
DO $$ BEGIN
  DROP POLICY IF EXISTS "Project members can send messages" ON project_messages;
  CREATE POLICY "Project members can send messages"
    ON project_messages FOR INSERT
    WITH CHECK (
      auth.uid() = user_id
      AND (
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = project_messages.project_id
          AND project_members.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM projects
          WHERE projects.id = project_messages.project_id
          AND projects.owner_id = auth.uid()
        )
      )
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Users can update their own messages
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can update their own messages" ON project_messages;
  CREATE POLICY "Users can update their own messages"
  ON project_messages FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Users can delete their own messages
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can delete their own messages" ON project_messages;
  CREATE POLICY "Users can delete their own messages"
  ON project_messages FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_project_messages_updated_at ON project_messages;
CREATE TRIGGER update_project_messages_updated_at
  BEFORE UPDATE ON project_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
