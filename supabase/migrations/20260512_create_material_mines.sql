-- Create enum for mine types
CREATE TYPE mine_type_enum AS ENUM ('Đất', 'Đá', 'Cát', 'Sỏi', 'Khác');

-- Create enum for mine status
CREATE TYPE mine_status_enum AS ENUM ('Đang khai thác', 'Quy hoạch', 'Đóng cửa');

CREATE TABLE IF NOT EXISTS public.material_mines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    mine_type mine_type_enum NOT NULL DEFAULT 'Khác',
    status mine_status_enum NOT NULL DEFAULT 'Quy hoạch',
    capacity VARCHAR(100), -- Trữ lượng (có thể là chuỗi vì có cả đơn vị m3, triệu m3)
    address TEXT,
    coordinates JSONB, -- { "lat": ..., "lng": ... }
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.material_mines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả người dùng xem mỏ vật liệu"
    ON public.material_mines
    FOR SELECT
    USING (true);

-- Cho phép Admin và Quản lý sửa đổi
CREATE POLICY "Cho phép nhân viên nội bộ thêm sửa xóa mỏ vật liệu"
    ON public.material_mines
    FOR ALL
    USING (
        auth.role() = 'authenticated'
    )
    WITH CHECK (
        auth.role() = 'authenticated'
    );
