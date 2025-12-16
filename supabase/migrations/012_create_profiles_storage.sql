-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profiles bucket

-- 1. Anyone can view public files
CREATE POLICY "Public profile files are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- 2. Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'avatars'
  AND storage.filename(name) LIKE auth.uid()::text || '-%'
);

-- 3. Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'avatars'
  AND storage.filename(name) LIKE auth.uid()::text || '-%'
);

-- 4. Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'avatars'
  AND storage.filename(name) LIKE auth.uid()::text || '-%'
);
