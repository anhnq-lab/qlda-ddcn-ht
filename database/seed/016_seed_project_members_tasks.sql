-- ============================================================
-- 016_seed_project_members_tasks.sql
-- Dữ liệu mẫu: Gán nhân sự vào dự án + Tasks mẫu + Construction Works
-- Chạy SAU 015_seed_employees_full.sql
-- ============================================================

-- ── 1. GÁN NHÂN SỰ VÀO DỰ ÁN (project_members) ─────
-- Sử dụng project_id từ DB hiện tại
-- Mỗi dự án cần: Giám đốc DA, Kỹ sư, Chuyên viên, TVGS

DO $$
DECLARE
    v_projects TEXT[];
    v_pid TEXT;
BEGIN
    -- Lấy danh sách project_id
    SELECT ARRAY(SELECT project_id FROM projects ORDER BY project_id LIMIT 20) INTO v_projects;

    IF array_length(v_projects, 1) IS NULL OR array_length(v_projects, 1) = 0 THEN
        RAISE NOTICE 'No projects found. Skipping project_members seed.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found % projects. Seeding project_members...', array_length(v_projects, 1);

    -- Gán BGĐ cho TẤT CẢ dự án (oversight role)
    FOREACH v_pid IN ARRAY v_projects LOOP
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_pid, 'NV002', 'Chỉ đạo chung'),       -- Giám đốc Ban
            (v_pid, 'NV005', 'Theo dõi kế hoạch')     -- Trưởng phòng KHTH
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Dự án 1-4: Ban QLDA 1 (Giao thông)
    IF array_length(v_projects, 1) >= 1 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[1], 'NV003', 'Phó chỉ đạo'),
            (v_projects[1], 'NV017', 'Giám đốc dự án'),
            (v_projects[1], 'NV018', 'Phó giám đốc dự án'),
            (v_projects[1], 'NV019', 'Kỹ sư hiện trường'),
            (v_projects[1], 'NV020', 'Chuyên viên hồ sơ'),
            (v_projects[1], 'NV038', 'Tư vấn giám sát'),
            (v_projects[1], 'NV013', 'Thẩm định kỹ thuật'),
            (v_projects[1], 'NV009', 'Kế toán dự án')
        ON CONFLICT DO NOTHING;
    END IF;

    IF array_length(v_projects, 1) >= 2 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[2], 'NV017', 'Giám đốc dự án'),
            (v_projects[2], 'NV019', 'Kỹ sư hiện trường'),
            (v_projects[2], 'NV038', 'Tư vấn giám sát'),
            (v_projects[2], 'NV011', 'Kế toán dự án')
        ON CONFLICT DO NOTHING;
    END IF;

    IF array_length(v_projects, 1) >= 3 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[3], 'NV017', 'Giám đốc dự án'),
            (v_projects[3], 'NV018', 'Phó giám đốc dự án'),
            (v_projects[3], 'NV020', 'Chuyên viên hồ sơ'),
            (v_projects[3], 'NV009', 'Kế toán dự án')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dự án 4-6: Ban QLDA 2 (Dân dụng)
    IF array_length(v_projects, 1) >= 4 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[4], 'NV004', 'Phó chỉ đạo'),
            (v_projects[4], 'NV021', 'Giám đốc dự án'),
            (v_projects[4], 'NV022', 'Phó giám đốc dự án'),
            (v_projects[4], 'NV023', 'Kỹ sư chính'),
            (v_projects[4], 'NV024', 'Chuyên viên hồ sơ'),
            (v_projects[4], 'NV039', 'Tư vấn giám sát'),
            (v_projects[4], 'NV014', 'Thẩm định kỹ thuật'),
            (v_projects[4], 'NV011', 'Kế toán dự án')
        ON CONFLICT DO NOTHING;
    END IF;

    IF array_length(v_projects, 1) >= 5 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[5], 'NV021', 'Giám đốc dự án'),
            (v_projects[5], 'NV023', 'Kỹ sư chính'),
            (v_projects[5], 'NV039', 'Tư vấn giám sát'),
            (v_projects[5], 'NV012', 'Kế toán dự án')
        ON CONFLICT DO NOTHING;
    END IF;

    IF array_length(v_projects, 1) >= 6 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[6], 'NV021', 'Giám đốc dự án'),
            (v_projects[6], 'NV022', 'Phó giám đốc dự án'),
            (v_projects[6], 'NV024', 'Chuyên viên hồ sơ'),
            (v_projects[6], 'NV014', 'Thẩm định kỹ thuật')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dự án 7-9: Ban QLDA 3 (Hạ tầng kỹ thuật)
    IF array_length(v_projects, 1) >= 7 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[7], 'NV003', 'Phó chỉ đạo'),
            (v_projects[7], 'NV025', 'Giám đốc dự án'),
            (v_projects[7], 'NV026', 'Kỹ sư chính'),
            (v_projects[7], 'NV027', 'Kỹ sư hiện trường'),
            (v_projects[7], 'NV015', 'Thẩm định kỹ thuật'),
            (v_projects[7], 'NV012', 'Kế toán dự án')
        ON CONFLICT DO NOTHING;
    END IF;

    IF array_length(v_projects, 1) >= 8 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[8], 'NV025', 'Giám đốc dự án'),
            (v_projects[8], 'NV027', 'Kỹ sư hiện trường'),
            (v_projects[8], 'NV016', 'Thẩm định kỹ thuật')
        ON CONFLICT DO NOTHING;
    END IF;

    IF array_length(v_projects, 1) >= 9 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[9], 'NV025', 'Giám đốc dự án'),
            (v_projects[9], 'NV026', 'Kỹ sư chính'),
            (v_projects[9], 'NV009', 'Kế toán dự án')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dự án 10-12: Ban QLDA 4 (Công nghệ & CĐS)
    IF array_length(v_projects, 1) >= 10 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[10], 'NV004', 'Phó chỉ đạo'),
            (v_projects[10], 'NV028', 'Giám đốc dự án'),
            (v_projects[10], 'NV029', 'Kỹ sư chính'),
            (v_projects[10], 'NV030', 'Kỹ sư'),
            (v_projects[10], 'NV016', 'Thẩm định kỹ thuật')
        ON CONFLICT DO NOTHING;
    END IF;

    IF array_length(v_projects, 1) >= 11 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[11], 'NV028', 'Giám đốc dự án'),
            (v_projects[11], 'NV030', 'Kỹ sư'),
            (v_projects[11], 'NV012', 'Kế toán dự án')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dự án 12+: Ban QLDA 5 (Môi trường & Thủy lợi)
    IF array_length(v_projects, 1) >= 12 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[12], 'NV003', 'Phó chỉ đạo'),
            (v_projects[12], 'NV031', 'Giám đốc dự án'),
            (v_projects[12], 'NV032', 'Kỹ sư chính'),
            (v_projects[12], 'NV033', 'Chuyên viên'),
            (v_projects[12], 'NV015', 'Thẩm định kỹ thuật'),
            (v_projects[12], 'NV011', 'Kế toán dự án')
        ON CONFLICT DO NOTHING;
    END IF;

    IF array_length(v_projects, 1) >= 13 THEN
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[13], 'NV031', 'Giám đốc dự án'),
            (v_projects[13], 'NV033', 'Chuyên viên'),
            (v_projects[13], 'NV032', 'Kỹ sư chính')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Remaining projects: distribute evenly with key staff
    FOR i IN 14..array_length(v_projects, 1) LOOP
        -- Assign a mix of Ban QLDA staff
        INSERT INTO project_members (project_id, employee_id, role) VALUES
            (v_projects[i], 'NV006', 'Theo dõi kế hoạch'),
            (v_projects[i], CASE
                WHEN i % 5 = 0 THEN 'NV017'
                WHEN i % 5 = 1 THEN 'NV021'
                WHEN i % 5 = 2 THEN 'NV025'
                WHEN i % 5 = 3 THEN 'NV028'
                ELSE 'NV031'
            END, 'Giám đốc dự án')
        ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Done seeding project_members.';
END $$;


-- ── 2. TASKS MẪU ──────────────────────────────────────
-- Tạo tasks phong phú cho các dự án (nhiều trạng thái, có quá hạn)

DO $$
DECLARE
    v_projects TEXT[];
    v_pid TEXT;
    i INT;
BEGIN
    SELECT ARRAY(SELECT project_id FROM projects ORDER BY project_id LIMIT 15) INTO v_projects;

    IF array_length(v_projects, 1) IS NULL THEN
        RAISE NOTICE 'No projects found. Skipping tasks seed.';
        RETURN;
    END IF;

    -- Xóa tasks cũ nếu có (để tránh trùng khi chạy lại)
    -- Chỉ xóa tasks do seed tạo (task_id bắt đầu bằng SEED-)
    DELETE FROM sub_tasks WHERE task_id LIKE 'SEED-%';
    DELETE FROM tasks WHERE task_id LIKE 'SEED-%';

    i := 1;
    FOREACH v_pid IN ARRAY v_projects LOOP
        -- Tasks cho mỗi dự án (mix trạng thái)
        INSERT INTO tasks (task_id, project_id, title, description, status, priority, assignee_id, due_date, phase, progress, duration_days, actual_start_date) VALUES
        -- Giai đoạn chuẩn bị
        ('SEED-T' || LPAD(i::text, 3, '0') || '-01', v_pid,
         'Lập báo cáo đề xuất chủ trương đầu tư',
         'Chuẩn bị hồ sơ đề xuất chủ trương đầu tư theo Luật ĐTC 58/2024',
         'Done', 'high', 'NV005', '2025-06-30', 'Preparation', 100, 30, '2025-05-15'),

        ('SEED-T' || LPAD(i::text, 3, '0') || '-02', v_pid,
         'Thẩm định báo cáo nghiên cứu khả thi',
         'Tổ chức thẩm định BCNCKT theo NĐ 175/2024',
         CASE WHEN i <= 5 THEN 'Done' ELSE 'InProgress' END,
         'high', 'NV013',
         CASE WHEN i <= 5 THEN '2025-08-31' ELSE '2026-04-15' END,
         'Preparation',
         CASE WHEN i <= 5 THEN 100 ELSE 65 END,
         45, '2025-07-01'),

        ('SEED-T' || LPAD(i::text, 3, '0') || '-03', v_pid,
         'Phê duyệt dự án đầu tư',
         'Trình UBND TP phê duyệt dự án theo thẩm quyền',
         CASE WHEN i <= 3 THEN 'Done' WHEN i <= 8 THEN 'InProgress' ELSE 'Todo' END,
         'critical', 'NV002',
         CASE WHEN i <= 3 THEN '2025-09-30' ELSE '2026-05-30' END,
         'Preparation',
         CASE WHEN i <= 3 THEN 100 WHEN i <= 8 THEN 40 ELSE 0 END,
         30, NULL),

        -- Giai đoạn thực hiện
        ('SEED-T' || LPAD(i::text, 3, '0') || '-04', v_pid,
         'Lập quyết định phê duyệt dự án (QĐPD)',
         'Xây dựng QĐPD tuân thủ NĐ 214/2025/NĐ-CP',
         CASE WHEN i <= 4 THEN 'Done' WHEN i <= 7 THEN 'InProgress' ELSE 'Todo' END,
         'high',
         CASE WHEN i % 5 = 0 THEN 'NV017' WHEN i % 5 = 1 THEN 'NV021' WHEN i % 5 = 2 THEN 'NV025' WHEN i % 5 = 3 THEN 'NV028' ELSE 'NV031' END,
         CASE WHEN i <= 4 THEN '2025-10-31' ELSE '2026-06-30' END,
         'Execution',
         CASE WHEN i <= 4 THEN 100 WHEN i <= 7 THEN 55 ELSE 0 END,
         45, NULL),

        ('SEED-T' || LPAD(i::text, 3, '0') || '-05', v_pid,
         'Tổ chức đấu thầu gói xây lắp chính',
         'Thực hiện đấu thầu rộng rãi qua mạng theo quy định',
         CASE WHEN i <= 3 THEN 'Done' WHEN i <= 5 THEN 'InProgress' ELSE 'Todo' END,
         'high', 'NV006',
         CASE WHEN i <= 3 THEN '2025-12-31' ELSE '2026-08-31' END,
         'Execution',
         CASE WHEN i <= 3 THEN 100 WHEN i <= 5 THEN 70 ELSE 0 END,
         60, NULL),

        ('SEED-T' || LPAD(i::text, 3, '0') || '-06', v_pid,
         'Ký kết hợp đồng xây dựng',
         'Đàm phán và ký kết hợp đồng với nhà thầu trúng thầu',
         CASE WHEN i <= 2 THEN 'Done' WHEN i <= 4 THEN 'InProgress' ELSE 'Todo' END,
         'medium', 'NV010',
         CASE WHEN i <= 2 THEN '2026-01-31' ELSE '2026-09-30' END,
         'Execution',
         CASE WHEN i <= 2 THEN 100 WHEN i <= 4 THEN 45 ELSE 0 END,
         15, NULL),

        ('SEED-T' || LPAD(i::text, 3, '0') || '-07', v_pid,
         'Giám sát thi công xây dựng',
         'TVGS kiểm tra chất lượng, tiến độ, khối lượng thi công',
         CASE WHEN i = 1 THEN 'Done' WHEN i <= 4 THEN 'InProgress' ELSE 'Todo' END,
         'high',
         CASE WHEN i <= 4 THEN 'NV038' ELSE 'NV039' END,
         CASE WHEN i = 1 THEN '2026-03-15' ELSE '2027-06-30' END,
         'Execution',
         CASE WHEN i = 1 THEN 100 WHEN i <= 4 THEN 30 ELSE 0 END,
         365, NULL),

        -- Task quá hạn (quan trọng cho AI risk detection)
        ('SEED-T' || LPAD(i::text, 3, '0') || '-08', v_pid,
         'Nghiệm thu khối lượng hoàn thành đợt ' || ((i % 3) + 1),
         'Nghiệm thu A-B khối lượng xây lắp hoàn thành theo đợt',
         'InProgress', 'high',
         CASE WHEN i % 2 = 0 THEN 'NV015' ELSE 'NV016' END,
         '2026-02-28',  -- Quá hạn từ 13/3/2026!
         'Execution', 60, 10, '2026-02-01'),

        ('SEED-T' || LPAD(i::text, 3, '0') || '-09', v_pid,
         'Thanh toán tạm ứng đợt ' || ((i % 4) + 1),
         'Lập hồ sơ thanh toán tạm ứng qua KBNN theo NĐ 99/2021',
         CASE WHEN i % 2 = 0 THEN 'Todo' ELSE 'InProgress' END,
         'medium', 'NV011',
         '2026-03-05',  -- Quá hạn  
         'Execution',
         CASE WHEN i % 2 = 0 THEN 0 ELSE 25 END,
         7, NULL),

        -- Giai đoạn kết thúc
        ('SEED-T' || LPAD(i::text, 3, '0') || '-10', v_pid,
         'Nghiệm thu hoàn thành đưa vào sử dụng',
         'Tổ chức nghiệm thu hoàn thành công trình theo NĐ 06/2021',
         'Todo', 'medium', 'NV013',
         '2027-12-31', 'Completion', 0, 30, NULL);

        i := i + 1;
    END LOOP;

    RAISE NOTICE 'Done seeding % tasks (10 per project).', (i - 1) * 10;
END $$;


-- ── 3. CONSTRUCTION WORKS (Hạng mục xây dựng) ────────

DO $$
DECLARE
    v_projects TEXT[];
BEGIN
    SELECT ARRAY(SELECT project_id FROM projects ORDER BY project_id LIMIT 10) INTO v_projects;

    IF array_length(v_projects, 1) IS NULL THEN
        RAISE NOTICE 'No projects found. Skipping construction_works seed.';
        RETURN;
    END IF;

    -- Xóa works cũ do seed tạo
    DELETE FROM construction_works WHERE work_id LIKE 'SEED-W%';

    -- Dự án 1
    IF array_length(v_projects, 1) >= 1 THEN
        INSERT INTO construction_works (work_id, work_name, project_id, type, grade, design_level, address) VALUES
            ('SEED-W01-01', 'Cầu vượt nút giao thông', v_projects[1], 'Cầu', 2, 2, 'TP. Thủ Đức'),
            ('SEED-W01-02', 'Đường dẫn phía Đông', v_projects[1], 'Đường bộ', 3, 2, 'TP. Thủ Đức'),
            ('SEED-W01-03', 'Hệ thống thoát nước', v_projects[1], 'Hạ tầng kỹ thuật', 3, 3, 'TP. Thủ Đức')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dự án 2
    IF array_length(v_projects, 1) >= 2 THEN
        INSERT INTO construction_works (work_id, work_name, project_id, type, grade, design_level, address) VALUES
            ('SEED-W02-01', 'Tòa nhà chính 12 tầng', v_projects[2], 'Nhà dân dụng', 2, 2, 'Quận Bình Thạnh'),
            ('SEED-W02-02', 'Tầng hầm 2 tầng', v_projects[2], 'Nhà dân dụng', 2, 2, 'Quận Bình Thạnh'),
            ('SEED-W02-03', 'Khuôn viên cảnh quan', v_projects[2], 'Hạ tầng kỹ thuật', 4, 3, 'Quận Bình Thạnh')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dự án 3
    IF array_length(v_projects, 1) >= 3 THEN
        INSERT INTO construction_works (work_id, work_name, project_id, type, grade, design_level, address) VALUES
            ('SEED-W03-01', 'Trường học khối A (3 tầng)', v_projects[3], 'Nhà dân dụng', 3, 3, 'Quận 7'),
            ('SEED-W03-02', 'Nhà đa năng', v_projects[3], 'Nhà dân dụng', 3, 3, 'Quận 7'),
            ('SEED-W03-03', 'Sân vận động mini', v_projects[3], 'Công trình thể thao', 4, 3, 'Quận 7')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dự án 4
    IF array_length(v_projects, 1) >= 4 THEN
        INSERT INTO construction_works (work_id, work_name, project_id, type, grade, design_level, address) VALUES
            ('SEED-W04-01', 'Bệnh viện chính 8 tầng', v_projects[4], 'Nhà dân dụng', 1, 1, 'Quận 2'),
            ('SEED-W04-02', 'Khoa Cấp cứu & Ngoại trú', v_projects[4], 'Nhà dân dụng', 2, 2, 'Quận 2'),
            ('SEED-W04-03', 'Trung tâm xử lý nước thải y tế', v_projects[4], 'Hạ tầng kỹ thuật', 2, 2, 'Quận 2'),
            ('SEED-W04-04', 'Nhà để xe 3 tầng', v_projects[4], 'Nhà dân dụng', 3, 3, 'Quận 2')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dự án 5
    IF array_length(v_projects, 1) >= 5 THEN
        INSERT INTO construction_works (work_id, work_name, project_id, type, grade, design_level, address) VALUES
            ('SEED-W05-01', 'Trạm xử lý nước thải 50.000 m3/ngày', v_projects[5], 'Công trình môi trường', 1, 1, 'Huyện Bình Chánh'),
            ('SEED-W05-02', 'Hệ thống thu gom nước thải', v_projects[5], 'Hạ tầng kỹ thuật', 2, 2, 'Huyện Bình Chánh'),
            ('SEED-W05-03', 'Trạm bơm trung chuyển', v_projects[5], 'Hạ tầng kỹ thuật', 3, 2, 'Huyện Bình Chánh')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dự án 6-10: mỗi dự án 2 hạng mục
    FOR i IN 6..LEAST(10, array_length(v_projects, 1)) LOOP
        INSERT INTO construction_works (work_id, work_name, project_id, type, grade, design_level, address) VALUES
            ('SEED-W' || LPAD(i::text, 2, '0') || '-01', 'Hạng mục chính - Dự án ' || i, v_projects[i], 'Nhà dân dụng', 2, 2, 'TP. Hồ Chí Minh'),
            ('SEED-W' || LPAD(i::text, 2, '0') || '-02', 'Hạ tầng kỹ thuật - Dự án ' || i, v_projects[i], 'Hạ tầng kỹ thuật', 3, 3, 'TP. Hồ Chí Minh')
        ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Done seeding construction_works.';
END $$;

