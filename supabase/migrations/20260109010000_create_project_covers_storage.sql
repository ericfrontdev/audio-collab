-- Create storage bucket for project cover images
-- Max 5MB per image, supports common image formats

-- Create bucket for project cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-covers',
  'project-covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS POLICIES FOR PROJECT COVERS
-- ============================================================================

-- Anyone can view project covers (public bucket)
CREATE POLICY "Anyone can view project covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-covers');

-- Project members can upload covers
CREATE POLICY "Project members can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-covers'
    AND auth.uid() IS NOT NULL
  );

-- Project members can update their covers
CREATE POLICY "Project members can update covers"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-covers' AND auth.uid() IS NOT NULL);

-- Project members can delete their covers
CREATE POLICY "Project members can delete covers"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-covers' AND auth.uid() IS NOT NULL);
