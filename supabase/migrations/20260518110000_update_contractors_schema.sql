-- Migration: Thêm các cột còn thiếu cho bảng contractors
-- Bổ sung type, email, website và xử lý ràng buộc unique cho tax_code

-- 1. Thêm cột contractor_type nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contractors' AND column_name='contractor_type') THEN
        ALTER TABLE public.contractors ADD COLUMN contractor_type text DEFAULT 'Construction'::text;
    END IF;
END $$;

-- 2. Thêm cột email nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contractors' AND column_name='email') THEN
        ALTER TABLE public.contractors ADD COLUMN email text;
    END IF;
END $$;

-- 3. Thêm cột website nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contractors' AND column_name='website') THEN
        ALTER TABLE public.contractors ADD COLUMN website text;
    END IF;
END $$;

-- 4. Thêm cột established_year nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contractors' AND column_name='established_year') THEN
        ALTER TABLE public.contractors ADD COLUMN established_year integer;
    END IF;
END $$;

-- 5. Đảm bảo tax_code unique nhưng cho phép nhiều giá trị NULL
-- Nếu đã có unique constraint trên tax_code mà không cho phép nhiều NULL (có thể là lỗi cũ),
-- PostgreSQL mặc định unique constraint coi các giá trị NULL là khác nhau (phân biệt), 
-- nhưng nếu trước đây frontend gửi chuỗi rỗng '' thì nó sẽ báo lỗi trùng chuỗi rỗng.
-- Việc đổi frontend gửi NULL là đã đủ để fix lỗi này.
-- Không cần thiết phải drop/recreate index nếu index cũ đã đúng chuẩn của postgresql.
