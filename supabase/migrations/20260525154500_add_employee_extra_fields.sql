-- Migration: Add extra HR fields to employees table and update existing Technical Appraisal staff
-- Date: 2026-05-25

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS permanent_address TEXT,
  ADD COLUMN IF NOT EXISTS specialty TEXT,
  ADD COLUMN IF NOT EXISTS political_theory TEXT,
  ADD COLUMN IF NOT EXISTS tenure_info TEXT;

COMMENT ON COLUMN public.employees.date_of_birth IS 'Ngày sinh';
COMMENT ON COLUMN public.employees.permanent_address IS 'Nơi thường trú';
COMMENT ON COLUMN public.employees.specialty IS 'Trình độ chuyên môn';
COMMENT ON COLUMN public.employees.political_theory IS 'Lý luận chính trị';
COMMENT ON COLUMN public.employees.tenure_info IS 'Thời gian giữ chức vụ / Thời gian công tác';

-- Cập nhật dữ liệu cho 11 nhân sự hiện có
-- 1. Trần Đức Huy (NV031)
UPDATE public.employees SET
  date_of_birth = '1983-07-20',
  permanent_address = 'Khối phố 9 Bắc Hà, TP Hà Tĩnh, Tỉnh Hà Tĩnh',
  specialty = 'Kỹ sư Thủy lợi - Thủy điện',
  political_theory = 'Trung cấp',
  tenure_info = 'VC Ban DDCN tuyển'
WHERE employee_id = 'NV031';

-- 2. Hoàng Đức Giang (NV032)
UPDATE public.employees SET
  date_of_birth = '1979-02-22',
  permanent_address = 'Khối phố 2, Phường Thạch Quý, TP Hà Tĩnh, Tỉnh Hà Tĩnh',
  specialty = 'Kỹ sư xây dựng',
  political_theory = 'Trung cấp',
  tenure_info = 'VC Ban DDCN tuyển dụng 2023'
WHERE employee_id = 'NV032';

-- 3. Trịnh Thúc Hiếu (NV033)
UPDATE public.employees SET
  date_of_birth = '1986-03-19',
  permanent_address = 'Khối phố 3, phường Đại Nài, TP Hà Tĩnh, Tỉnh Hà Tĩnh',
  specialty = 'Thạc sỹ xây dựng công trình dân dụng và công nghiệp',
  political_theory = 'Không',
  tenure_info = 'VC Ban DDCN tuyển dụng 2023'
WHERE employee_id = 'NV033';

-- 4. Bùi Văn Minh (NV034)
UPDATE public.employees SET
  date_of_birth = '1983-02-03',
  permanent_address = 'Số 6 Ngách 1, ngõ 22, Đường Nguyễn Công Trứ, Phường Thạch Quý, TP Hà Tĩnh, Tỉnh Hà Tĩnh',
  specialty = 'Kỹ sư xây dựng Cầu Đường',
  political_theory = 'Không',
  tenure_info = 'VC Ban DDCN tuyển dụng 2023'
WHERE employee_id = 'NV034';

-- 5. Bùi Thị Hiền (NV036)
UPDATE public.employees SET
  date_of_birth = '1996-09-27',
  permanent_address = 'Thị trấn Cẩm Xuyên, Huyện Cẩm Xuyên, Tỉnh Hà Tĩnh',
  specialty = 'Kỹ sư kinh tế xây dựng',
  political_theory = 'Không',
  tenure_info = 'VC Ban DDCN tuyển dụng 2023'
WHERE employee_id = 'NV036';

-- 6. Biện Văn Đức (NV039)
UPDATE public.employees SET
  date_of_birth = '1991-08-20',
  permanent_address = 'Phường Thạch Quý, TP Hà Tĩnh, Tỉnh Hà Tĩnh',
  specialty = 'Kỹ sư Kỹ thuật tài nguyên nước',
  political_theory = 'Sơ cấp',
  tenure_info = '01/01/2026 - LĐHD Ban'
WHERE employee_id = 'NV039';

-- 7. Lê Tiến Hưng (NV038)
UPDATE public.employees SET
  date_of_birth = '1987-02-03',
  permanent_address = 'TDP2 Nguyễn Du, TP Hà Tĩnh, Tỉnh Hà Tĩnh',
  specialty = 'Kỹ sư xây dựng',
  political_theory = 'Trung cấp',
  tenure_info = 'Từ 9/2023 đến nay: Viên chức Ban'
WHERE employee_id = 'NV038';

-- 8. Hà Vũ Tuấn Dũng (NV030)
UPDATE public.employees SET
  date_of_birth = '1985-04-21',
  permanent_address = 'Số 07 đường Tân Bình, TP Hà Tĩnh, Tỉnh Hà Tĩnh',
  specialty = 'Thạc sỹ xây dựng công trình',
  political_theory = 'Trung cấp',
  tenure_info = 'VC Ban DDCN tuyển'
WHERE employee_id = 'NV030';

-- 9. Phan Lưu Khánh Linh (NV035)
UPDATE public.employees SET
  date_of_birth = '1995-04-10',
  permanent_address = 'Đường Hàm Nghi, TP Hà Tĩnh, Tỉnh Hà Tĩnh',
  specialty = 'Kỹ sư cấp thoát nước',
  political_theory = 'Trung cấp',
  tenure_info = 'VC Ban DDCN tuyển dụng 2023'
WHERE employee_id = 'NV035';

-- 10. Cao Xuân Quế (NV037)
UPDATE public.employees SET
  date_of_birth = '1982-08-25',
  permanent_address = 'Phường Tân Giang, TP Hà Tĩnh, Tỉnh Hà Tĩnh',
  specialty = 'Kỹ sư Thủy lợi - chính quy',
  political_theory = 'Không',
  tenure_info = 'Từ 31/01/2023 Viên chức Ban QLDA huyện Can Lộc'
WHERE employee_id = 'NV037';

-- 11. Nguyễn Trọng Hải (NV098)
UPDATE public.employees SET
  date_of_birth = '1996-11-12',
  permanent_address = 'Xã Đan Hải, Tỉnh Hà Tĩnh',
  specialty = 'Kỹ sư kinh tế xây dựng',
  political_theory = 'Không',
  tenure_info = '01/01/2026 - LĐHD Ban'
WHERE employee_id = 'NV098';
