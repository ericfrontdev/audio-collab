-- Script to make a user admin
-- Replace 'your-email@example.com' with your actual email

UPDATE profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- Verify
SELECT u.email, p.is_admin
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = true;
