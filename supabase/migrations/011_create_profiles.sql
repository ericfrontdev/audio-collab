-- Create profiles table
-- This table stores user profile information for AudioCollab

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  -- Primary key (references auth.users)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,

  -- Music Identity (arrays - multiple selection allowed)
  -- Format: ['producer', 'engineer'] or ['hip-hop', 'Other: Custom Genre']
  musical_roles TEXT[] DEFAULT '{}',
  genres TEXT[] DEFAULT '{}',

  -- Social Links (separate fields)
  soundcloud_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  website_url TEXT,

  -- Privacy (simple - just public/private toggle)
  is_public BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Profiles are viewable by everyone if public, or by the owner if private
CREATE POLICY "Profiles are viewable by everyone if public, or by owner"
  ON profiles FOR SELECT
  USING (is_public = true OR (SELECT auth.uid()) = id);

-- 2. Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- 4. Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING ((SELECT auth.uid()) = id);

-- Indexes for performance

-- Username lookup (for profile pages like /profile/username)
CREATE INDEX idx_profiles_username ON profiles(username);

-- GIN indexes for array columns (for searching by role or genre)
CREATE INDEX idx_profiles_musical_roles ON profiles USING GIN(musical_roles);
CREATE INDEX idx_profiles_genres ON profiles USING GIN(genres);

-- Index on is_public for filtering public profiles
CREATE INDEX idx_profiles_is_public ON profiles(is_public) WHERE is_public = true;

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE profiles IS 'User profiles for AudioCollab. Stores musical identity, social links, and privacy settings.';
COMMENT ON COLUMN profiles.musical_roles IS 'Array of musical roles. Can include predefined roles or custom "Other: xyz" entries.';
COMMENT ON COLUMN profiles.genres IS 'Array of musical genres. Can include predefined genres or custom "Other: xyz" entries.';
