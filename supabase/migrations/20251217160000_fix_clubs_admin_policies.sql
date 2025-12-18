-- Drop the old restrictive policies
DROP POLICY IF EXISTS "Only admins can create clubs" ON clubs;
DROP POLICY IF EXISTS "Only admins can update clubs" ON clubs;
DROP POLICY IF EXISTS "Only admins can delete clubs" ON clubs;

-- Create new policies that actually check if user is admin
CREATE POLICY "Admins can create clubs"
  ON clubs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update clubs"
  ON clubs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete clubs"
  ON clubs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
