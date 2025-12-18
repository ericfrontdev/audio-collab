-- Create clubs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('clubs', 'clubs', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload club images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view club images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update club images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete club images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload club images" ON storage.objects;

-- Allow anyone (including anonymous) to upload club images
CREATE POLICY "Anyone can upload club images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clubs');

-- Allow public to view club images
CREATE POLICY "Public can view club images"
ON storage.objects FOR SELECT
USING (bucket_id = 'clubs');

-- Allow anyone to update club images
CREATE POLICY "Authenticated users can update club images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clubs');

-- Allow anyone to delete club images
CREATE POLICY "Authenticated users can delete club images"
ON storage.objects FOR DELETE
USING (bucket_id = 'clubs');
