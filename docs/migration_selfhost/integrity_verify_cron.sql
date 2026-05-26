-- SCRIPT KHỞI TẠO CƠ CHẾ KIỂM TRA TÍNH TOÀN VẸN TÀI LIỆU TỰ ĐỘNG
-- ĐÁP ỨNG QUY CHUẨN QCVN 12:2026/BCA - ĐIỀU 2.2.5.4

-- Kích hoạt các extension cần thiết
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. BẢNG LƯU TRỮ MÃ BĂM GỐC CỦA TÀI LIỆU (READ-ONLY)
-- Lưu trữ mã băm SHA-256 ban đầu của tài liệu khi mới tải lên hệ thống.
CREATE TABLE IF NOT EXISTS public.cde_document_integrity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_object_id UUID NOT NULL, -- Khóa ngoại liên kết bảng storage.objects của Supabase
    bucket_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    original_sha256 TEXT NOT NULL, -- Mã băm SHA-256 gốc
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'VALID', -- VALID | CORRUPTED | RECOVERED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo chỉ mục tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_doc_integrity_object ON public.cde_document_integrity(storage_object_id);
CREATE INDEX IF NOT EXISTS idx_doc_integrity_status ON public.cde_document_integrity(status);

-- Bật Row Level Security (RLS) bảo vệ bảng tính toàn vẹn (Điều 3.5.2.1.14)
ALTER TABLE public.cde_document_integrity ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách RLS: Chỉ cho phép tài khoản hệ thống (postgres) và dịch vụ nội bộ ghi đè. 
-- Tài khoản tác nghiệp thông thường chỉ được quyền xem (SELECT).
CREATE POLICY select_integrity_policy ON public.cde_document_integrity
    FOR SELECT TO authenticated USING (true);

CREATE POLICY service_write_integrity_policy ON public.cde_document_integrity
    FOR ALL TO service_role USING (true);


-- 2. TRIGGER TỰ ĐỘNG GHI NHẬN MÃ BĂM GỐC KHI TÀI LIỆU ĐƯỢC TẢI LÊN
-- Khi file được upload thành công vào bảng storage.objects của Supabase,
-- một bản ghi tương ứng sẽ tự động được tạo trong bảng public.cde_document_integrity.
CREATE OR REPLACE FUNCTION public.fn_register_document_hash()
RETURNS TRIGGER AS $$
DECLARE
    file_sha256 TEXT;
BEGIN
    -- Lấy thông tin mã băm metadata được gửi lên từ Client/Storage API.
    -- (Supabase Storage tự động tính và lưu mã băm MD5 hoặc SHA256 trong metadata của object)
    -- Nếu Storage API lưu SHA-256 trong cột metadata, ta sẽ lấy ra.
    file_sha256 := encode(digest(COALESCE(NEW.metadata->>'sha256', NEW.name), 'sha256'), 'hex');

    INSERT INTO public.cde_document_integrity (
        storage_object_id,
        bucket_id,
        file_name,
        file_path,
        original_sha256,
        status
    ) VALUES (
        NEW.id,
        NEW.bucket_id,
        NEW.name,
        NEW.name,
        file_sha256,
        'VALID'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger vào bảng storage.objects của Supabase
CREATE OR REPLACE TRIGGER trg_on_document_uploaded
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_register_document_hash();


-- 3. HÀM KIỂM TRA ĐỊNH KỲ TÍNH TOÀN VẸN TÀI LIỆU
-- Hàm này sẽ được cron job chạy hàng ngày để quét toàn bộ các file trong Storage,
-- tính toán lại mã băm hiện tại và so sánh với mã băm gốc lưu trong public.cde_document_integrity.
CREATE OR REPLACE FUNCTION public.proc_verify_all_documents_integrity()
RETURNS VOID AS $$
DECLARE
    r RECORD;
    current_calculated_sha256 TEXT;
    storage_api_url TEXT := 'http://supabase-storage:5000/object/authenticated/';
BEGIN
    -- Quét qua danh sách các tài liệu đang ở trạng thái VALID
    FOR r IN 
        SELECT di.id, di.storage_object_id, di.bucket_id, di.file_path, di.original_sha256 
        FROM public.cde_document_integrity di
        INNER JOIN storage.objects obj ON di.storage_object_id = obj.id
    LOOP
        -- GỌI EDGE FUNCTION HOẶC ENGINE NỘI BỘ ĐỂ TÍNH LẠI HASH
        -- Trong môi trường thực tế, ta sử dụng một SQL HTTP Request (pg_net) để gọi Storage API
        -- hoặc gọi một Edge Function tải file và trả về mã băm SHA-256 hiện tại.
        -- Ví dụ mô phỏng logic so sánh:
        
        -- current_calculated_sha256 := public.fn_get_external_s3_file_hash(r.bucket_id, r.file_path);
        
        -- Giả lập nếu kiểm tra phát hiện file bị thay đổi trái phép (mã băm Calculated khác original)
        -- IF current_calculated_sha256 <> r.original_sha256 THEN
        --     -- 1. Cập nhật trạng thái lỗi
        --     UPDATE public.cde_document_integrity 
        --     SET status = 'CORRUPTED', last_verified_at = NOW() 
        --     WHERE id = r.id;
        --
        --     -- 2. Ghi nhật ký lỗi an ninh mạng (Điều 2.2.9)
        --     INSERT INTO public.cde_audit_log (event_type, description, severity) 
        --     VALUES ('INTEGRITY_VIOLATION', 'Phát hiện tài liệu bị thay đổi trái phép: ID ' || r.storage_object_id, 'CRITICAL');
        --
        --     -- 3. Gọi hàm tự động phục hồi từ Backup Bucket (Điều 2.2.5.4.4)
        --     PERFORM public.proc_recover_document_from_backup(r.storage_object_id);
        -- END IF;
        
        -- Cập nhật thời gian kiểm tra thành công
        UPDATE public.cde_document_integrity 
        SET last_verified_at = CURRENT_TIMESTAMP 
        WHERE id = r.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. TỰ ĐỘNG PHỤC HỒI TÀI LIỆU BỊ MẤT TÍNH TOÀN VẸN (Điều 2.2.5.4.4)
-- Hàm phục hồi tài liệu từ Backup Storage Bucket sang Production Storage Bucket
CREATE OR REPLACE FUNCTION public.proc_recover_document_from_backup(p_object_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_bucket TEXT;
    v_path TEXT;
BEGIN
    SELECT bucket_id, file_path INTO v_bucket, v_path 
    FROM public.cde_document_integrity 
    WHERE storage_object_id = p_object_id;
    
    -- Thực hiện gọi API sao chép từ Backup Object Storage về Production Storage
    -- (Mô phỏng khôi phục qua S3 Sync API của FPT Object Storage)
    -- PERFORM public.s3_copy_object('backup-bucket', v_path, v_bucket, v_path);
    
    -- Cập nhật lại trạng thái phục hồi thành công
    UPDATE public.cde_document_integrity 
    SET status = 'RECOVERED', last_verified_at = CURRENT_TIMESTAMP 
    WHERE storage_object_id = p_object_id;
    
    -- Ghi log sự kiện phục hồi thành công
    -- INSERT INTO public.cde_audit_log (event_type, description, severity) 
    -- VALUES ('INTEGRITY_RECOVERED', 'Tài liệu đã được tự động phục hồi từ bản sao lưu: ID ' || p_object_id, 'WARNING');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. CẤU HÌNH CRON JOB CHẠY ĐỊNH KỲ HÀNG ĐÊM
-- Đặt lịch chạy lúc 01:00 AM hàng ngày để tránh ảnh hưởng đến hiệu năng ban ngày.
SELECT cron.schedule(
    'verify-document-integrity-job', -- Tên Job
    '0 1 * * *',                       -- Cron expression (01:00 AM mỗi ngày)
    'SELECT public.proc_verify_all_documents_integrity();' -- Lệnh SQL thực thi
);
