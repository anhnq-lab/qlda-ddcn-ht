-- Create document_attachments table
CREATE TABLE IF NOT EXISTS public.document_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  related_type text NOT NULL,
  related_id text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  description text NULL DEFAULT '',
  uploaded_by text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT document_attachments_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.document_attachments ENABLE ROW LEVEL SECURITY;

-- Read policy: anyone authenticated can read
CREATE POLICY "Cho phép user đã đăng nhập xem tài liệu"
ON public.document_attachments FOR SELECT
TO authenticated
USING (true);

-- Insert policy: anyone authenticated can insert
CREATE POLICY "Cho phép user đã đăng nhập thêm tài liệu"
ON public.document_attachments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Delete policy: anyone authenticated can delete
CREATE POLICY "Cho phép user đã đăng nhập xóa tài liệu"
ON public.document_attachments FOR DELETE
TO authenticated
USING (true);

-- Create bucket "documents" in storage if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for storage bucket "documents"
-- Allow read access to public/authenticated users
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
