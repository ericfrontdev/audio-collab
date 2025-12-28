-- Seed file to create test users and data for local development
-- This runs automatically after db reset

-- Create test users (passwords are hashed with bcrypt)
-- User 1: test1@test.com / password123
-- User 2: test2@test.com / password123

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  email_change_confirm_status,
  phone_change,
  phone_change_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test1@test.com',
  '$2a$06$ab8rA2jabZKa53yK6MxcJ.thfcKD6h1qrsP6kXHwZGRgKZTKaZVyO', -- password123
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Test User 1"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '',
  0,
  '',
  '',
  '',
  false,
  false
), (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test2@test.com',
  '$2a$06$ab8rA2jabZKa53yK6MxcJ.thfcKD6h1qrsP6kXHwZGRgKZTKaZVyO', -- password123
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Test User 2"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '',
  0,
  '',
  '',
  '',
  false,
  false
);

-- Create identities for the test users
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"test1@test.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
), (
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '{"sub":"22222222-2222-2222-2222-222222222222","email":"test2@test.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- Create profiles for test users (or update if they exist)
INSERT INTO profiles (
  id,
  username,
  display_name,
  bio,
  is_public,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'testuser1',
  'Test User 1',
  'Test user for development',
  true,
  NOW(),
  NOW()
), (
  '22222222-2222-2222-2222-222222222222',
  'testuser2',
  'Test User 2',
  'Another test user for development',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();

-- Create a test post from user 1
INSERT INTO posts (
  id,
  user_id,
  content,
  created_at,
  updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'This is a test post for development! 🎵',
  NOW(),
  NOW()
);

-- Log the test credentials
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test users created successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User 1: test1@test.com / password123';
  RAISE NOTICE 'User 2: test2@test.com / password123';
  RAISE NOTICE '========================================';
END $$;
