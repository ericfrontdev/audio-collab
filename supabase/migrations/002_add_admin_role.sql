-- Add role column to profiles table
ALTER TABLE profiles
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index on role for better performance
CREATE INDEX idx_profiles_role ON profiles(role);

-- Update RLS policies to allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view own profile or admins can view all"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile (not role)"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- Regular users cannot change their role
      role = (SELECT role FROM profiles WHERE id = auth.uid())
      OR
      -- Only admins can change roles
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- Admin policy to view all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (
    mode IN ('public', 'remixable')
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admin policy to view all stems
CREATE POLICY "Admins can view all stems"
  ON stems FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stems.project_id
      AND (
        projects.mode IN ('public', 'remixable')
        OR projects.owner_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Comments on the changes
COMMENT ON COLUMN profiles.role IS 'User role: user or admin';
