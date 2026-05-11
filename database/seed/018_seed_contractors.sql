-- ============================================================
-- 018_seed_contractors.sql
-- Dữ liệu mẫu: 35 Nhà thầu thực tế (TV / XL / CC)
-- Chạy TRƯỚC 019_seed_26_projects_full.sql
-- ============================================================

-- Xóa dữ liệu seed cũ nếu có
DELETE FROM contractors WHERE contractor_id LIKE 'NT-%';

-- ── NHÓM TV: TƯ VẤN (12 công ty) ─────────────────────────────

INSERT INTO contractors (contractor_id, full_name, tax_code, address, representative, established_year, cap_cert_code, op_license_no, is_foreign) VALUES
(
  'NT-TV-001',
  'Công ty CP Tư vấn Đầu tư Xây dựng Phương Nam',
  '0300568712',
  '156 Nguyễn Du, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Nguyễn Minh Tuấn',
  1995,
  'CCHN-TV-2022-0156',
  'GPKD-03-005687-12',
  false
),
(
  'NT-TV-002',
  'Công ty TNHH Tư vấn Kỹ thuật Xây dựng HBH',
  '0312456789',
  '45 Phan Đình Phùng, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Hoàng Bá Hải',
  2003,
  'CCHN-TV-2022-0287',
  'GPKD-03-124567-89',
  false
),
(
  'NT-TV-003',
  'Liên danh TEDI South – Viện KH&CN GTVT',
  '0100105611',
  '278 Điện Biên Phủ, Q. Đống Đa, Hà Nội',
  'KS. Trần Văn Phúc',
  1976,
  'CCHN-TV-2021-0089',
  'GPKD-01-001056-11',
  false
),
(
  'NT-TV-004',
  'Công ty CP Tư vấn Thiết kế Hạ tầng Đô thị',
  '0315234567',
  '88 Hải Thượng Lãn Ông, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Lê Quang Dũng',
  2008,
  'CCHN-TV-2023-0341',
  'GPKD-03-152345-67',
  false
),
(
  'NT-TV-005',
  'Công ty CP Kiến trúc & Thiết kế Thành phố',
  '0311789012',
  '12 Trần Phú, TP. Hà Tĩnh, Hà Tĩnh',
  'KTS. Phạm Thu Hà',
  2001,
  'CCHN-TV-2022-0198',
  'GPKD-03-117890-12',
  false
),
(
  'NT-TV-006',
  'Viện Quy hoạch Xây dựng',
  '0303456789',
  '41 Hoa Lư, Q. Hai Bà Trưng, Hà Nội',
  'KS. Vũ Thành Nghĩa',
  1987,
  'CCHN-TV-2021-0067',
  'GPKD-03-034567-89',
  false
),
(
  'NT-TV-007',
  'Công ty CP Giám sát & Quản lý Dự án Cửu Long',
  '0316123456',
  '234 Hà Huy Tập, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Nguyễn Đức Hùng',
  2010,
  'CCHN-TV-2023-0412',
  'GPKD-03-161234-56',
  false
),
(
  'NT-TV-008',
  'Công ty TNHH Tư vấn Môi trường Xanh',
  '0313567890',
  '67 Lý Tự Trọng, TP. Hà Tĩnh, Hà Tĩnh',
  'ThS. Trần Thị Lan',
  2005,
  'CCHN-TV-2022-0245',
  'GPKD-03-135678-90',
  false
),
(
  'NT-TV-009',
  'Công ty CP Thẩm tra & Thẩm định Công trình',
  '0314890123',
  '99 Nguyễn Công Trứ, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Lâm Quốc Bảo',
  2007,
  'CCHN-TV-2023-0318',
  'GPKD-03-148901-23',
  false
),
(
  'NT-TV-010',
  'Công ty TNHH Khảo sát Địa chất',
  '0308901234',
  '15 Vũ Quang, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Huỳnh Văn Thống',
  1999,
  'CCHN-TV-2021-0134',
  'GPKD-03-089012-34',
  false
),
(
  'NT-TV-011',
  'Công ty CP Kiểm định Chất lượng Công trình',
  '0317012345',
  '321 Lê Duẩn, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Phan Thanh Bình',
  2012,
  'CCHN-TV-2023-0456',
  'GPKD-03-170123-45',
  false
),
(
  'NT-TV-012',
  'Liên danh BCI – Bảo hiểm Xây dựng Việt Nam',
  '0300123789',
  '8 Tràng Thi, Q. Hoàn Kiếm, Hà Nội',
  'Ông Vũ Đình Phúc',
  1993,
  NULL,
  'GPKD-03-001237-89',
  false
)
ON CONFLICT (contractor_id) DO NOTHING;


-- ── NHÓM XL: XÂY LẮP (15 công ty) ───────────────────────────

INSERT INTO contractors (contractor_id, full_name, tax_code, address, representative, established_year, cap_cert_code, op_license_no, is_foreign) VALUES
(
  'NT-XL-001',
  'Tổng Công ty Xây dựng Công trình Giao thông 6',
  '0300235678',
  '549 Trần Phú, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Phạm Văn Lực',
  1976,
  'CCHN-XL-2021-0012',
  'GPKD-03-002356-78',
  false
),
(
  'NT-XL-002',
  'Công ty CP Xây dựng và Lắp máy Trung Nam',
  '0313456012',
  '39 Xô Viết Nghệ Tĩnh, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Nguyễn Tâm Tiến',
  2004,
  'CCHN-XL-2022-0178',
  'GPKD-03-134560-12',
  false
),
(
  'NT-XL-003',
  'Công ty CP Xây dựng Hạ tầng Kỹ thuật Đô thị',
  '0315678234',
  '120 Nguyễn Du, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Đỗ Hữu Thanh',
  2009,
  'CCHN-XL-2023-0267',
  'GPKD-03-156782-34',
  false
),
(
  'NT-XL-004',
  'Tổng Công ty Cổ phần Xuất nhập khẩu Xây dựng VN (VINACONEX)',
  '0100100980',
  '34 Láng Hạ, Q. Ba Đình, Hà Nội',
  'TS. Đào Ngọc Thanh',
  1988,
  'CCHN-XL-2021-0008',
  'GPKD-01-001009-80',
  false
),
(
  'NT-XL-005',
  'Công ty CP Tập đoàn Xây dựng Hòa Bình',
  '0310890456',
  '235 Lê Duẩn, Q. Hai Bà Trưng, Hà Nội',
  'KS. Lê Viết Hải',
  1987,
  'CCHN-XL-2021-0023',
  'GPKD-03-108904-56',
  false
),
(
  'NT-XL-006',
  'Công ty TNHH Xây dựng và Thương mại Phú Cường',
  '0316234890',
  '56 QL1A, Huyện Thạch Hà, Hà Tĩnh',
  'KS. Bùi Văn Phú',
  2011,
  'CCHN-XL-2023-0334',
  'GPKD-03-162348-90',
  false
),
(
  'NT-XL-007',
  'Liên danh Coteccons – Newtecon',
  '0313012678',
  '236/6 Điện Biên Phủ, Q. Bình Thạnh, Hà Nội',
  'KS. Bolat Duisenov',
  2004,
  'CCHN-XL-2022-0145',
  'GPKD-03-130126-78',
  false
),
(
  'NT-XL-008',
  'Công ty CP Xây dựng Môi trường Đô thị',
  '0314123789',
  '25 Hải Thượng Lãn Ông, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Trần Ngọc Sơn',
  2006,
  'CCHN-XL-2022-0212',
  'GPKD-03-141237-89',
  false
),
(
  'NT-XL-009',
  'Công ty CP Cấp thoát nước và Xây dựng',
  '0303890567',
  '117 Nguyễn Đình Chiểu, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Lý Minh Tâm',
  1996,
  'CCHN-XL-2021-0098',
  'GPKD-03-038905-67',
  false
),
(
  'NT-XL-010',
  'Tổng Công ty Cổ phần Đường sông',
  '0301234890',
  '2 Tôn Đức Thắng, Q. Đống Đa, Hà Nội',
  'KS. Phan Thanh Hải',
  1980,
  'CCHN-XL-2021-0056',
  'GPKD-03-012348-90',
  false
),
(
  'NT-XL-011',
  'Công ty CP Xây dựng và Kinh doanh Địa ốc Hòa Lợi',
  '0315345012',
  '489 Vũ Quang, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Vũ Minh Đức',
  2009,
  'CCHN-XL-2023-0289',
  'GPKD-03-153450-12',
  false
),
(
  'NT-XL-012',
  'Công ty TNHH Thi công Cơ giới Tân Tiến',
  '0317456123',
  '78 Quốc lộ 1A, TX. Kỳ Anh, Hà Tĩnh',
  'KS. Lê Văn Tiến',
  2013,
  'CCHN-XL-2023-0378',
  'GPKD-03-174561-23',
  false
),
(
  'NT-XL-013',
  'Tổng Công ty Xây dựng Số 1 - CTCP (CC1)',
  '0100105388',
  '1174 Trường Sa, Q. Cầu Giấy, Hà Nội',
  'KS. Nguyễn Bá Hùng',
  1960,
  'CCHN-XL-2021-0005',
  'GPKD-01-001053-88',
  false
),
(
  'NT-XL-014',
  'Công ty CP Đầu tư Xây dựng và Phát triển Long Thành',
  '0316567234',
  '200 Nguyễn Công Trứ, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Trịnh Công Sơn',
  2010,
  'CCHN-XL-2023-0301',
  'GPKD-03-165672-34',
  false
),
(
  'NT-XL-015',
  'Công ty CP Xây dựng Kỹ thuật An Phú',
  '0312678345',
  '156 Hà Huy Tập, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Phạm Anh Khoa',
  2003,
  'CCHN-XL-2022-0189',
  'GPKD-03-126783-45',
  false
)
ON CONFLICT (contractor_id) DO NOTHING;


-- ── NHÓM CC: CHUYÊN NGÀNH (8 công ty) ────────────────────────

INSERT INTO contractors (contractor_id, full_name, tax_code, address, representative, established_year, cap_cert_code, op_license_no, is_foreign) VALUES
(
  'NT-CC-001',
  'Công ty CP Cung cấp Thiết bị Y tế Sài Gòn',
  '0311234567',
  '135 Trần Phú, TP. Hà Tĩnh, Hà Tĩnh',
  'Dược sĩ Nguyễn Thị Thu',
  2002,
  NULL,
  'GPKD-03-112345-67',
  false
),
(
  'NT-CC-002',
  'Công ty CP Chiếu sáng và Thiết bị Đô thị',
  '0313789012',
  '45 Đoàn Thị Điểm, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Trần Huy Hoàng',
  2005,
  NULL,
  'GPKD-03-137890-12',
  false
),
(
  'NT-CC-003',
  'Công ty CP Công nghệ Môi trường Xanh Việt',
  '0316890123',
  '268 Lý Thường Kiệt, Q. Hoàn Kiếm, Hà Nội',
  'ThS. Lê Thanh Sơn',
  2011,
  NULL,
  'GPKD-03-168901-23',
  false
),
(
  'NT-CC-004',
  'Công ty TNHH Lắp đặt Điện-Nước Vạn Thành',
  '0314901234',
  '78 Lê Duẩn, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Vũ Thành Trung',
  2007,
  'CCHN-XL-2022-0234',
  'GPKD-03-149012-34',
  false
),
(
  'NT-CC-005',
  'Công ty CP Quan trắc Môi trường Việt Nam',
  '0315012345',
  '193 Trường Chinh, Q. Đống Đa, Hà Nội',
  'ThS. Đinh Thị Hoa',
  2009,
  NULL,
  'GPKD-03-150123-45',
  false
),
(
  'NT-CC-006',
  'Bảo Việt – Bảo hiểm Xây dựng',
  '0100111948',
  '233 Đồng Khởi, Q. Hai Bà Trưng, Hà Nội',
  'Ông Nguyễn Quang Phi',
  1965,
  NULL,
  'GPKD-01-001119-48',
  false
),
(
  'NT-CC-007',
  'Công ty CP Kinh doanh Chợ và Thương mại Sài Gòn',
  '0300789012',
  '30 Nguyễn Thái Học, TP. Hà Tĩnh, Hà Tĩnh',
  'Ông Lê Minh Châu',
  1991,
  NULL,
  'GPKD-03-007890-12',
  false
),
(
  'NT-CC-008',
  'Công ty TNHH Cảnh quan và Sân vườn Xanh Đô thị',
  '0317123456',
  '56 Xô Viết Nghệ Tĩnh, TP. Hà Tĩnh, Hà Tĩnh',
  'KS. Trần Thị Bích Ngọc',
  2014,
  NULL,
  'GPKD-03-171234-56',
  false
)
ON CONFLICT (contractor_id) DO NOTHING;


-- ── PACKAGE_BIDDERS: Danh sách dự thầu ───────────────────────
-- Áp dụng cho các gói thầu đã có (SEED-* hoặc gói mới)
-- Logic: Mỗi gói đấu rộng rãi có 3-5 đơn vị; gói chỉ định có 1 đơn vị

-- Xóa dữ liệu seed cũ
DELETE FROM package_bidders
  WHERE id IN (
    SELECT pb.id FROM package_bidders pb
    JOIN bidding_packages bp ON bp.package_id = pb.package_id
    WHERE bp.package_id LIKE 'PKG-%'
  );

-- Tạo package_bidders động cho các gói thầu XÂY LẮP (đấu rộng rãi)
-- Mỗi gói XL lớn: 4 nhà thầu dự thầu, 1 trúng thầu
DO $$
DECLARE
  v_pkg RECORD;
  v_xl_contractors TEXT[] := ARRAY[
    'NT-XL-001','NT-XL-002','NT-XL-003','NT-XL-004','NT-XL-005',
    'NT-XL-006','NT-XL-007','NT-XL-008','NT-XL-009','NT-XL-010',
    'NT-XL-011','NT-XL-012','NT-XL-013','NT-XL-014','NT-XL-015'
  ];
  v_idx INT := 0;
  v_winner_idx INT;
  v_bid_price NUMERIC;
  v_tech_scores NUMERIC[] := ARRAY[82.5, 79.0, 85.2, 76.3];
  v_fin_scores  NUMERIC[] := ARRAY[88.0, 92.5, 84.0, 95.1];
BEGIN
  FOR v_pkg IN
    SELECT package_id, price, estimate_price, selection_method
    FROM bidding_packages
    WHERE field IN ('Xây lắp', 'Thi công')
      AND status IN ('Executing', 'Completed')
    ORDER BY package_id
    LIMIT 30
  LOOP
    v_idx := v_idx + 1;
    v_winner_idx := (v_idx % 4) + 1; -- nhà thầu thứ 1-4 trúng thầu luân phiên

    -- 4 nhà thầu dự thầu
    FOR j IN 1..4 LOOP
      v_bid_price := ROUND(
        COALESCE(v_pkg.estimate_price, v_pkg.price) *
        CASE j
          WHEN 1 THEN 0.972
          WHEN 2 THEN 0.958
          WHEN 3 THEN 0.985
          WHEN 4 THEN 0.943
        END
      );

      INSERT INTO package_bidders (
        package_id, contractor_id,
        bid_price, technical_score, financial_score, combined_score,
        rank, status
      ) VALUES (
        v_pkg.package_id,
        v_xl_contractors[ ((v_idx + j - 2) % 15) + 1 ],
        v_bid_price,
        v_tech_scores[j],
        v_fin_scores[j],
        ROUND((v_tech_scores[j] * 0.7 + v_fin_scores[j] * 0.3)::NUMERIC, 2),
        j,
        CASE WHEN j = v_winner_idx THEN 'winner' ELSE 'evaluated' END
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

  END LOOP;
  RAISE NOTICE 'Seeded package_bidders for XL packages.';
END $$;


-- Tư vấn thiết kế (đấu rộng rãi hạn chế)
DO $$
DECLARE
  v_pkg RECORD;
  v_tv_contractors TEXT[] := ARRAY[
    'NT-TV-001','NT-TV-002','NT-TV-003','NT-TV-004','NT-TV-005','NT-TV-006'
  ];
  v_idx INT := 0;
BEGIN
  FOR v_pkg IN
    SELECT package_id, price
    FROM bidding_packages
    WHERE field IN ('Tư vấn', 'Thiết kế', 'Tư vấn thiết kế')
      AND selection_method NOT ILIKE '%chỉ định%'
    ORDER BY package_id
    LIMIT 20
  LOOP
    v_idx := v_idx + 1;

    -- 3 nhà thầu TV dự thầu
    FOR j IN 1..3 LOOP
      INSERT INTO package_bidders (
        package_id, contractor_id,
        bid_price, technical_score, financial_score, combined_score,
        rank, status
      ) VALUES (
        v_pkg.package_id,
        v_tv_contractors[ ((v_idx + j - 2) % 6) + 1 ],
        ROUND(v_pkg.price * (0.92 + j * 0.02)),
        ROUND((88.0 - j * 2.5 + (v_idx % 5))::NUMERIC, 1),
        ROUND((90.0 - j * 3.0 + (v_idx % 3))::NUMERIC, 1),
        ROUND((88.0 - j * 2.5 + (v_idx % 5)) * 0.7 + (90.0 - j * 3.0 + (v_idx % 3)) * 0.3, 2),
        j,
        CASE WHEN j = 1 THEN 'winner' ELSE 'evaluated' END
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

  END LOOP;
  RAISE NOTICE 'Seeded package_bidders for TV packages.';
END $$;


-- Gói chỉ định thầu (khảo sát, TVGS nhỏ, bảo hiểm)
DO $$
DECLARE
  v_pkg RECORD;
  v_idx INT := 0;
  v_cn_map TEXT[][] := ARRAY[
    ARRAY['Khảo sát',   'NT-TV-010'],
    ARRAY['Thẩm tra',   'NT-TV-009'],
    ARRAY['TVGS',       'NT-TV-007'],
    ARRAY['Bảo hiểm',   'NT-CC-006'],
    ARRAY['Kiểm định',  'NT-TV-011'],
    ARRAY['Môi trường', 'NT-TV-008'],
    ARRAY['Chiếu sáng', 'NT-CC-002'],
    ARRAY['MEP',        'NT-CC-004'],
    ARRAY['Cảnh quan',  'NT-CC-008']
  ];
  v_ct_id TEXT;
BEGIN
  FOR v_pkg IN
    SELECT package_id, price, field
    FROM bidding_packages
    WHERE selection_method ILIKE '%chỉ định%'
      AND status IN ('Executing', 'Completed', 'ContractSigned')
    ORDER BY package_id
    LIMIT 40
  LOOP
    v_idx := v_idx + 1;
    -- Chọn nhà thầu phù hợp theo field
    v_ct_id := 'NT-TV-007'; -- default TVGS
    FOR i IN 1..array_length(v_cn_map, 1) LOOP
      IF v_pkg.field ILIKE '%' || v_cn_map[i][1] || '%' THEN
        v_ct_id := v_cn_map[i][2];
        EXIT;
      END IF;
    END LOOP;

    INSERT INTO package_bidders (
      package_id, contractor_id,
      bid_price, status,
      appointment_reason,
      negotiated_price
    ) VALUES (
      v_pkg.package_id,
      v_ct_id,
      v_pkg.price,
      'winner',
      CASE (v_idx % 3)
        WHEN 0 THEN 'Đủ điều kiện năng lực theo NĐ 15/2021/NĐ-CP; giá trị gói thầu ≤ 500 triệu'
        WHEN 1 THEN 'Chỉ định thầu theo khoản 2 Điều 22 Luật Đấu thầu 2023 (gói thầu cấp bách)'
        ELSE      'Tình huống đặc biệt; thời gian chuẩn bị gấp; không đủ thời gian đấu thầu rộng rãi'
      END,
      ROUND(v_pkg.price * 0.97)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  RAISE NOTICE 'Seeded package_bidders for Chỉ định packages.';
END $$;


DO $$ BEGIN RAISE NOTICE '✅ Hoàn tất seed 35 nhà thầu + package_bidders!'; END $$;
