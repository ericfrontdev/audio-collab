-- Add RLS policies for banner uploads in profiles bucket

CREATE POLICY "Users can upload their own banner"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'banners'
  AND storage.filename(name) LIKE auth.uid()::text || '-banner-%'
);

CREATE POLICY "Users can update their own banner"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'banners'
  AND storage.filename(name) LIKE auth.uid()::text || '-banner-%'
);

CREATE POLICY "Users can delete their own banner"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'banners'
  AND storage.filename(name) LIKE auth.uid()::text || '-banner-%'
);
