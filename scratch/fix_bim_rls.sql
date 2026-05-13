DROP POLICY IF EXISTS "Allow authenticated to view bim-models" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to upload bim-models" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to update bim-models" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to delete bim-models" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view bim-models" ON storage.objects;

CREATE POLICY "Allow authenticated to view bim-models" ON storage.objects FOR SELECT TO authenticated USING ( bucket_id = 'bim-models' );
CREATE POLICY "Allow authenticated to upload bim-models" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'bim-models' );
CREATE POLICY "Allow authenticated to update bim-models" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'bim-models' );
CREATE POLICY "Allow authenticated to delete bim-models" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'bim-models' );
CREATE POLICY "Allow public to view bim-models" ON storage.objects FOR SELECT USING ( bucket_id = 'bim-models' );
