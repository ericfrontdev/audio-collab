-- DEV ONLY: Add current user to all clubs
-- This is a development helper migration
-- Delete this file before deploying to production

DO $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the first user (assuming you're the only one in local dev)
  SELECT id INTO current_user_id FROM auth.users LIMIT 1;

  -- Only proceed if there's a user
  IF current_user_id IS NOT NULL THEN
    -- Add this user to all clubs
    INSERT INTO club_members (club_id, user_id, joined_at)
    SELECT
      c.id as club_id,
      current_user_id as user_id,
      NOW() as joined_at
    FROM clubs c
    WHERE NOT EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = c.id
      AND cm.user_id = current_user_id
    );

    RAISE NOTICE 'Added user % to all clubs', current_user_id;
  ELSE
    RAISE NOTICE 'No users found - skipping auto-join';
  END IF;
END $$;
