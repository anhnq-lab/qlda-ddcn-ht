import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
-- Create enum for mine types
DO $$ BEGIN
    CREATE TYPE mine_type_enum AS ENUM ('Đất', 'Đá', 'Cát', 'Sỏi', 'Khác');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for mine status
DO $$ BEGIN
    CREATE TYPE mine_status_enum AS ENUM ('Đang khai thác', 'Quy hoạch', 'Đóng cửa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.material_mines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    mine_type mine_type_enum NOT NULL DEFAULT 'Khác',
    status mine_status_enum NOT NULL DEFAULT 'Quy hoạch',
    capacity VARCHAR(100),
    address TEXT,
    coordinates JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.material_mines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép tất cả người dùng xem mỏ vật liệu" ON public.material_mines;
CREATE POLICY "Cho phép tất cả người dùng xem mỏ vật liệu" ON public.material_mines FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cho phép nhân viên nội bộ thêm sửa xóa mỏ vật liệu" ON public.material_mines;
CREATE POLICY "Cho phép nhân viên nội bộ thêm sửa xóa mỏ vật liệu" ON public.material_mines FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
`;

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

run();
