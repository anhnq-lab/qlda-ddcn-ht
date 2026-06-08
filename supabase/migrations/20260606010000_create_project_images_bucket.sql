-- Migration: Create project-images bucket for project cover photos
-- Date: 2026-06-06

-- Insert the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for the bucket
-- Allow public read access
CREATE POLICY "Allow public read access for project-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated to upload project-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated to update project-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated to delete project-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-images');
