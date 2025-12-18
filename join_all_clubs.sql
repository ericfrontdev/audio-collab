-- Script to join all clubs
-- Run this in your Supabase Studio SQL Editor or via psql

-- This will add the first user to all clubs
INSERT INTO club_members (club_id, user_id, joined_at)
SELECT
  c.id as club_id,
  (SELECT id FROM auth.users LIMIT 1) as user_id,
  NOW() as joined_at
FROM clubs c
WHERE NOT EXISTS (
  SELECT 1 FROM club_members cm
  WHERE cm.club_id = c.id
  AND cm.user_id = (SELECT id FROM auth.users LIMIT 1)
);

-- Check the results
SELECT
  c.name,
  u.email
FROM club_members cm
JOIN clubs c ON c.id = cm.club_id
JOIN auth.users u ON u.id = cm.user_id;
