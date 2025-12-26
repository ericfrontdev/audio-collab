-- Drop the old foreign key to auth.users
ALTER TABLE project_messages
DROP CONSTRAINT IF EXISTS project_messages_user_id_fkey;

-- Add new foreign key to profiles instead
ALTER TABLE project_messages
ADD CONSTRAINT project_messages_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
