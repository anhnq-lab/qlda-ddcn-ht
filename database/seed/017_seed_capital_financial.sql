-- ============================================================
-- 017_seed_capital_financial.sql
-- Dữ liệu mẫu: Kế hoạch vốn, Giải ngân, Phụ lục HĐ, Package Issues
-- Chạy SAU 015 và 016
-- ============================================================

-- ── 1. KẾ HOẠCH VỐN (capital_plans) ──────────────────
-- Mỗi dự án có 2-3 năm kế hoạch vốn

DO $$
DECLARE
    v_projects RECORD;
    v_idx INT := 1;
    v_amt NUMERIC;
BEGIN
    -- Xóa dữ liệu cũ do seed tạo
    DELETE FROM disbursements WHERE disbursement_id LIKE 'SEED-D%';
    DELETE FROM capital_plans WHERE plan_id LIKE 'SEED-CP%';

    FOR v_projects IN SELECT project_id, total_investment, status FROM projects ORDER BY project_id LIMIT 15 LOOP
        v_amt := CASE WHEN COALESCE(v_projects.total_investment, 0) = 0 THEN 100000000000 ELSE v_projects.total_investment END; -- default 100 tỷ

        -- Năm 2025
        INSERT INTO capital_plans (plan_id, project_id, year, amount, disbursed_amount, source, decision_number, date_assigned) VALUES
        ('SEED-CP' || LPAD(v_idx::text, 3, '0') || '-2025', v_projects.project_id, 2025,
         ROUND(v_amt * 0.15), -- 15% tổng mức cho năm 2025
         ROUND(v_amt * 0.15 * CASE WHEN v_projects.status >= 2 THEN 0.85 ELSE 0.45 END), -- tỉ lệ giải ngân
         'Ngân sách TP.HCM',
         'QĐ-' || v_idx || '/2025/UBND',
         '2025-01-15')
        ON CONFLICT (plan_id) DO NOTHING;

        -- Năm 2026
        INSERT INTO capital_plans (plan_id, project_id, year, amount, disbursed_amount, source, decision_number, date_assigned) VALUES
        ('SEED-CP' || LPAD(v_idx::text, 3, '0') || '-2026', v_projects.project_id, 2026,
         ROUND(v_amt * 0.25), -- 25% tổng mức cho năm 2026
         ROUND(v_amt * 0.25 * 
            CASE 
                WHEN v_projects.status = 3 THEN 0.78  -- KT: đã giải ngân 78%
                WHEN v_projects.status = 2 THEN 0.35  -- TH: giải ngân 35% (đang thi công)
                ELSE 0.10  -- CB: mới giải ngân 10%
            END),
         'Ngân sách TP.HCM',
         'QĐ-' || v_idx || '/2026/UBND',
         '2026-01-20')
        ON CONFLICT (plan_id) DO NOTHING;

        -- Năm 2027 (chỉ cho dự án lớn)
        IF v_amt > 200000000000 THEN -- > 200 tỷ
            INSERT INTO capital_plans (plan_id, project_id, year, amount, disbursed_amount, source, decision_number, date_assigned) VALUES
            ('SEED-CP' || LPAD(v_idx::text, 3, '0') || '-2027', v_projects.project_id, 2027,
             ROUND(v_amt * 0.30), -- 30% cho 2027
             0, -- Chưa giải ngân
             'Ngân sách TP.HCM',
             'QĐ-' || v_idx || '/2027/UBND',
             NULL)
            ON CONFLICT (plan_id) DO NOTHING;
        END IF;

        v_idx := v_idx + 1;
    END LOOP;

    RAISE NOTICE 'Seeded capital_plans for % projects.', v_idx - 1;
END $$;


-- ── 2. GIẢI NGÂN (disbursements) ──────────────────────
-- Tạo lịch sử giải ngân chi tiết cho các dự án

DO $$
DECLARE
    v_projects RECORD;
    v_capital RECORD;
    v_idx INT := 1;
    v_disb_amt NUMERIC;
BEGIN
    FOR v_projects IN SELECT project_id, total_investment, status FROM projects ORDER BY project_id LIMIT 12 LOOP
        -- Giải ngân năm 2025
        FOR v_capital IN SELECT plan_id, project_id, amount, year FROM capital_plans 
            WHERE project_id = v_projects.project_id AND plan_id LIKE 'SEED-%' AND year = 2025 LOOP
            
            -- Tạm ứng Q1
            INSERT INTO disbursements (disbursement_id, project_id, capital_plan_id, amount, date, status, form_type, treasury_code) VALUES
            ('SEED-D' || LPAD(v_idx::text, 3, '0') || '-TU1', v_projects.project_id, v_capital.plan_id,
             ROUND(v_capital.amount * 0.15), '2025-03-15', 'approved', 'TamUng', 'KB-' || v_idx || '-Q1-2025')
            ON CONFLICT DO NOTHING;

            -- Thanh toán KLHT Q2
            INSERT INTO disbursements (disbursement_id, project_id, capital_plan_id, amount, date, status, form_type, treasury_code) VALUES
            ('SEED-D' || LPAD(v_idx::text, 3, '0') || '-KL1', v_projects.project_id, v_capital.plan_id,
             ROUND(v_capital.amount * 0.25), '2025-06-20', 'approved', 'ThanhToanKLHT', 'KB-' || v_idx || '-Q2-2025')
            ON CONFLICT DO NOTHING;

            -- Thanh toán KLHT Q3
            INSERT INTO disbursements (disbursement_id, project_id, capital_plan_id, amount, date, status, form_type, treasury_code) VALUES
            ('SEED-D' || LPAD(v_idx::text, 3, '0') || '-KL2', v_projects.project_id, v_capital.plan_id,
             ROUND(v_capital.amount * 0.30), '2025-09-10',
             CASE WHEN v_projects.status >= 2 THEN 'approved' ELSE 'pending' END,
             'ThanhToanKLHT', 'KB-' || v_idx || '-Q3-2025')
            ON CONFLICT DO NOTHING;

            -- Thanh toán Q4
            IF v_projects.status >= 2 THEN
                INSERT INTO disbursements (disbursement_id, project_id, capital_plan_id, amount, date, status, form_type, treasury_code) VALUES
                ('SEED-D' || LPAD(v_idx::text, 3, '0') || '-KL3', v_projects.project_id, v_capital.plan_id,
                 ROUND(v_capital.amount * 0.15), '2025-12-05', 'approved', 'ThanhToanKLHT', 'KB-' || v_idx || '-Q4-2025')
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;

        -- Giải ngân năm 2026
        FOR v_capital IN SELECT plan_id, project_id, amount, year FROM capital_plans 
            WHERE project_id = v_projects.project_id AND plan_id LIKE 'SEED-%' AND year = 2026 LOOP
            
            -- Tạm ứng Q1-2026
            INSERT INTO disbursements (disbursement_id, project_id, capital_plan_id, amount, date, status, form_type, treasury_code) VALUES
            ('SEED-D' || LPAD(v_idx::text, 3, '0') || '-TU2', v_projects.project_id, v_capital.plan_id,
             ROUND(v_capital.amount * 0.20), '2026-02-10', 'approved', 'TamUng', 'KB-' || v_idx || '-Q1-2026')
            ON CONFLICT DO NOTHING;

            -- Thanh toán KLHT tháng 2
            IF v_projects.status >= 2 THEN
                INSERT INTO disbursements (disbursement_id, project_id, capital_plan_id, amount, date, status, form_type, treasury_code) VALUES
                ('SEED-D' || LPAD(v_idx::text, 3, '0') || '-KL4', v_projects.project_id, v_capital.plan_id,
                 ROUND(v_capital.amount * 0.15), '2026-03-01', 'approved', 'ThanhToanKLHT', 'KB-' || v_idx || '-M3-2026')
                ON CONFLICT DO NOTHING;
            END IF;

            -- Đang chờ duyệt (pending) — cho AI phát hiện
            INSERT INTO disbursements (disbursement_id, project_id, capital_plan_id, amount, date, status, form_type, treasury_code) VALUES
            ('SEED-D' || LPAD(v_idx::text, 3, '0') || '-PD1', v_projects.project_id, v_capital.plan_id,
             ROUND(v_capital.amount * 0.12), '2026-03-10', 'pending', 'ThanhToanKLHT', NULL)
            ON CONFLICT DO NOTHING;
        END LOOP;

        v_idx := v_idx + 1;
    END LOOP;

    RAISE NOTICE 'Seeded disbursements for % projects.', v_idx - 1;
END $$;


-- ── 3. PHỤ LỤC HỢP ĐỒNG (variation_orders) ─────────

DO $$
DECLARE
    v_contracts RECORD;
    v_idx INT := 1;
BEGIN
    -- Xóa dữ liệu cũ
    DELETE FROM variation_orders WHERE vo_id LIKE 'SEED-VO%';

    FOR v_contracts IN 
        SELECT c.contract_id, c.value, c.project_id, c.contract_name
        FROM contracts c
        ORDER BY c.contract_id
        LIMIT 10
    LOOP
        -- Phụ lục 1: Điều chỉnh giá vật liệu
        INSERT INTO variation_orders (vo_id, contract_id, number, content, adjusted_amount, adjusted_duration, sign_date) VALUES
        ('SEED-VO' || LPAD(v_idx::text, 3, '0') || '-01', v_contracts.contract_id,
         'PL01/' || v_contracts.contract_id,
         'Điều chỉnh đơn giá vật liệu (thép, xi măng) theo chỉ số giá Q3/2025 của Sở Xây dựng TP.HCM',
         ROUND(v_contracts.value * 0.05), -- tăng 5% giá trị
         NULL,
         '2025-10-15')
        ON CONFLICT DO NOTHING;

        -- Phụ lục 2: Bổ sung hạng mục (chỉ cho một số HĐ)
        IF v_idx % 2 = 0 THEN
            INSERT INTO variation_orders (vo_id, contract_id, number, content, adjusted_amount, adjusted_duration, sign_date) VALUES
            ('SEED-VO' || LPAD(v_idx::text, 3, '0') || '-02', v_contracts.contract_id,
             'PL02/' || v_contracts.contract_id,
             'Bổ sung hạng mục gia cố nền móng theo yêu cầu kỹ thuật thực tế hiện trường',
             ROUND(v_contracts.value * 0.08), -- tăng 8% giá trị
             30, -- thêm 30 ngày
             '2026-01-20')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Phụ lục 3: Gia hạn thời gian (chỉ cho HĐ chẵn thứ 3)
        IF v_idx % 3 = 0 THEN
            INSERT INTO variation_orders (vo_id, contract_id, number, content, adjusted_amount, adjusted_duration, sign_date) VALUES
            ('SEED-VO' || LPAD(v_idx::text, 3, '0') || '-03', v_contracts.contract_id,
             'PL03/' || v_contracts.contract_id,
             'Gia hạn thời gian thi công do ảnh hưởng mùa mưa và di dời đường ống cấp nước',
             0, -- không thay đổi giá
             60, -- thêm 60 ngày
             '2026-02-28')
            ON CONFLICT DO NOTHING;
        END IF;

        v_idx := v_idx + 1;
    END LOOP;

    RAISE NOTICE 'Seeded variation_orders for % contracts.', v_idx - 1;
END $$;


-- ── 4. PACKAGE ISSUES (Vấn đề gói thầu) ──────────────
-- Quan trọng cho AI Risk Detection

DO $$
DECLARE
    v_packages RECORD;
    v_idx INT := 1;
BEGIN
    -- Xóa dữ liệu cũ
    DELETE FROM package_issues WHERE issue_id LIKE 'SEED-PI%';

    FOR v_packages IN 
        SELECT bp.package_id, bp.package_name, bp.project_id
        FROM bidding_packages bp
        ORDER BY bp.package_id
        LIMIT 12
    LOOP
        -- Issue 1: Tiến độ chậm
        IF v_idx <= 5 THEN
            INSERT INTO package_issues (issue_id, package_id, title, description, severity, status, reporter, reported_date) VALUES
            ('SEED-PI' || LPAD(v_idx::text, 3, '0') || '-01', v_packages.package_id,
             'Chậm tiến độ thi công ' || (v_idx * 5) || ' ngày',
             'Nhà thầu chậm tiến độ do thiếu nhân lực và máy móc thiết bị. Đã nhắc nhở bằng văn bản ' || v_idx || ' lần.',
             CASE WHEN v_idx <= 2 THEN 'High' WHEN v_idx <= 4 THEN 'Medium' ELSE 'Low' END,
             CASE WHEN v_idx <= 3 THEN 'Open' ELSE 'Resolved' END,
             'NV017', '2026-02-' || LPAD((v_idx * 5)::text, 2, '0'))
            ON CONFLICT DO NOTHING;
        END IF;

        -- Issue 2: Chất lượng vật liệu
        IF v_idx % 3 = 0 THEN
            INSERT INTO package_issues (issue_id, package_id, title, description, severity, status, reporter, reported_date) VALUES
            ('SEED-PI' || LPAD(v_idx::text, 3, '0') || '-02', v_packages.package_id,
             'Chất lượng thép không đạt tiêu chuẩn',
             'Kết quả thí nghiệm mẫu thép lot ' || v_idx || ' cho thấy cường độ không đạt TCVN. Yêu cầu thay thế.',
             'High', 'Open', 'NV015', '2026-03-05')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Issue 3: Vi phạm an toàn lao động
        IF v_idx % 4 = 0 THEN
            INSERT INTO package_issues (issue_id, package_id, title, description, severity, status, reporter, reported_date) VALUES
            ('SEED-PI' || LPAD(v_idx::text, 3, '0') || '-03', v_packages.package_id,
             'Vi phạm quy định an toàn lao động',
             'Công nhân không đeo dây an toàn khi làm việc trên cao. Đã lập biên bản vi phạm.',
             'High', 'Open', 'NV038', '2026-03-08')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Issue 4: Hồ sơ thanh toán thiếu
        IF v_idx <= 6 THEN
            INSERT INTO package_issues (issue_id, package_id, title, description, severity, status, reporter, reported_date) VALUES
            ('SEED-PI' || LPAD(v_idx::text, 3, '0') || '-04', v_packages.package_id,
             'Hồ sơ thanh toán đợt ' || v_idx || ' không đầy đủ',
             'Nhà thầu gửi hồ sơ thanh toán thiếu chứng chỉ xuất xứ vật liệu và biên bản nghiệm thu nội bộ.',
             'Medium',
             CASE WHEN v_idx <= 4 THEN 'Open' ELSE 'Resolved' END,
             'NV011', '2026-02-' || LPAD((10 + v_idx)::text, 2, '0'))
            ON CONFLICT DO NOTHING;
        END IF;

        v_idx := v_idx + 1;
    END LOOP;

    RAISE NOTICE 'Seeded package_issues for % packages.', v_idx - 1;
END $$;


-- ── 5. STAGE TRANSITIONS (Lịch sử chuyển giai đoạn) ──

DO $$
DECLARE
    v_projects RECORD;
    v_idx INT := 1;
BEGIN
    DELETE FROM stage_transitions WHERE id LIKE 'SEED-ST%';

    FOR v_projects IN SELECT project_id, status FROM projects ORDER BY project_id LIMIT 15 LOOP
        -- Tất cả dự án đều có giai đoạn Chuẩn bị
        INSERT INTO stage_transitions (id, project_id, stage, start_date, end_date, decision_number, decision_date, notes) VALUES
        ('SEED-ST' || LPAD(v_idx::text, 3, '0') || '-01', v_projects.project_id,
         'Preparation', '2024-06-01',
         CASE WHEN v_projects.status >= 2 THEN '2025-06-30' ELSE NULL END,
         'QĐ-CTDT-' || v_idx || '/2024',
         '2024-06-01',
         'Phê duyệt chủ trương đầu tư')
        ON CONFLICT DO NOTHING;

        -- Dự án Thực hiện có giai đoạn 2
        IF v_projects.status >= 2 THEN
            INSERT INTO stage_transitions (id, project_id, stage, start_date, end_date, decision_number, decision_date, notes) VALUES
            ('SEED-ST' || LPAD(v_idx::text, 3, '0') || '-02', v_projects.project_id,
             'Execution', '2025-07-01',
             CASE WHEN v_projects.status = 3 THEN '2026-12-31' ELSE NULL END,
             'QĐ-PDDA-' || v_idx || '/2025',
             '2025-06-30',
             'Phê duyệt dự án, chuyển sang giai đoạn thực hiện')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Dự án Kết thúc
        IF v_projects.status = 3 THEN
            INSERT INTO stage_transitions (id, project_id, stage, start_date, end_date, decision_number, decision_date, notes) VALUES
            ('SEED-ST' || LPAD(v_idx::text, 3, '0') || '-03', v_projects.project_id,
             'Completion', '2027-01-01', NULL,
             'QĐ-NTHT-' || v_idx || '/2027',
             '2026-12-31',
             'Nghiệm thu hoàn thành, đưa CT vào sử dụng')
            ON CONFLICT DO NOTHING;
        END IF;

        v_idx := v_idx + 1;
    END LOOP;

    RAISE NOTICE 'Seeded stage_transitions for % projects.', v_idx - 1;
END $$;


-- ── 6. AUDIT LOGS mẫu ────────────────────────────────

INSERT INTO audit_logs (log_id, action, target_entity, target_id, changed_by, details, timestamp) VALUES
    ('SEED-LOG-001', 'Create', 'Project', 'DA-001', 'NV002', 'Tạo dự án mới: Cầu vượt nút giao TP Thủ Đức', '2024-06-01 08:30:00+07'),
    ('SEED-LOG-002', 'Update', 'Project', 'DA-001', 'NV005', 'Cập nhật tổng mức đầu tư từ 800 tỷ lên 950 tỷ', '2024-07-15 14:20:00+07'),
    ('SEED-LOG-003', 'Create', 'Contract', 'HD-001', 'NV010', 'Ký kết hợp đồng thi công gói thầu XL-01', '2025-02-10 09:00:00+07'),
    ('SEED-LOG-004', 'Update', 'Task', 'SEED-T001-01', 'NV005', 'Hoàn thành lập báo cáo đề xuất chủ trương đầu tư', '2025-06-30 16:45:00+07'),
    ('SEED-LOG-005', 'Create', 'Payment', '1', 'NV011', 'Lập hồ sơ thanh toán đợt 1 - Gói XL-01', '2025-09-05 10:15:00+07'),
    ('SEED-LOG-006', 'Update', 'Contract', 'HD-001', 'NV017', 'Phụ lục điều chỉnh giá vật liệu Q3/2025', '2025-10-15 11:30:00+07'),
    ('SEED-LOG-007', 'Login', 'System', 'NV002', 'NV002', 'Đăng nhập hệ thống', '2026-03-13 07:30:00+07'),
    ('SEED-LOG-008', 'Login', 'System', 'NV017', 'NV017', 'Đăng nhập hệ thống', '2026-03-13 07:45:00+07'),
    ('SEED-LOG-009', 'Update', 'Task', 'SEED-T001-07', 'NV038', 'Cập nhật tiến độ giám sát thi công: 30%', '2026-03-12 15:00:00+07'),
    ('SEED-LOG-010', 'Create', 'Document', '100', 'NV020', 'Upload bản vẽ hoàn công tầng 5', '2026-03-11 09:20:00+07')
ON CONFLICT (log_id) DO NOTHING;


RAISE NOTICE '✅ Hoàn tất seed dữ liệu tài chính và vận hành!';

