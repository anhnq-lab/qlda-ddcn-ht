-- Migration: Create documents bucket for legal documents upload
-- Date: 2026-05-15

-- Insert the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for the bucket
-- Allow public read access
CREATE POLICY "Allow public read access for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated to update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated to delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
