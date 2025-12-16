-- Add banner_url column to profiles table
ALTER TABLE profiles
ADD COLUMN banner_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.banner_url IS 'URL to user profile banner/cover image';
