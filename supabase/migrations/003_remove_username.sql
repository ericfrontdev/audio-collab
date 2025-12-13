-- Remove username column from profiles table as we only need email and display_name
-- Make display_name NOT NULL with a default value from email

-- First, set display_name for any existing profiles that don't have one
UPDATE profiles
SET display_name = COALESCE(display_name, SPLIT_PART(email, '@', 1))
WHERE display_name IS NULL OR display_name = '';

-- Now make display_name NOT NULL
ALTER TABLE profiles
ALTER COLUMN display_name SET NOT NULL;

-- Drop the username column
ALTER TABLE profiles
DROP COLUMN IF EXISTS username;

-- Update the trigger to set display_name from email if not provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN profiles.display_name IS 'User display name, defaults to email prefix if not provided';
