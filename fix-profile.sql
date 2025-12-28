-- Script pour créer le profil manquant après un db reset
-- Remplace 'YOUR_USERNAME' par le username que tu veux

INSERT INTO profiles (id, username, display_name, bio, is_public, created_at, updated_at)
SELECT
  id,
  'YOUR_USERNAME', -- Change ceci par ton username désiré
  'YOUR_USERNAME', -- Change ceci aussi
  '',
  true,
  now(),
  now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
