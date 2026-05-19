-- Migration: Thêm cột link chứng chỉ năng lực cho nhà thầu
-- Mục đích: Lưu trữ đường dẫn gốc tới trang tra cứu chứng chỉ năng lực (vd: nangluchdxd.gov.vn)

BEGIN;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contractors' AND column_name='cap_cert_link') THEN
        ALTER TABLE public.contractors ADD COLUMN cap_cert_link text;
    END IF;
END $$;

COMMIT;
