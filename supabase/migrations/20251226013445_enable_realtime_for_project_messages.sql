-- Ensure Realtime is properly configured for project_messages

-- Drop and recreate the publication to ensure proper configuration
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- Add the table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE project_messages;

-- Ensure other tables are also in the publication (if they were before)
ALTER PUBLICATION supabase_realtime ADD TABLE project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE clubs;
ALTER PUBLICATION supabase_realtime ADD TABLE club_members;

-- Ensure REPLICA IDENTITY is FULL (should already be set, but confirming)
ALTER TABLE project_messages REPLICA IDENTITY FULL;
