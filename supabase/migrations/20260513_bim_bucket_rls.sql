-- Allow authenticated users to view, upload, update, and delete objects in the bim-models bucket

CREATE POLICY "Allow authenticated to view bim-models"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'bim-models' );

CREATE POLICY "Allow authenticated to upload bim-models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'bim-models' );

CREATE POLICY "Allow authenticated to update bim-models"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'bim-models' );

CREATE POLICY "Allow authenticated to delete bim-models"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'bim-models' );

-- Allow public access to view since the bucket is public
CREATE POLICY "Allow public to view bim-models"
ON storage.objects FOR SELECT
USING ( bucket_id = 'bim-models' );
