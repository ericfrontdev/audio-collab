#!/bin/bash
# Script to join all clubs for development

echo "Joining all clubs for the current user..."

psql postgresql://postgres:postgres@127.0.0.1:54322/postgres << 'EOF'
DO $$
DECLARE
  current_user_id uuid;
  clubs_joined integer;
BEGIN
  -- Get the most recent user (you)
  SELECT id INTO current_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found! Please sign up/login first.';
  END IF;

  -- Add user to all clubs
  WITH inserted AS (
    INSERT INTO club_members (club_id, user_id, joined_at)
    SELECT c.id, current_user_id, NOW()
    FROM clubs c
    WHERE NOT EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = c.id AND cm.user_id = current_user_id
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO clubs_joined FROM inserted;

  RAISE NOTICE 'User % joined % clubs', current_user_id, clubs_joined;
END $$;

-- Show result
SELECT
  u.email,
  COUNT(cm.id) as clubs_joined
FROM auth.users u
LEFT JOIN club_members cm ON u.id = cm.user_id
GROUP BY u.id, u.email;
EOF

echo "Done!"
