-- =====================================================
-- FIX RELATIONSHIP BETWEEN PROJECT_MESSAGES AND PROFILES
-- =====================================================
-- Execute this SQL in your Supabase Dashboard SQL Editor
-- =====================================================

-- First, ensure profiles table exists and has the correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for profiles if they don't exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Now add the foreign key from project_messages to profiles if it doesn't exist
-- First check if the constraint already exists, if not add it
DO $$
BEGIN
  -- Drop the existing foreign key to auth.users if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'project_messages_user_id_fkey'
    AND table_name = 'project_messages'
  ) THEN
    ALTER TABLE project_messages DROP CONSTRAINT project_messages_user_id_fkey;
  END IF;

  -- Add foreign key to profiles table instead
  ALTER TABLE project_messages
    ADD CONSTRAINT project_messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_project_messages_user_id_profiles ON project_messages(user_id);

-- =====================================================
-- END OF MIGRATION
-- =====================================================
