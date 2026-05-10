-- Auto-generated: seed từ DM dự án.txt
-- Logic: UPDATE nếu project_name khớp, INSERT nếu không tìm thấy

-- STT 1: Nâng cấp, cải tạo, sửa chữa Nhà làm việc Huyện Ủy, UBND huyệ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo, sửa chữa Nhà làm việc Huyện Ủy, UBND huyện và các hạng mục phụ trợ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = NULL,
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 1,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo, sửa chữa Nhà làm việc Huyện Ủy, UBND huyện và các hạng mục phụ trợ',
      NULL,
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      1,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 2: Nâng cấp, mở rộng đường Thị Sơn, huyện Can Lộc (giai đoạn 2)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường Thị Sơn, huyện Can Lộc (giai đoạn 2)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8156067',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 1,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường Thị Sơn, huyện Can Lộc (giai đoạn 2)',
      '8156067',
      2,
      'H',
      'Can Lộc',
      '2140',
      1,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 3: Khối hành chính quản trị kết hợp phòng phục vụ học tập 02 tầ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối hành chính quản trị kết hợp phòng phục vụ học tập 02 tầng 06 phòng; bếp ăn bán trú; hệ thống thoát nước và các hạng mục phụ trợ Trường Mầm non Ngọc Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8158497',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 1,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Tâm')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối hành chính quản trị kết hợp phòng phục vụ học tập 02 tầng 06 phòng; bếp ăn bán trú; hệ thống thoát nước và các hạng mục phụ trợ Trường Mầm non Ngọc Sơn',
      '8158497',
      3,
      'H',
      'Thạch Hà',
      '2140',
      1,
      jsonb_build_object('ke_toan', 'Tâm')
    );
  END IF;
END $$;

-- STT 4: Khối phòng học tập kết hợp hồ trợ, phụ trợ học tập Trường TH
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng học tập kết hợp hồ trợ, phụ trợ học tập Trường THCS Hương Trạch')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8164161',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 1,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng học tập kết hợp hồ trợ, phụ trợ học tập Trường THCS Hương Trạch',
      '8164161',
      3,
      'H',
      'Hương Khê',
      '2140',
      1,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 5: Khối phụ trợ học tập 02 tầng Trường tiểu học Phú Phong
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phụ trợ học tập 02 tầng Trường tiểu học Phú Phong')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8164160',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 1,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phụ trợ học tập 02 tầng Trường tiểu học Phú Phong',
      '8164160',
      3,
      'H',
      'Hương Khê',
      '2140',
      1,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 6: Cầu Cây Soi, xã Hương Giang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Cây Soi, xã Hương Giang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080494',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 1,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Cây Soi, xã Hương Giang',
      '8080494',
      3,
      'H',
      'Hương Khê',
      '2140',
      1,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 7: Nhà học 02 tầng 04 phòng Trường Mầm non Phúc Đồng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 02 tầng 04 phòng Trường Mầm non Phúc Đồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096033',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 1,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 02 tầng 04 phòng Trường Mầm non Phúc Đồng',
      '8096033',
      3,
      'H',
      'Hương Khê',
      '2140',
      1,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 8: Đập Vực Rong xã Hòa Hải
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đập Vực Rong xã Hòa Hải')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080482',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 1,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đập Vực Rong xã Hòa Hải',
      '8080482',
      3,
      'H',
      'Hương Khê',
      '2140',
      1,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 9: Sửa chữa, cải tạo Trường Mầm non Hòa Hải (Điểm Đại Đồng)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, cải tạo Trường Mầm non Hòa Hải (Điểm Đại Đồng)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096035',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 1,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, cải tạo Trường Mầm non Hòa Hải (Điểm Đại Đồng)',
      '8096035',
      3,
      'H',
      'Hương Khê',
      '2140',
      1,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 10: Nhà học bộ môn 02 tầng 8 phòng Trường THCS Cẩm Thịnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 02 tầng 8 phòng Trường THCS Cẩm Thịnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8061189',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 02 tầng 8 phòng Trường THCS Cẩm Thịnh',
      '8061189',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 11: Đường trục xã TX.11 xã Cẩm Mỹ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường trục xã TX.11 xã Cẩm Mỹ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8132632',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường trục xã TX.11 xã Cẩm Mỹ',
      '8132632',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 12: Đường liên xã ĐLX.02 Thị trấn Thiên Cầm đi xã Nam Phúc Thăng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường liên xã ĐLX.02 Thị trấn Thiên Cầm đi xã Nam Phúc Thăng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8132634',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường liên xã ĐLX.02 Thị trấn Thiên Cầm đi xã Nam Phúc Thăng',
      '8132634',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 13: Nhà học 02 tầng 8 phòng học bộ môn Trường THCS Hà Huy Tập
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 02 tầng 8 phòng học bộ môn Trường THCS Hà Huy Tập')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8061193',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 02 tầng 8 phòng học bộ môn Trường THCS Hà Huy Tập',
      '8061193',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 14: Kênh tiêu úng dọc đường ĐH 131 đoạn từ đường ĐH 121 đến thôn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Kênh tiêu úng dọc đường ĐH 131 đoạn từ đường ĐH 121 đến thôn Bình Minh, xã Cẩm Bình, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8062397',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Kênh tiêu úng dọc đường ĐH 131 đoạn từ đường ĐH 121 đến thôn Bình Minh, xã Cẩm Bình, huyện Cẩm Xuyên',
      '8062397',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 15: Xây dựng trường chính trị Trần Phú
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trường chính trị Trần Phú')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8115004',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Bình')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trường chính trị Trần Phú',
      '8115004',
      2,
      'T',
      'Dân dụng',
      'DDCN',
      2,
      jsonb_build_object('ke_toan', 'Bình')
    );
  END IF;
END $$;

-- STT 16: Xây dựng tường rào, cổng, mương thoát nước, sân nội bộ và hạ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng tường rào, cổng, mương thoát nước, sân nội bộ và hạng mục phụ trợ mở rộng khuôn viên Bệnh viện Đa khoa tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8172870',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '3071',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng tường rào, cổng, mương thoát nước, sân nội bộ và hạng mục phụ trợ mở rộng khuôn viên Bệnh viện Đa khoa tỉnh Hà Tĩnh',
      '8172870',
      2,
      'T',
      'Cẩm Xuyên',
      '3071',
      2,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 17: Dự án xây dựng nhà học 3 tầng 15 phòng Trường THPT Cẩm Xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án xây dựng nhà học 3 tầng 15 phòng Trường THPT Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8160772',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '1882',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án xây dựng nhà học 3 tầng 15 phòng Trường THPT Cẩm Xuyên',
      '8160772',
      2,
      'T',
      'Cẩm Xuyên',
      '1882',
      2,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 18: Nâng cấp tuyến đường trục xã TX.01 đoạn từ Quốc lộ 15B đến t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp tuyến đường trục xã TX.01 đoạn từ Quốc lộ 15B đến thôn Văn Sơn, xã Đỉnh Bàn, huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8119291',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Tâm')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp tuyến đường trục xã TX.01 đoạn từ Quốc lộ 15B đến thôn Văn Sơn, xã Đỉnh Bàn, huyện Thạch Hà',
      '8119291',
      3,
      'T',
      'Thạch Hà',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Tâm')
    );
  END IF;
END $$;

-- STT 19: Xây dựng trạm bơm Cồn Đình, xã Thạch Long
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trạm bơm Cồn Đình, xã Thạch Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8119922',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Tâm')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trạm bơm Cồn Đình, xã Thạch Long',
      '8119922',
      3,
      'H',
      'Thạch Hà',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Tâm')
    );
  END IF;
END $$;

-- STT 20: Hàng rào và các công trình phụ trợ Trường THCS Ngọc Sơn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hàng rào và các công trình phụ trợ Trường THCS Ngọc Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8128679',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Tâm')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hàng rào và các công trình phụ trợ Trường THCS Ngọc Sơn',
      '8128679',
      3,
      'H',
      'Thạch Hà',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Tâm')
    );
  END IF;
END $$;

-- STT 21: Xây dựng tràn điều tiết kết hợp đường giao thông nội đồng và
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng tràn điều tiết kết hợp đường giao thông nội đồng và tuyến kênh tưới phục vụ sản xuất thôn Xuân Sơn, xã Lưu Vĩnh Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8128253',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng tràn điều tiết kết hợp đường giao thông nội đồng và tuyến kênh tưới phục vụ sản xuất thôn Xuân Sơn, xã Lưu Vĩnh Sơn',
      '8128253',
      3,
      'H',
      'Thạch Hà',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 22: Xây dựng trạm bơm và kênh tưới nội đồng xã Thạch Liên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trạm bơm và kênh tưới nội đồng xã Thạch Liên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8128528',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trạm bơm và kênh tưới nội đồng xã Thạch Liên',
      '8128528',
      3,
      'H',
      'Thạch Hà',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 23: Xây dựng tuyến kênh tưới hạ du hồ chứa nước đập Đá Đen, xã N
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng tuyến kênh tưới hạ du hồ chứa nước đập Đá Đen, xã Ngọc Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8128527',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng tuyến kênh tưới hạ du hồ chứa nước đập Đá Đen, xã Ngọc Sơn',
      '8128527',
      3,
      'H',
      'Thạch Hà',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 24: Nâng cấp, mở rộng đường đê sông Hữu Nghèn đoạn từ cống Vọc S
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường đê sông Hữu Nghèn đoạn từ cống Vọc Sim đến thôn Đông Hà 2, xã Thạch Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8128531',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường đê sông Hữu Nghèn đoạn từ cống Vọc Sim đến thôn Đông Hà 2, xã Thạch Long',
      '8128531',
      3,
      'H',
      'Thạch Hà',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 25: Dãy nhà 02 tầng 06 phòng học bộ môn và các hạng mục phụ trợ 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dãy nhà 02 tầng 06 phòng học bộ môn và các hạng mục phụ trợ Trường THCS Hàm Nghi (điểm Thạch Xuân)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8127404',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Tâm')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dãy nhà 02 tầng 06 phòng học bộ môn và các hạng mục phụ trợ Trường THCS Hàm Nghi (điểm Thạch Xuân)',
      '8127404',
      3,
      'H',
      'Thạch Hà',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Tâm')
    );
  END IF;
END $$;

-- STT 26: Dãy nhà 02 tầng 10 phòng học bộ môn và các hạng mục phụ trợ 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dãy nhà 02 tầng 10 phòng học bộ môn và các hạng mục phụ trợ Trường THCS Hương Điền - Nam Hương, xã Nam Điền')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8128526',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Tâm')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dãy nhà 02 tầng 10 phòng học bộ môn và các hạng mục phụ trợ Trường THCS Hương Điền - Nam Hương, xã Nam Điền',
      '8128526',
      3,
      'H',
      'Thạch Hà',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Tâm')
    );
  END IF;
END $$;

-- STT 27: Dãy nhà học 02 tầng 06 Trường Mầm non Thạch Ngọc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dãy nhà học 02 tầng 06 Trường Mầm non Thạch Ngọc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8158498',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Tâm')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dãy nhà học 02 tầng 06 Trường Mầm non Thạch Ngọc',
      '8158498',
      3,
      'H',
      'Thạch Hà',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Tâm')
    );
  END IF;
END $$;

-- STT 28: Nâng cấp đường giao thông nông thôn xã Hương Long
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường giao thông nông thôn xã Hương Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8158237',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường giao thông nông thôn xã Hương Long',
      '8158237',
      3,
      'H',
      'Hương Khê',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 29: Nhà học bộ môn kết hợp phụ trợ, hỗ trợ học tập Trường Tiểu h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn kết hợp phụ trợ, hỗ trợ học tập Trường Tiểu học Hương Vĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096029',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn kết hợp phụ trợ, hỗ trợ học tập Trường Tiểu học Hương Vĩnh',
      '8096029',
      3,
      'H',
      'Hương Khê',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 30: Cầu Từ Văn và cầu Làng Mướp, xã Hòa Hải
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Từ Văn và cầu Làng Mướp, xã Hòa Hải')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080393',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Từ Văn và cầu Làng Mướp, xã Hòa Hải',
      '8080393',
      3,
      'H',
      'Hương Khê',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 31: Nhà học 02 tầng kết hợp phòng hành chính quản trị Trường Mầm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 02 tầng kết hợp phòng hành chính quản trị Trường Mầm non Hà Linh (điểm trường Truông Bát)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8053447',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 02 tầng kết hợp phòng hành chính quản trị Trường Mầm non Hà Linh (điểm trường Truông Bát)',
      '8053447',
      3,
      'H',
      'Hương Khê',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 32: Đường GTNT TX03 xã Điền Mỹ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT TX03 xã Điền Mỹ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080500',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT TX03 xã Điền Mỹ',
      '8080500',
      3,
      'H',
      'Hương Khê',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 33: Đường GTNT thôn 8 xã Hà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT thôn 8 xã Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080495',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 2,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT thôn 8 xã Hà Linh',
      '8080495',
      3,
      'H',
      'Hương Khê',
      '2140',
      2,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 34: Dự án Đường từ thị trấn Đức Thọ đến Khu lưu niệm Trần Phú, h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường từ thị trấn Đức Thọ đến Khu lưu niệm Trần Phú, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7941294',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường từ thị trấn Đức Thọ đến Khu lưu niệm Trần Phú, huyện Đức Thọ',
      '7941294',
      1,
      'T',
      'Đức Thọ',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 35: Dự án Cầu Bãi Thẹn nối huyện Đức Thọ và thị xã Hồng Lĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cầu Bãi Thẹn nối huyện Đức Thọ và thị xã Hồng Lĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8106611',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cầu Bãi Thẹn nối huyện Đức Thọ và thị xã Hồng Lĩnh',
      '8106611',
      1,
      'H',
      'Đức Thọ',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 36: Trường tiểu học Ân Phú; Hạng mục: xây dựng mới nhà đa chức n
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trường tiểu học Ân Phú; Hạng mục: xây dựng mới nhà đa chức năng 2 tầng, sửa chữa nhà học 2 tầng và các hạng mục phụ trợ khác')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8155800',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trường tiểu học Ân Phú; Hạng mục: xây dựng mới nhà đa chức năng 2 tầng, sửa chữa nhà học 2 tầng và các hạng mục phụ trợ khác',
      '8155800',
      1,
      'H',
      'Vũ Quang',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 37: Dự án Trồng mới, phục hồi và bảo vệ rừng ngập mặn ven biển ứ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Trồng mới, phục hồi và bảo vệ rừng ngập mặn ven biển ứng phó với biến đổi khí hậu tại các huyện: Nghi Xuân, Cẩm Xuyên và thị xã Kỳ Anh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7767755',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Trồng mới, phục hồi và bảo vệ rừng ngập mặn ven biển ứng phó với biến đổi khí hậu tại các huyện: Nghi Xuân, Cẩm Xuyên và thị xã Kỳ Anh',
      '7767755',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 38: Cải tạo, nâng cấp Hồ sinh thái Khu di tích Đồng Lộc (Giai đo
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, nâng cấp Hồ sinh thái Khu di tích Đồng Lộc (Giai đoạn 2)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7872498',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, nâng cấp Hồ sinh thái Khu di tích Đồng Lộc (Giai đoạn 2)',
      '7872498',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 39: Nâng cấp, cải tạo Bệnh viện đa khoa huyện Cẩm Xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo Bệnh viện đa khoa huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7946312',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo Bệnh viện đa khoa huyện Cẩm Xuyên',
      '7946312',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 40: Dự án đầu tư xây dựng nâng cấp, cải tạo và mua sắm trang thi
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án đầu tư xây dựng nâng cấp, cải tạo và mua sắm trang thiết bị cho 04 Bệnh viện đa khoa, Trung tâm y tế huyện huyện, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7993024',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án đầu tư xây dựng nâng cấp, cải tạo và mua sắm trang thiết bị cho 04 Bệnh viện đa khoa, Trung tâm y tế huyện huyện, tỉnh Hà Tĩnh',
      '7993024',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      5,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 41: Chương trình đầu tư phát triển mạng lưới y tế cơ sở vùng khó
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Chương trình đầu tư phát triển mạng lưới y tế cơ sở vùng khó khăn, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8028364',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Chương trình đầu tư phát triển mạng lưới y tế cơ sở vùng khó khăn, tỉnh Hà Tĩnh',
      '8028364',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 42: Dự án xây dựng, tôn tạo một số hạng mục tại Khu mộ Tổng Bí T
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án xây dựng, tôn tạo một số hạng mục tại Khu mộ Tổng Bí Thư Trần Phú')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8155076',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Bình')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án xây dựng, tôn tạo một số hạng mục tại Khu mộ Tổng Bí Thư Trần Phú',
      '8155076',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Bình')
    );
  END IF;
END $$;

-- STT 43: Dự án xây dựng, cải tạo hạ tầng kỹ thuật và một số hạng mục 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án xây dựng, cải tạo hạ tầng kỹ thuật và một số hạng mục tại Khu lưu niệm Tổng Bí Thư Trần Phú')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8160730',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Bình')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án xây dựng, cải tạo hạ tầng kỹ thuật và một số hạng mục tại Khu lưu niệm Tổng Bí Thư Trần Phú',
      '8160730',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Bình')
    );
  END IF;
END $$;

-- STT 44: Dự án xây dựng, tôn tạo một số hạng mục tại Khu mộ Tổng Bí T
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án xây dựng, tôn tạo một số hạng mục tại Khu mộ Tổng Bí Thư Hà Huy Tập')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8155078',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Bình')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án xây dựng, tôn tạo một số hạng mục tại Khu mộ Tổng Bí Thư Hà Huy Tập',
      '8155078',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Bình')
    );
  END IF;
END $$;

-- STT 45: Dự án xây dựng, cải tạo hạ tầng kỹ thuật và một số hạng mục 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án xây dựng, cải tạo hạ tầng kỹ thuật và một số hạng mục tại Khu lưu niệm Tổng Bí Thư Hà Huy Tập')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8160731',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Bình')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án xây dựng, cải tạo hạ tầng kỹ thuật và một số hạng mục tại Khu lưu niệm Tổng Bí Thư Hà Huy Tập',
      '8160731',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Bình')
    );
  END IF;
END $$;

-- STT 46: Tôn tạo Nhà lưu niệm, Nhà tưởng niệm, Nhà tranh tại khu lưu 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Tôn tạo Nhà lưu niệm, Nhà tưởng niệm, Nhà tranh tại khu lưu niệm Tổng Bí thư Hà HUy Tập')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8155077',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Bình')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Tôn tạo Nhà lưu niệm, Nhà tưởng niệm, Nhà tranh tại khu lưu niệm Tổng Bí thư Hà HUy Tập',
      '8155077',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Bình')
    );
  END IF;
END $$;

-- STT 47: Xây dựng Nhà lưu niệm, Nhà tưởng niệm tại khu lưu niệm Tổng 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng Nhà lưu niệm, Nhà tưởng niệm tại khu lưu niệm Tổng Bí thư Trần Phú')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8155075',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Bình')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng Nhà lưu niệm, Nhà tưởng niệm tại khu lưu niệm Tổng Bí thư Trần Phú',
      '8155075',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Bình')
    );
  END IF;
END $$;

-- STT 48: Xây dựng Trường phổ thông nội trú liên cấp Tiểu học và THCS 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng Trường phổ thông nội trú liên cấp Tiểu học và THCS Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8173864',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'DDHT',
      transfer_decision     = NULL,
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng Trường phổ thông nội trú liên cấp Tiểu học và THCS Hương Khê',
      '8173864',
      1,
      'T',
      'DDHT',
      NULL,
      3,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 49: Xây dựng Trường phổ thông nội trú liên cấp Tiểu học và THCS 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng Trường phổ thông nội trú liên cấp Tiểu học và THCS Sơn Kim 1')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8173865',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'DDHT',
      transfer_decision     = NULL,
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng Trường phổ thông nội trú liên cấp Tiểu học và THCS Sơn Kim 1',
      '8173865',
      1,
      'T',
      'DDHT',
      NULL,
      3,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 50: Hệ thống điện chiếu sáng KDL Thiên Cầm đoạn Quốc lộ 15B (từ 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống điện chiếu sáng KDL Thiên Cầm đoạn Quốc lộ 15B (từ Km44+950 đến Km52+120) và hệ thống đèn trang trí cầu Cửa Nhượng, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096165',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống điện chiếu sáng KDL Thiên Cầm đoạn Quốc lộ 15B (từ Km44+950 đến Km52+120) và hệ thống đèn trang trí cầu Cửa Nhượng, huyện Cẩm Xuyên',
      '8096165',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 51: Đường nối đường gom QL15B đi cụm công nghiệp Cẩm Nhượng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường nối đường gom QL15B đi cụm công nghiệp Cẩm Nhượng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8131256',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường nối đường gom QL15B đi cụm công nghiệp Cẩm Nhượng',
      '8131256',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 52: Nâng cấp, mở rộng tuyến đường Cẩm Thạch - Thạch Hội, huyện C
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng tuyến đường Cẩm Thạch - Thạch Hội, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7941955',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng tuyến đường Cẩm Thạch - Thạch Hội, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '7941955',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 53: Hạ tầng khu du lịch Nam Thiên Cầm, huyện Cẩm Xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng khu du lịch Nam Thiên Cầm, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7941956',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng khu du lịch Nam Thiên Cầm, huyện Cẩm Xuyên',
      '7941956',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 54: Hoàn thiện hạ tầng kỹ thuật Cụm công nghiệp - Tiểu thủ công 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hoàn thiện hạ tầng kỹ thuật Cụm công nghiệp - Tiểu thủ công nghiệp Bắc Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7936770',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hoàn thiện hạ tầng kỹ thuật Cụm công nghiệp - Tiểu thủ công nghiệp Bắc Cẩm Xuyên',
      '7936770',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 55: Đường trục xã TX.05 xã Cẩm Thành
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường trục xã TX.05 xã Cẩm Thành')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8067233',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường trục xã TX.05 xã Cẩm Thành',
      '8067233',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 56: Đường Phạm Lê Đức, thị trấn Cẩm Xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường Phạm Lê Đức, thị trấn Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7972205',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường Phạm Lê Đức, thị trấn Cẩm Xuyên',
      '7972205',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 57: Đường Cẩm Sơn đi Cẩm Thịnh (Đường tránh lũ)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường Cẩm Sơn đi Cẩm Thịnh (Đường tránh lũ)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7972202',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường Cẩm Sơn đi Cẩm Thịnh (Đường tránh lũ)',
      '7972202',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 58: Đường giao thông liên xã Khánh Vĩnh Yên - Thanh Lộc, huyện C
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên xã Khánh Vĩnh Yên - Thanh Lộc, huyện Can Lộc đi thị xã Hồng Lĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8042041',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên xã Khánh Vĩnh Yên - Thanh Lộc, huyện Can Lộc đi thị xã Hồng Lĩnh',
      '8042041',
      2,
      'T',
      'Can Lộc',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 59: Xây dựng nhà học 4 tầng trường THPT Đồng Lộc, huyện Can Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng nhà học 4 tầng trường THPT Đồng Lộc, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080684',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng nhà học 4 tầng trường THPT Đồng Lộc, huyện Can Lộc',
      '8080684',
      2,
      'H',
      'Can Lộc',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 60: Xây dựng hạ tầng khuôn viên trụ sở xã Kim Song Trường
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng hạ tầng khuôn viên trụ sở xã Kim Song Trường')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8105294',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng hạ tầng khuôn viên trụ sở xã Kim Song Trường',
      '8105294',
      2,
      'H',
      'Can Lộc',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 61: Dự án Hạ tầng cơ bản cho phát triển toàn diện tỉnh Hà Tĩnh t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Hạ tầng cơ bản cho phát triển toàn diện tỉnh Hà Tĩnh thuộc Dự án BIIG2')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7544621',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Hạ tầng cơ bản cho phát triển toàn diện tỉnh Hà Tĩnh thuộc Dự án BIIG2',
      '7544621',
      2,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 62: Đầu tư xây dựng trường nghề chất lượng cao, trường cao đẳng 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đầu tư xây dựng trường nghề chất lượng cao, trường cao đẳng nghề Việt Đức Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7942217',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đầu tư xây dựng trường nghề chất lượng cao, trường cao đẳng nghề Việt Đức Hà Tĩnh',
      '7942217',
      2,
      'T',
      'Dân dụng',
      'DDCN',
      3,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 63: Xử lý cấp bách đê Hữu Phủ, huyện Thạch Hà, đoạn từ K10+00 đế
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xử lý cấp bách đê Hữu Phủ, huyện Thạch Hà, đoạn từ K10+00 đến K15+315')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7868256',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2013',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xử lý cấp bách đê Hữu Phủ, huyện Thạch Hà, đoạn từ K10+00 đến K15+315',
      '7868256',
      3,
      'T',
      'Thạch Hà',
      '2013',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 64: Đường trục ngang ven biển huyện Thạch Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường trục ngang ven biển huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7936829',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường trục ngang ven biển huyện Thạch Hà',
      '7936829',
      3,
      'T',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 65: Hạ tầng ngoài hàng rào cụm công nghiệp Thạch Bằng, huyện Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng ngoài hàng rào cụm công nghiệp Thạch Bằng, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7935525',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng ngoài hàng rào cụm công nghiệp Thạch Bằng, huyện Lộc Hà',
      '7935525',
      3,
      'T',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 66: Hạ tầng khu du lịch biển huyện Lộc Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng khu du lịch biển huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7602235',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng khu du lịch biển huyện Lộc Hà',
      '7602235',
      3,
      'T',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 67: Xử lý cấp bách đê tả nghèn huyện Lộc Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xử lý cấp bách đê tả nghèn huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7853227',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xử lý cấp bách đê tả nghèn huyện Lộc Hà',
      '7853227',
      3,
      'T',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 68: Đê tả nghèn huyện Lộc Hà đoạn qua chùa Phổ độ nối với tỉnh l
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đê tả nghèn huyện Lộc Hà đoạn qua chùa Phổ độ nối với tỉnh lộ 9')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7933742',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đê tả nghèn huyện Lộc Hà đoạn qua chùa Phổ độ nối với tỉnh lộ 9',
      '7933742',
      3,
      'T',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 69: Đường cứu hộ cứu nạn cho Nhân dân các xã ven biển huyện Lộc 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường cứu hộ cứu nạn cho Nhân dân các xã ven biển huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7275750',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường cứu hộ cứu nạn cho Nhân dân các xã ven biển huyện Lộc Hà',
      '7275750',
      3,
      'T',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 70: Tiểu dự án cải thiện cơ sở hạ tầng đô thị Thạch Hà, huyện Th
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Tiểu dự án cải thiện cơ sở hạ tầng đô thị Thạch Hà, huyện Thạch Hà, tỉnh Hà Tĩnh. Thuộc dự án Cải thiện cơ sở hạ tầng đô thị nhằm giảm thiểu tác động của biến đổi khí hậu cho 04 tỉnh ven biển Bắc Trung Bộ.')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7786649',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Tiểu dự án cải thiện cơ sở hạ tầng đô thị Thạch Hà, huyện Thạch Hà, tỉnh Hà Tĩnh. Thuộc dự án Cải thiện cơ sở hạ tầng đô thị nhằm giảm thiểu tác động của biến đổi khí hậu cho 04 tỉnh ven biển Bắc Trung Bộ.',
      '7786649',
      3,
      'T',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 71: Quảng trường biển Cửa Sót, huyện Lộc Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quảng trường biển Cửa Sót, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8039671',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quảng trường biển Cửa Sót, huyện Lộc Hà',
      '8039671',
      3,
      'T',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 72: Tu bổ tôn tạo di tích lịch sử văn hóa Đền thờ Mai Hắc Đế, xâ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Tu bổ tôn tạo di tích lịch sử văn hóa Đền thờ Mai Hắc Đế, xây dựng Tượng đài và Quảng trường Mai Hắc Đế')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7555797',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Tu bổ tôn tạo di tích lịch sử văn hóa Đền thờ Mai Hắc Đế, xây dựng Tượng đài và Quảng trường Mai Hắc Đế',
      '7555797',
      3,
      'T',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 73: Đường giao thông nội vùng khu trung tâm hành chính huyện Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nội vùng khu trung tâm hành chính huyện Lộc Hà (giai đoạn 5)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8086818',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nội vùng khu trung tâm hành chính huyện Lộc Hà (giai đoạn 5)',
      '8086818',
      3,
      'H',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 74: Dự án Nâng cấp Kênh tiêu cầu Trung Nghĩa, thị trấn Lộc Hà, h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nâng cấp Kênh tiêu cầu Trung Nghĩa, thị trấn Lộc Hà, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8119947',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nâng cấp Kênh tiêu cầu Trung Nghĩa, thị trấn Lộc Hà, huyện Lộc Hà',
      '8119947',
      3,
      'H',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 75: Đường giao thông từ Quốc lộ 15B, xã Việt Tiến đến đường Thượ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ Quốc lộ 15B, xã Việt Tiến đến đường Thượng Ngọc, xã Thạch Ngọc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7966346',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ Quốc lộ 15B, xã Việt Tiến đến đường Thượng Ngọc, xã Thạch Ngọc',
      '7966346',
      3,
      'H',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 76: Dãy nhà 03 tầng 06 phòng học bộ môn và các hạng mục phụ trợ 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dãy nhà 03 tầng 06 phòng học bộ môn và các hạng mục phụ trợ Trường THCS Nguyễn Thiếp')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8128529',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Tâm')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dãy nhà 03 tầng 06 phòng học bộ môn và các hạng mục phụ trợ Trường THCS Nguyễn Thiếp',
      '8128529',
      3,
      'H',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Tâm')
    );
  END IF;
END $$;

-- STT 77: Đường giao thông tổ 9, thị trấn Thạch Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông tổ 9, thị trấn Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7973345',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông tổ 9, thị trấn Thạch Hà',
      '7973345',
      3,
      'H',
      'Thạch Hà',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 78: Đường giao thông từ đường Hồ Chí Minh vào Cụm công nghiệp Gi
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ đường Hồ Chí Minh vào Cụm công nghiệp Gia Phố (Giai đoạn 1)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8075141',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ đường Hồ Chí Minh vào Cụm công nghiệp Gia Phố (Giai đoạn 1)',
      '8075141',
      3,
      'T',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 79: Dự án cải thiện cơ sở hạ tầng đô thị Hương Khê, huyện Hương 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án cải thiện cơ sở hạ tầng đô thị Hương Khê, huyện Hương Khê (AFD)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7853204',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án cải thiện cơ sở hạ tầng đô thị Hương Khê, huyện Hương Khê (AFD)',
      '7853204',
      3,
      'T',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 80: Đường giao thông từ đường Hồ Chí Minh vào khu vực biên giới 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ đường Hồ Chí Minh vào khu vực biên giới xã Hòa Hải, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7935693',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ đường Hồ Chí Minh vào khu vực biên giới xã Hòa Hải, huyện Hương Khê',
      '7935693',
      3,
      'T',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 81: Đường giao thông bảo vệ an ninh biên giới, kết hợp bảo vệ ph
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông bảo vệ an ninh biên giới, kết hợp bảo vệ phát triển thác Vũ Môn và phát triển vùng, huyện Hương Khê (giai đoạn 1)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7947023',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông bảo vệ an ninh biên giới, kết hợp bảo vệ phát triển thác Vũ Môn và phát triển vùng, huyện Hương Khê (giai đoạn 1)',
      '7947023',
      3,
      'T',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 82: Đường giao thông nối đường Huyện lộ 2 (ĐH.87) đi đường Hồ Ch
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nối đường Huyện lộ 2 (ĐH.87) đi đường Hồ Chí Minh, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999325',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nối đường Huyện lộ 2 (ĐH.87) đi đường Hồ Chí Minh, huyện Hương Khê',
      '7999325',
      3,
      'H',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 83: Khối phòng học tập kết hợp hỗ trợ học tập Trường Tiểu học Hư
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng học tập kết hợp hỗ trợ học tập Trường Tiểu học Hương Trà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096030',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng học tập kết hợp hỗ trợ học tập Trường Tiểu học Hương Trà',
      '8096030',
      3,
      'H',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 84: Đường GTNT xã Hương Trà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xã Hương Trà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080492',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xã Hương Trà',
      '8080492',
      3,
      'H',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 85: Đường GTNT xã Hương Long (tuyến đường đi thôn 7, 8 và tuyến 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xã Hương Long (tuyến đường đi thôn 7, 8 và tuyến đường trục TX01 đoạn từ huyện lộ 6 đi huyện lộ 8)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8053446',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xã Hương Long (tuyến đường đi thôn 7, 8 và tuyến đường trục TX01 đoạn từ huyện lộ 6 đi huyện lộ 8)',
      '8053446',
      3,
      'H',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 86: Nâng cấp đường giao thông trục chính xã Phú Phong
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường giao thông trục chính xã Phú Phong')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080489',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường giao thông trục chính xã Phú Phong',
      '8080489',
      3,
      'H',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 87: Đường giao thông tránh lũ kết hợp vào khu xử lý chất thải rắ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông tránh lũ kết hợp vào khu xử lý chất thải rắn huyện Hương Khê tại thôn 2, xã Hương Thủy')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7959538',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông tránh lũ kết hợp vào khu xử lý chất thải rắn huyện Hương Khê tại thôn 2, xã Hương Thủy',
      '7959538',
      3,
      'H',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 88: Nâng cấp đường giao thông Huyện lộ 92 (ĐH92) đoạn từ xã Hươn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường giao thông Huyện lộ 92 (ĐH92) đoạn từ xã Hương Thủy đi xã Hương Giang, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7944311',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 3,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường giao thông Huyện lộ 92 (ĐH92) đoạn từ xã Hương Thủy đi xã Hương Giang, huyện Hương Khê',
      '7944311',
      3,
      'H',
      'Hương Khê',
      '2140',
      3,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 89: Dự án Đường giao thông nội vùng xã Đức Dũng, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông nội vùng xã Đức Dũng, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7742342',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông nội vùng xã Đức Dũng, huyện Đức Thọ',
      '7742342',
      1,
      'T',
      'Đức Thọ',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 90: Dự án đầu tư xây dựng Sàn giao dịch việc làm tại Thành phố H
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án đầu tư xây dựng Sàn giao dịch việc làm tại Thành phố Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025847',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án đầu tư xây dựng Sàn giao dịch việc làm tại Thành phố Hà Tĩnh',
      '8025847',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      4,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 91: Dự án nguồn nước tổng hợp và phát triển đô thị trong mối liê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án nguồn nước tổng hợp và phát triển đô thị trong mối liên hệ biến đổi khí hậu tại tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7333066',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án nguồn nước tổng hợp và phát triển đô thị trong mối liên hệ biến đổi khí hậu tại tỉnh Hà Tĩnh',
      '7333066',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      4,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 92: Trụ sở làm việc Trạm kiểm dịch động vật nội địa
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trụ sở làm việc Trạm kiểm dịch động vật nội địa')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7763646',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trụ sở làm việc Trạm kiểm dịch động vật nội địa',
      '7763646',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      4,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 93: Đường và cầu nối hai phía Nam - Bắc khu du lịch Thiên Cầm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường và cầu nối hai phía Nam - Bắc khu du lịch Thiên Cầm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8132633',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường và cầu nối hai phía Nam - Bắc khu du lịch Thiên Cầm',
      '8132633',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 94: Nhà học bộ môn 2 tầng 10 phòng Trường THCS Sơn Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 2 tầng 10 phòng Trường THCS Sơn Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8115971',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 2 tầng 10 phòng Trường THCS Sơn Hà',
      '8115971',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 95: Đường giao thông trục xã Cẩm Quan
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông trục xã Cẩm Quan')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8059684',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông trục xã Cẩm Quan',
      '8059684',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 96: Nâng cấp, mở rộng đường trục chính xã Thuần Thiện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường trục chính xã Thuần Thiện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7773469',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường trục chính xã Thuần Thiện',
      '7773469',
      2,
      'T',
      'Can Lộc',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 97: Đê tả nghèn đoạn từ K0 - K4+064,17
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đê tả nghèn đoạn từ K0 - K4+064,17')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7283149',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đê tả nghèn đoạn từ K0 - K4+064,17',
      '7283149',
      2,
      'T',
      'Can Lộc',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 98: Đường tữ xã Trường Lộc và trung tâm xã miền núi Gia Hanh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường tữ xã Trường Lộc và trung tâm xã miền núi Gia Hanh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7307545',
      management_board      = 2,
      decision_level_before_handover = '#N/A',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường tữ xã Trường Lộc và trung tâm xã miền núi Gia Hanh',
      '7307545',
      2,
      '#N/A',
      'Can Lộc',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 99: Tu bổ, tôn tạo di tích đền thờ Phan Kính xã Song Lộc, huyện 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Tu bổ, tôn tạo di tích đền thờ Phan Kính xã Song Lộc, huyện Can Lộc, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7428304',
      management_board      = 2,
      decision_level_before_handover = '#N/A',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Tu bổ, tôn tạo di tích đền thờ Phan Kính xã Song Lộc, huyện Can Lộc, tỉnh Hà Tĩnh',
      '7428304',
      2,
      '#N/A',
      'Can Lộc',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 100: Hạ tầng kỹ thuật Cụm công nghiệp Yên Huy, huyện Can Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng kỹ thuật Cụm công nghiệp Yên Huy, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7548060',
      management_board      = 2,
      decision_level_before_handover = '#N/A',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng kỹ thuật Cụm công nghiệp Yên Huy, huyện Can Lộc',
      '7548060',
      2,
      '#N/A',
      'Can Lộc',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 101: Đường giao thông nông thôn xã Phú Lộc, huyện Can Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nông thôn xã Phú Lộc, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7793572',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nông thôn xã Phú Lộc, huyện Can Lộc',
      '7793572',
      2,
      'H',
      'Can Lộc',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 102: Đường giao thông huyện lộ ĐH.116, đoạn Mai Phụ - Ích hậu, hu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông huyện lộ ĐH.116, đoạn Mai Phụ - Ích hậu, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8022195',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông huyện lộ ĐH.116, đoạn Mai Phụ - Ích hậu, huyện Lộc Hà',
      '8022195',
      3,
      'T',
      'Thạch Hà',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 103: Nâng cấp, mở rộng đường giao thông liên xã Thạch Ngọc -Ngọc 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường giao thông liên xã Thạch Ngọc -Ngọc Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8091397',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường giao thông liên xã Thạch Ngọc -Ngọc Sơn',
      '8091397',
      3,
      'H',
      'Thạch Hà',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 104: Nhà học 03 tầng 15 phòng Trường Tiểu học 2 thị trấn Thạch Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 03 tầng 15 phòng Trường Tiểu học 2 thị trấn Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8093847',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 03 tầng 15 phòng Trường Tiểu học 2 thị trấn Thạch Hà',
      '8093847',
      3,
      'H',
      'Thạch Hà',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 105: Đường giao thông trục chính Lưu Vĩnh Sơn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông trục chính Lưu Vĩnh Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7957184',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông trục chính Lưu Vĩnh Sơn',
      '7957184',
      3,
      'H',
      'Thạch Hà',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 106: Đường giao thông từ đường ĐT,550 tại xã Ngọc Sơn đến xã Thạc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ đường ĐT,550 tại xã Ngọc Sơn đến xã Thạch Ngọc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8074704',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ đường ĐT,550 tại xã Ngọc Sơn đến xã Thạch Ngọc',
      '8074704',
      3,
      'H',
      'Thạch Hà',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 107: Nâng cấp đường trục thôn 04 xã Thạch Sơn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường trục thôn 04 xã Thạch Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8112824',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường trục thôn 04 xã Thạch Sơn',
      '8112824',
      3,
      'H',
      'Thạch Hà',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 108: Chăm sóc, duy trì và trồng mới cây xanh đô thị huyện Lộc Hà 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Chăm sóc, duy trì và trồng mới cây xanh đô thị huyện Lộc Hà năm 2020')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7862796',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Chăm sóc, duy trì và trồng mới cây xanh đô thị huyện Lộc Hà năm 2020',
      '7862796',
      3,
      'H',
      'Thạch Hà',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 109: Chăm sóc, duy trì và trồng mới cây xanh đô thị huyện Lộc Hà 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Chăm sóc, duy trì và trồng mới cây xanh đô thị huyện Lộc Hà năm 2021')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7898773',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Chăm sóc, duy trì và trồng mới cây xanh đô thị huyện Lộc Hà năm 2021',
      '7898773',
      3,
      'H',
      'Thạch Hà',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 110: Mạng lưới cấp nước sinh hoạt xã Thạch Khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Mạng lưới cấp nước sinh hoạt xã Thạch Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8022919',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Mạng lưới cấp nước sinh hoạt xã Thạch Khê',
      '8022919',
      3,
      'H',
      'Thạch Hà',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 111: Đường GTNT xã Phúc Đồng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xã Phúc Đồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080483',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xã Phúc Đồng',
      '8080483',
      3,
      'H',
      'Hương Khê',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 112: Tiểu hợp phần 2 thuộc Hợp phần BT GPMB TĐC công trình hệ thố
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Tiểu hợp phần 2 thuộc Hợp phần BT GPMB TĐC công trình hệ thống thủy lợi ngàn trươi Cẩm Trang (Tên cũ: Xây dựng nghĩa địa tại thị trấn Vũ Quang)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7130423',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Tiểu hợp phần 2 thuộc Hợp phần BT GPMB TĐC công trình hệ thống thủy lợi ngàn trươi Cẩm Trang (Tên cũ: Xây dựng nghĩa địa tại thị trấn Vũ Quang)',
      '7130423',
      1,
      'T',
      'Vũ Quang',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 113: Dự án Kè chống sạt lở bờ hữu sông Ngàn Sâu đoạn qua xã Đức Đ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Kè chống sạt lở bờ hữu sông Ngàn Sâu đoạn qua xã Đức Đồng - Đức Lạc, huyện Đức Thọ, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7778248',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Kè chống sạt lở bờ hữu sông Ngàn Sâu đoạn qua xã Đức Đồng - Đức Lạc, huyện Đức Thọ, tỉnh Hà Tĩnh',
      '7778248',
      1,
      'T',
      'Đức Thọ',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 114: Dự án Kè bờ tả sông La đoạn qua xã Trường Sơn - Liên Minh, h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Kè bờ tả sông La đoạn qua xã Trường Sơn - Liên Minh, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7010912',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Kè bờ tả sông La đoạn qua xã Trường Sơn - Liên Minh, huyện Đức Thọ',
      '7010912',
      1,
      'T',
      'Đức Thọ',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 115: Cầu Hốp Chuối, thị trấn Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Hốp Chuối, thị trấn Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7959984',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Hốp Chuối, thị trấn Vũ Quang',
      '7959984',
      1,
      'T',
      'Vũ Quang',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 116: Hạ tầng kỹ thuật Cụm CN-TTCN tập trung huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng kỹ thuật Cụm CN-TTCN tập trung huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7321480',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng kỹ thuật Cụm CN-TTCN tập trung huyện Vũ Quang',
      '7321480',
      1,
      'H',
      'Vũ Quang',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 117: Đường vào trung tâm các xã Ân Phú, Đức Giang kết hợp cứu hộ,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường vào trung tâm các xã Ân Phú, Đức Giang kết hợp cứu hộ, cứu nạn trong mùa mưa lũ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7269749',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường vào trung tâm các xã Ân Phú, Đức Giang kết hợp cứu hộ, cứu nạn trong mùa mưa lũ',
      '7269749',
      1,
      'H',
      'Vũ Quang',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 118: Trung tâm y tế huyện Kỳ Anh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trung tâm y tế huyện Kỳ Anh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7535585',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trung tâm y tế huyện Kỳ Anh',
      '7535585',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      5,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 119: Tu bổ, tôn tạo các di tích gốc và xây dựng cơ sở hạ tầng Khu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Tu bổ, tôn tạo các di tích gốc và xây dựng cơ sở hạ tầng Khu di tích quốc gia đặc biệt Đại thi hào Nguyễn Du, tỉnh Hà Tĩnh (giai đoạn 1)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7632186',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Tu bổ, tôn tạo các di tích gốc và xây dựng cơ sở hạ tầng Khu di tích quốc gia đặc biệt Đại thi hào Nguyễn Du, tỉnh Hà Tĩnh (giai đoạn 1)',
      '7632186',
      2,
      'T',
      'Dân dụng',
      'DDCN',
      5,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 120: Dự án cấp điện nông thôn từ lưới điện quốc gia tỉnh Hà Tĩnh 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án cấp điện nông thôn từ lưới điện quốc gia tỉnh Hà Tĩnh GĐ 2018-2020')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7768841',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án cấp điện nông thôn từ lưới điện quốc gia tỉnh Hà Tĩnh GĐ 2018-2020',
      '7768841',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      5,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 121: Dự án cấp điện nông thôn từ lưới điện quốc gia, tỉnh Hà Tĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án cấp điện nông thôn từ lưới điện quốc gia, tỉnh Hà Tĩnh đã thực hiện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7013222',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án cấp điện nông thôn từ lưới điện quốc gia, tỉnh Hà Tĩnh đã thực hiện',
      '7013222',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      5,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 122: Bệnh viện Y học cổ truyền Hà Tĩnh (giai đoạn 2)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Bệnh viện Y học cổ truyền Hà Tĩnh (giai đoạn 2)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7942218',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Bệnh viện Y học cổ truyền Hà Tĩnh (giai đoạn 2)',
      '7942218',
      2,
      'T',
      'Dân dụng',
      'DDCN',
      5,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 123: Dự án Nhà học 05 tầng trường Trung cấp nghề Hà Tĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nhà học 05 tầng trường Trung cấp nghề Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7987973',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nhà học 05 tầng trường Trung cấp nghề Hà Tĩnh',
      '7987973',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      5,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 124: Mở rộng khuôn viên Trung tâm điều dưỡng người có công và Bảo
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Mở rộng khuôn viên Trung tâm điều dưỡng người có công và Bảo trợ xã hội tỉnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8017588',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Mở rộng khuôn viên Trung tâm điều dưỡng người có công và Bảo trợ xã hội tỉnh',
      '8017588',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      5,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 125: Cải tạo, nâng cấp một số cơ sở vật chất thiết yếu của UBND t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, nâng cấp một số cơ sở vật chất thiết yếu của UBND tỉnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8113556',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, nâng cấp một số cơ sở vật chất thiết yếu của UBND tỉnh',
      '8113556',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      5,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 126: Xây dựng Trung tâm hội nghị trực tuyến, TTTH dữ liệu, TTĐH t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng Trung tâm hội nghị trực tuyến, TTTH dữ liệu, TTĐH thông minh; nâng cấp sửa chữa Trung tâm Công báo-Tin học')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7946314',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng Trung tâm hội nghị trực tuyến, TTTH dữ liệu, TTĐH thông minh; nâng cấp sửa chữa Trung tâm Công báo-Tin học',
      '7946314',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      5,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 127: Chỉnh trang cây xanh Sân vận động huyện và tuyến đường trung
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Chỉnh trang cây xanh Sân vận động huyện và tuyến đường trung tâm thị trấn Đồng Lộc, huyện Can Lộc năm 2022')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7964395',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Chỉnh trang cây xanh Sân vận động huyện và tuyến đường trung tâm thị trấn Đồng Lộc, huyện Can Lộc năm 2022',
      '7964395',
      2,
      'H',
      'Can Lộc',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 128: Xây dựng trụ sở làm việc UBND huyện Cẩm Xuyên, tỉnh Hà Tĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trụ sở làm việc UBND huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7060459',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trụ sở làm việc UBND huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '7060459',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 129: Đường LX03 đoạn từ Thiên Cầm đến xã Cẩm Hòa, huyện Cẩm Xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường LX03 đoạn từ Thiên Cầm đến xã Cẩm Hòa, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7956688',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường LX03 đoạn từ Thiên Cầm đến xã Cẩm Hòa, huyện Cẩm Xuyên',
      '7956688',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 130: Sửa chữa, nâng cấp tuyến đường ĐH.132 Cẩm Hưng - Cẩm Lộc và 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, nâng cấp tuyến đường ĐH.132 Cẩm Hưng - Cẩm Lộc và các tuyến nhánh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7938940',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, nâng cấp tuyến đường ĐH.132 Cẩm Hưng - Cẩm Lộc và các tuyến nhánh',
      '7938940',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 131: Nhà học 2 tầng 10 phòng Trường Tiểu học Cẩm Hưng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng 10 phòng Trường Tiểu học Cẩm Hưng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8115975',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng 10 phòng Trường Tiểu học Cẩm Hưng',
      '8115975',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 132: Nhà hiệu bộ kết hợp nhà học 3 tầng trường trung học cơ sở Th
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hiệu bộ kết hợp nhà học 3 tầng trường trung học cơ sở Thiên Cầm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8129144',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hiệu bộ kết hợp nhà học 3 tầng trường trung học cơ sở Thiên Cầm',
      '8129144',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 133: Đường trục xã Cẩm Huy cũ (đoạn từ QL1A đi đường ĐH.131)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường trục xã Cẩm Huy cũ (đoạn từ QL1A đi đường ĐH.131)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7965115',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường trục xã Cẩm Huy cũ (đoạn từ QL1A đi đường ĐH.131)',
      '7965115',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 134: Nâng cấp đường trục xã từ trung tâm xã đi kênh N1, xã Cẩm Sơ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường trục xã từ trung tâm xã đi kênh N1, xã Cẩm Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7972204',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường trục xã từ trung tâm xã đi kênh N1, xã Cẩm Sơn',
      '7972204',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 135: Xây dựng trụ sở Công an xã Cẩm Duệ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trụ sở Công an xã Cẩm Duệ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7874264.1',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trụ sở Công an xã Cẩm Duệ',
      '7874264.1',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 136: Xây dựng trụ sở Công an xã Cẩm Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trụ sở Công an xã Cẩm Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7874264.2',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trụ sở Công an xã Cẩm Quang',
      '7874264.2',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 137: Nâng cấp, mở rộng  tuyến đường ĐH.36 (Chợ Đình – Quán Trại),
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng  tuyến đường ĐH.36 (Chợ Đình – Quán Trại), huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7986300',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng  tuyến đường ĐH.36 (Chợ Đình – Quán Trại), huyện Can Lộc',
      '7986300',
      2,
      'T',
      'Can Lộc',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 138: Nâng cấp, mở rộng đường Thị Sơn, huyện Can Lộc (giai đoạn 1)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường Thị Sơn, huyện Can Lộc (giai đoạn 1)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8081059',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường Thị Sơn, huyện Can Lộc (giai đoạn 1)',
      '8081059',
      2,
      'H',
      'Can Lộc',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 139: Nâng cấp, mở rộng đường Thiên An (tuyến nhánh 01), huyện Can
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường Thiên An (tuyến nhánh 01), huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8155086',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường Thiên An (tuyến nhánh 01), huyện Can Lộc',
      '8155086',
      2,
      'H',
      'Can Lộc',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 140: Xây dựng trụ sở làm việc xã Khánh Vĩnh Yên, huyện Can Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trụ sở làm việc xã Khánh Vĩnh Yên, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8055487',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trụ sở làm việc xã Khánh Vĩnh Yên, huyện Can Lộc',
      '8055487',
      2,
      'H',
      'Can Lộc',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 141: Xây dựng hạ tầng khuôn viên trụ sở Huyện ủy, CQCQ Huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng hạ tầng khuôn viên trụ sở Huyện ủy, CQCQ Huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7945812',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng hạ tầng khuôn viên trụ sở Huyện ủy, CQCQ Huyện',
      '7945812',
      2,
      'H',
      'Can Lộc',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 142: Hệ thống kết cấu hạ tầng kỹ thuật Cụm Công nghiệp - Tiểu thủ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống kết cấu hạ tầng kỹ thuật Cụm Công nghiệp - Tiểu thủ công nghiệp Bắc huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7053124',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2578',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống kết cấu hạ tầng kỹ thuật Cụm Công nghiệp - Tiểu thủ công nghiệp Bắc huyện Cẩm Xuyên',
      '7053124',
      2,
      'T',
      'Cẩm Xuyên',
      '2578',
      5,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 143: Xây dựng nhà học bộ môn 02 tầng, 10 phòng trường THCS Mỹ Châ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng nhà học bộ môn 02 tầng, 10 phòng trường THCS Mỹ Châu')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7997094',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng nhà học bộ môn 02 tầng, 10 phòng trường THCS Mỹ Châu',
      '7997094',
      3,
      'H',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 144: Quy hoạch chi tiết khu dân cư xã Phú Phong
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch chi tiết khu dân cư xã Phú Phong')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8021729',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch chi tiết khu dân cư xã Phú Phong',
      '8021729',
      3,
      'H',
      'Hương Khê',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 145: Quy hoạch chi tiết xây dựng cụm công nghiệp Gia Phố
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch chi tiết xây dựng cụm công nghiệp Gia Phố')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8021730',
      management_board      = 3,
      decision_level_before_handover = '#N/A',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch chi tiết xây dựng cụm công nghiệp Gia Phố',
      '8021730',
      3,
      '#N/A',
      'Hương Khê',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 146: Quy hoạch xây dựng vùng huyện Hương Khê đến năm 2040; tầm nh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch xây dựng vùng huyện Hương Khê đến năm 2040; tầm nhìn đến năm 2050')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8006463',
      management_board      = 3,
      decision_level_before_handover = '#N/A',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch xây dựng vùng huyện Hương Khê đến năm 2040; tầm nhìn đến năm 2050',
      '8006463',
      3,
      '#N/A',
      'Hương Khê',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 147: Đồ án Quy hoạch chung xây dựng đô thị Hương Khê, huyện Hương
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đồ án Quy hoạch chung xây dựng đô thị Hương Khê, huyện Hương Khê, tỉnh Hà Tĩnh, giai đoạn đến năm 2045')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7996627',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đồ án Quy hoạch chung xây dựng đô thị Hương Khê, huyện Hương Khê, tỉnh Hà Tĩnh, giai đoạn đến năm 2045',
      '7996627',
      3,
      'H',
      'Hương Khê',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 148: Đề án phân loại đô thị thị trấn Hương Khê mở rộng, huyện Hươ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đề án phân loại đô thị thị trấn Hương Khê mở rộng, huyện Hương Khê, tỉnh Hà Tĩnh đạt tiêu chí đô thị loại V')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '3034080',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đề án phân loại đô thị thị trấn Hương Khê mở rộng, huyện Hương Khê, tỉnh Hà Tĩnh đạt tiêu chí đô thị loại V',
      '3034080',
      3,
      'H',
      'Hương Khê',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 149: Chương trình phát triển đô thị thị trấn Hương Khê, huyện Hươ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Chương trình phát triển đô thị thị trấn Hương Khê, huyện Hương Khê, tỉnh Hà Tĩnh đến năm 2030')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = NULL,
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Chương trình phát triển đô thị thị trấn Hương Khê, huyện Hương Khê, tỉnh Hà Tĩnh đến năm 2030',
      NULL,
      3,
      'H',
      'Hương Khê',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 150: Hệ thống điện chiếu sáng khu vực Trung tâm hành chính huyện 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống điện chiếu sáng khu vực Trung tâm hành chính huyện Lộc Hà và cụm dân cư dọc đường Tỉnh lộ 9 (giai đoạn 2)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7457939',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống điện chiếu sáng khu vực Trung tâm hành chính huyện Lộc Hà và cụm dân cư dọc đường Tỉnh lộ 9 (giai đoạn 2)',
      '7457939',
      3,
      'T',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 151: Hạ tầng nuôi trồng thủy sản xã Mai Phụ và Hộ Độ, huyện Lộc H
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng nuôi trồng thủy sản xã Mai Phụ và Hộ Độ, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7642070',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng nuôi trồng thủy sản xã Mai Phụ và Hộ Độ, huyện Lộc Hà',
      '7642070',
      3,
      'T',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 152: Kè biển chống xâm thực huyện Lộc Hà đoạn từ K3+00 - K11+105 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Kè biển chống xâm thực huyện Lộc Hà đoạn từ K3+00 - K11+105 thuộc địa bàn xã Thạch Bằng và Thịnh Lộc huyện Lộc Hà, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7398566',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Kè biển chống xâm thực huyện Lộc Hà đoạn từ K3+00 - K11+105 thuộc địa bàn xã Thạch Bằng và Thịnh Lộc huyện Lộc Hà, tỉnh Hà Tĩnh',
      '7398566',
      3,
      'T',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 153: Củng cố, nâng cấp đê Tả nghèn huyện Lộc Hà đoạn k16+300 - k2
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Củng cố, nâng cấp đê Tả nghèn huyện Lộc Hà đoạn k16+300 - k26+00')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7145963',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Củng cố, nâng cấp đê Tả nghèn huyện Lộc Hà đoạn k16+300 - k26+00',
      '7145963',
      3,
      'T',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 154: Đường kết nối từ quốc lộ 8C vào khu thương mại, dịch vụ, du 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường kết nối từ quốc lộ 8C vào khu thương mại, dịch vụ, du lịch và thể thao phía Tây Nam huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = NULL,
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Tâm')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường kết nối từ quốc lộ 8C vào khu thương mại, dịch vụ, du lịch và thể thao phía Tây Nam huyện Thạch Hà',
      NULL,
      3,
      'H',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Tâm')
    );
  END IF;
END $$;

-- STT 155: Đường giao thông liên xã Mai Phụ - Hộ Độ (dự án thành phần 2
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên xã Mai Phụ - Hộ Độ (dự án thành phần 2)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8119946',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên xã Mai Phụ - Hộ Độ (dự án thành phần 2)',
      '8119946',
      3,
      'H',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 156: Nâng cấp, sửa chữa kênh tưới chính trạm bơm đầu cầu xã Hồng 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, sửa chữa kênh tưới chính trạm bơm đầu cầu xã Hồng Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8113066',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, sửa chữa kênh tưới chính trạm bơm đầu cầu xã Hồng Lộc',
      '8113066',
      3,
      'H',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 157: Dự án Xây dựng Nhà đa năng và các hạng mục phụ trợ Trường TH
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Xây dựng Nhà đa năng và các hạng mục phụ trợ Trường THCS Bình An Thịnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8113063',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Xây dựng Nhà đa năng và các hạng mục phụ trợ Trường THCS Bình An Thịnh',
      '8113063',
      3,
      'H',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 158: Nâng cấp tuyến đường từ nhà ông Dung - Chợ Chiều (từ thôn Tr
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp tuyến đường từ nhà ông Dung - Chợ Chiều (từ thôn Tri Khê đến thôn Vạn Đò) xã Thạch Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8128254',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đại')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp tuyến đường từ nhà ông Dung - Chợ Chiều (từ thôn Tri Khê đến thôn Vạn Đò) xã Thạch Sơn',
      '8128254',
      3,
      'H',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Đại')
    );
  END IF;
END $$;

-- STT 159: Nhà học 02 tầng 6 phòng Trường mầm non Việt Xuyên, xã Việt T
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 02 tầng 6 phòng Trường mầm non Việt Xuyên, xã Việt Tiến')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8095526',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 02 tầng 6 phòng Trường mầm non Việt Xuyên, xã Việt Tiến',
      '8095526',
      3,
      'H',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 160: Hạ tầng đấu giá đất khu vực trung tâm hành chính huyện Lộc H
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng đấu giá đất khu vực trung tâm hành chính huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7758813',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng đấu giá đất khu vực trung tâm hành chính huyện Lộc Hà',
      '7758813',
      3,
      'H',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 161: Xây dựng đường nội vùng khu trung tâm hành chính giai đoạn 3
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng đường nội vùng khu trung tâm hành chính giai đoạn 3')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7897531',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng đường nội vùng khu trung tâm hành chính giai đoạn 3',
      '7897531',
      3,
      'H',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 162: Xử lý sạt lở bờ sông Ngàn Sâu đoạn qua xã Lộc Yên, huyện Hươ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xử lý sạt lở bờ sông Ngàn Sâu đoạn qua xã Lộc Yên, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7859084',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xử lý sạt lở bờ sông Ngàn Sâu đoạn qua xã Lộc Yên, huyện Hương Khê',
      '7859084',
      3,
      'T',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 163: Xử lý ô nhiễm môi trường do rác thải sinh hoạt trên địa bàn 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xử lý ô nhiễm môi trường do rác thải sinh hoạt trên địa bàn huyện Hương Khê tại xã Hương Thuỷ, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7578674',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xử lý ô nhiễm môi trường do rác thải sinh hoạt trên địa bàn huyện Hương Khê tại xã Hương Thuỷ, huyện Hương Khê',
      '7578674',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 164: Nâng cấp đường GTNT xã Phúc Trạch (Tuyến đường trục xã TX01)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường GTNT xã Phúc Trạch (Tuyến đường trục xã TX01)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080491',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường GTNT xã Phúc Trạch (Tuyến đường trục xã TX01)',
      '8080491',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 165: Đường GTNT kết hợp phát triển kinh tế trang trại xã Hương Lo
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT kết hợp phát triển kinh tế trang trại xã Hương Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018893',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT kết hợp phát triển kinh tế trang trại xã Hương Long',
      '8018893',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 166: Nâng cấp đường giao thông nội thị, thị trấn Hương Khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường giao thông nội thị, thị trấn Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018895',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường giao thông nội thị, thị trấn Hương Khê',
      '8018895',
      3,
      'H',
      'Hương Khê',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 167: Đường GTNT thôn 6, 7 xã Hương Giang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT thôn 6, 7 xã Hương Giang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018894',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT thôn 6, 7 xã Hương Giang',
      '8018894',
      3,
      'H',
      'Hương Khê',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 168: Nhà học bộ môn 02 tầng trường Tiểu học Gia Phố
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 02 tầng trường Tiểu học Gia Phố')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096032',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 02 tầng trường Tiểu học Gia Phố',
      '8096032',
      3,
      'H',
      'Hương Khê',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 169: Khắc phục, sửa chữa công trình đập Hà Thông, xã Hương Xuân
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khắc phục, sửa chữa công trình đập Hà Thông, xã Hương Xuân')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8108811',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khắc phục, sửa chữa công trình đập Hà Thông, xã Hương Xuân',
      '8108811',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 170: Khối nhà hành chính quản trị kết hợp khối phụ trợ, hỗ trợ họ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối nhà hành chính quản trị kết hợp khối phụ trợ, hỗ trợ học tập trường tiểu học Hương Bình')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096031',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối nhà hành chính quản trị kết hợp khối phụ trợ, hỗ trợ học tập trường tiểu học Hương Bình',
      '8096031',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 171: Khối phòng học tập 03 tầng Trường Tiểu học Phúc Đồng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng học tập 03 tầng Trường Tiểu học Phúc Đồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096028',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng học tập 03 tầng Trường Tiểu học Phúc Đồng',
      '8096028',
      3,
      'H',
      'Hương Khê',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 172: Nâng cấp đường huyện lộ 9 (ĐH.94), huyện Hương Khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường huyện lộ 9 (ĐH.94), huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999327',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Đức')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường huyện lộ 9 (ĐH.94), huyện Hương Khê',
      '7999327',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Đức')
    );
  END IF;
END $$;

-- STT 173: Đường giao thông huyện lộ 11 (ĐH.96) đoạn qua xã Hương Đô, P
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông huyện lộ 11 (ĐH.96) đoạn qua xã Hương Đô, Phúc Trạch, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999326',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông huyện lộ 11 (ĐH.96) đoạn qua xã Hương Đô, Phúc Trạch, huyện Hương Khê',
      '7999326',
      3,
      'H',
      'Hương Khê',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 174: Nhà học 03 tầng 12 phòng và cải tạo 03 dãy nhà 2 tầng 10 phò
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 03 tầng 12 phòng và cải tạo 03 dãy nhà 2 tầng 10 phòng Trường THCS Chu Văn An')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7947546',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 03 tầng 12 phòng và cải tạo 03 dãy nhà 2 tầng 10 phòng Trường THCS Chu Văn An',
      '7947546',
      3,
      'H',
      'Hương Khê',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 175: Nhà học bộ môn 03 tầng Trường THCS Chu Văn An
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 03 tầng Trường THCS Chu Văn An')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7947545',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 03 tầng Trường THCS Chu Văn An',
      '7947545',
      3,
      'H',
      'Hương Khê',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 176: Sân vận động huyện tại xã Hương Long
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sân vận động huyện tại xã Hương Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999330',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sân vận động huyện tại xã Hương Long',
      '7999330',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 177: Công viên cây xanh kết hợp quảng trường trung tâm huyện Hươn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Công viên cây xanh kết hợp quảng trường trung tâm huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7916328',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Công viên cây xanh kết hợp quảng trường trung tâm huyện Hương Khê',
      '7916328',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 178: Nâng cấp, cải tạo nhà biểu diễn và một số hạng mục phụ trợ T
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo nhà biểu diễn và một số hạng mục phụ trợ Trung tâm Văn hóa-Truyền thông huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080485',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo nhà biểu diễn và một số hạng mục phụ trợ Trung tâm Văn hóa-Truyền thông huyện Hương Khê',
      '8080485',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 179: Nâng cấp, cải tạo Tiểu học, Mầm non Hương Thuỷ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo Tiểu học, Mầm non Hương Thuỷ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7921705',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo Tiểu học, Mầm non Hương Thuỷ',
      '7921705',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 180: Nâng cấp, tu sửa cầu Tu bổ 3, xã Hương Lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, tu sửa cầu Tu bổ 3, xã Hương Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8095708',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, tu sửa cầu Tu bổ 3, xã Hương Lâm',
      '8095708',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 181: Đường giao thông huyện lộ 3 (ĐH.88) đoạn qua xã Điền Mỹ, huy
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông huyện lộ 3 (ĐH.88) đoạn qua xã Điền Mỹ, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999328',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông huyện lộ 3 (ĐH.88) đoạn qua xã Điền Mỹ, huyện Hương Khê',
      '7999328',
      3,
      'H',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 182: Trồng cây xanh hạ tầng kỹ thuật trên tuyến đường Hồ Chí Minh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trồng cây xanh hạ tầng kỹ thuật trên tuyến đường Hồ Chí Minh và tuyến đường QL15 đoạn qua huyện Hương Khê năm 2021')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7913873',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 4,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trồng cây xanh hạ tầng kỹ thuật trên tuyến đường Hồ Chí Minh và tuyến đường QL15 đoạn qua huyện Hương Khê năm 2021',
      '7913873',
      3,
      'H',
      'Hương Khê',
      '2140',
      4,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 183: Đồ án Điều chỉnh QHCT Xây dựng công viên văn hóa Lý Tự Trọng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đồ án Điều chỉnh QHCT Xây dựng công viên văn hóa Lý Tự Trọng, tỷ lệ 1/500')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8158921',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đồ án Điều chỉnh QHCT Xây dựng công viên văn hóa Lý Tự Trọng, tỷ lệ 1/500',
      '8158921',
      3,
      'H',
      'Thạch Hà',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 184: Quy hoạch phân khu xây dựng Khu vực nút giao thông Quốc lộ 1
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch phân khu xây dựng Khu vực nút giao thông Quốc lộ 1 đoạn tránh thành phố Hà Tĩnh tại xã Thạch Long, huyện Thạch Hà, tỷ lệ 1/2.000')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '1100782',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch phân khu xây dựng Khu vực nút giao thông Quốc lộ 1 đoạn tránh thành phố Hà Tĩnh tại xã Thạch Long, huyện Thạch Hà, tỷ lệ 1/2.000',
      '1100782',
      3,
      'H',
      'Thạch Hà',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 185: Lập Quy hoạch sử dụng đất giai đoạn 2021-2030 huyện Thạch Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Lập Quy hoạch sử dụng đất giai đoạn 2021-2030 huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7899078',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Lập Quy hoạch sử dụng đất giai đoạn 2021-2030 huyện Thạch Hà',
      '7899078',
      3,
      'H',
      'Thạch Hà',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 186: Quy hoạch phân khu xây dựng khu du lịch biển huyện Lộc Hà; t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch phân khu xây dựng khu du lịch biển huyện Lộc Hà; tỷ lệ 1/2000')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8047759',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch phân khu xây dựng khu du lịch biển huyện Lộc Hà; tỷ lệ 1/2000',
      '8047759',
      3,
      'H',
      'Thạch Hà',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 187: Củng cố, nâng cấp Đê Tả Nghèn đoạn K26-K35+700 huyện Lộc Hà,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Củng cố, nâng cấp Đê Tả Nghèn đoạn K26-K35+700 huyện Lộc Hà, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = NULL,
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '3026',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Củng cố, nâng cấp Đê Tả Nghèn đoạn K26-K35+700 huyện Lộc Hà, tỉnh Hà Tĩnh',
      NULL,
      3,
      'T',
      'Thạch Hà',
      '3026',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 188: Nâng cấp mở rộng tuyến đường từ Thạch Kênh đến Hồng Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp mở rộng tuyến đường từ Thạch Kênh đến Hồng Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7799577',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp mở rộng tuyến đường từ Thạch Kênh đến Hồng Lộc',
      '7799577',
      3,
      'T',
      'Thạch Hà',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 189: Nhà công vụ tại xã Hương Trạch
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà công vụ tại xã Hương Trạch')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = NULL,
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '3026',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà công vụ tại xã Hương Trạch',
      NULL,
      3,
      'H',
      'Hương Khê',
      '3026',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 190: Cấp nước sạch Hương Khê tỉnh Hà Tĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cấp nước sạch Hương Khê tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7213959',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '3455',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cấp nước sạch Hương Khê tỉnh Hà Tĩnh',
      '7213959',
      3,
      'H',
      'Hương Khê',
      '3455',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 191: Dự án Nhà đa chức năng và các hạng mục phụ trợ Trường THPT N
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nhà đa chức năng và các hạng mục phụ trợ Trường THPT Nguyễn Thị Minh Khai, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8120248',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nhà đa chức năng và các hạng mục phụ trợ Trường THPT Nguyễn Thị Minh Khai, huyện Đức Thọ',
      '8120248',
      1,
      'T',
      'Đức Thọ',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 192: Nhà đa năng Trường tiểu học Quang Vĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa năng Trường tiểu học Quang Vĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8140327',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa năng Trường tiểu học Quang Vĩnh',
      '8140327',
      1,
      'H',
      'Đức Thọ',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 193: Đường giao thông từ Cầu Treo Chợ Bộng đến Thị trấn Vũ Quang,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ Cầu Treo Chợ Bộng đến Thị trấn Vũ Quang, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7003116',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ Cầu Treo Chợ Bộng đến Thị trấn Vũ Quang, huyện Vũ Quang',
      '7003116',
      1,
      'T',
      'Vũ Quang',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 194: Xây dựng nhà sinh hoạt cộng đồng kết hợp tránh lũ thôn 5 xã 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng nhà sinh hoạt cộng đồng kết hợp tránh lũ thôn 5 xã Ân Phú')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8154171',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng nhà sinh hoạt cộng đồng kết hợp tránh lũ thôn 5 xã Ân Phú',
      '8154171',
      1,
      'H',
      'Vũ Quang',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 195: Hạng mục phụ trợ khu xử lý rác thải của huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạng mục phụ trợ khu xử lý rác thải của huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8154170',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạng mục phụ trợ khu xử lý rác thải của huyện',
      '8154170',
      1,
      'H',
      'Vũ Quang',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 196: Nâng cấp đường tránh lũ Đức Lĩnh- Ân Giang- Đức Giang, huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường tránh lũ Đức Lĩnh- Ân Giang- Đức Giang, huyện Vũ quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8049087',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường tránh lũ Đức Lĩnh- Ân Giang- Đức Giang, huyện Vũ quang',
      '8049087',
      1,
      'H',
      'Vũ Quang',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 197: Nhà học bộ môn 02 tầng 8 phòng và các hạng mục phụ trợ trườn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 02 tầng 8 phòng và các hạng mục phụ trợ trường Tiểu học Đức Lĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8117230',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 02 tầng 8 phòng và các hạng mục phụ trợ trường Tiểu học Đức Lĩnh',
      '8117230',
      1,
      'H',
      'Vũ Quang',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 198: Xây dựng cầu Nạp Hốp Đức Liên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng cầu Nạp Hốp Đức Liên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8121502',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng cầu Nạp Hốp Đức Liên',
      '8121502',
      1,
      'H',
      'Vũ Quang',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 199: Nhà đa chức năng 02 tầng 6 phòng Trường Mầm non Đức Bồng, hu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa chức năng 02 tầng 6 phòng Trường Mầm non Đức Bồng, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = 'XHH1',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa chức năng 02 tầng 6 phòng Trường Mầm non Đức Bồng, huyện Vũ Quang',
      'XHH1',
      1,
      'H',
      'Vũ Quang',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 200: Chuẩn bị dự án hạ tầng cơ bản cho phát triển toàn diện tỉnh 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Chuẩn bị dự án hạ tầng cơ bản cho phát triển toàn diện tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7729914',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Chuẩn bị dự án hạ tầng cơ bản cho phát triển toàn diện tỉnh Hà Tĩnh',
      '7729914',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      6,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 201: Tư vấn khảo sát địa hình, lập điều chỉnh quy hoạch chung thị
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Tư vấn khảo sát địa hình, lập điều chỉnh quy hoạch chung thị trấn Vũ Quang, huyện Vũ Quang đến năm 2040 và lấy ý kiến cộng đồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8103928',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2977',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Tư vấn khảo sát địa hình, lập điều chỉnh quy hoạch chung thị trấn Vũ Quang, huyện Vũ Quang đến năm 2040 và lấy ý kiến cộng đồng',
      '8103928',
      1,
      'H',
      'Vũ Quang',
      '2977',
      6,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 202: Nâng cấp tuyến đường ĐH.131 Thạch Bình - Cẩm Thăng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp tuyến đường ĐH.131 Thạch Bình - Cẩm Thăng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7938719',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp tuyến đường ĐH.131 Thạch Bình - Cẩm Thăng',
      '7938719',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 203: Đường dọc bờ kè Sông Hội, thị trấn Cẩm Xuyên và các tuyến nh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường dọc bờ kè Sông Hội, thị trấn Cẩm Xuyên và các tuyến nhánh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7909582',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường dọc bờ kè Sông Hội, thị trấn Cẩm Xuyên và các tuyến nhánh',
      '7909582',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 204: Đường vành đai, thị trấn Cẩm Xuyên (đoạn từ QL8C-QL1A)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường vành đai, thị trấn Cẩm Xuyên (đoạn từ QL8C-QL1A)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7956306',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường vành đai, thị trấn Cẩm Xuyên (đoạn từ QL8C-QL1A)',
      '7956306',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 205: Nhà học chức năng 02 tầng Trường Mầm non Cẩm Quan
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học chức năng 02 tầng Trường Mầm non Cẩm Quan')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8064110',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học chức năng 02 tầng Trường Mầm non Cẩm Quan',
      '8064110',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 206: Nhà học bộ môn 03 tầng 9 phòng Trường THCS Cẩm Dương
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 03 tầng 9 phòng Trường THCS Cẩm Dương')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8062395',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 03 tầng 9 phòng Trường THCS Cẩm Dương',
      '8062395',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 207: Đường Xô Viết kéo dài thị trấn Nghèn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường Xô Viết kéo dài thị trấn Nghèn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7498862',
      management_board      = 2,
      decision_level_before_handover = '#N/A',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường Xô Viết kéo dài thị trấn Nghèn',
      '7498862',
      2,
      '#N/A',
      'Can Lộc',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 208: Xây dựng pano quảng cáo tại đường Nguyễn Huy Tự và cải tạo h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng pano quảng cáo tại đường Nguyễn Huy Tự và cải tạo hội trường lớn UBND huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8121078',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng pano quảng cáo tại đường Nguyễn Huy Tự và cải tạo hội trường lớn UBND huyện Can Lộc',
      '8121078',
      2,
      'H',
      'Can Lộc',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 209: Hệ thống cây xanh tuyến đường vào chùa Hương, xã Thiên Lộc, 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống cây xanh tuyến đường vào chùa Hương, xã Thiên Lộc, huyện Can Lộc (trồng bổ sung).')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8074220',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống cây xanh tuyến đường vào chùa Hương, xã Thiên Lộc, huyện Can Lộc (trồng bổ sung).',
      '8074220',
      2,
      'H',
      'Can Lộc',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 210: Chỉnh trang cây xanh khuôn viên UBND huyện Can Lộc.
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Chỉnh trang cây xanh khuôn viên UBND huyện Can Lộc.')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8120805',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Chỉnh trang cây xanh khuôn viên UBND huyện Can Lộc.',
      '8120805',
      2,
      'H',
      'Can Lộc',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 211: Xây dựng nhà chức năng 3 tầng và nhà đa năng Trường THCS Xuâ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng nhà chức năng 3 tầng và nhà đa năng Trường THCS Xuân Diệu, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8000730',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng nhà chức năng 3 tầng và nhà đa năng Trường THCS Xuân Diệu, huyện Can Lộc',
      '8000730',
      2,
      'H',
      'Can Lộc',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 212: Đường giao thông nông thôn xã mỹ Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nông thôn xã mỹ Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7900747',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nông thôn xã mỹ Lộc',
      '7900747',
      2,
      'H',
      'Can Lộc',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 213: Sửa chữa, nâng cấp Hệ thống thuỷ lợi Bà Nái huyện Can Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, nâng cấp Hệ thống thuỷ lợi Bà Nái huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7371219',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, nâng cấp Hệ thống thuỷ lợi Bà Nái huyện Can Lộc',
      '7371219',
      2,
      'T',
      'Can Lộc',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 214: Xây dựng bể bơi và các hạng mục phụ trợ trường THCS Phan Huy
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng bể bơi và các hạng mục phụ trợ trường THCS Phan Huy Chú')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8100176',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng bể bơi và các hạng mục phụ trợ trường THCS Phan Huy Chú',
      '8100176',
      3,
      'H',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 215: Hạ tầng đấu giá huyện Lộc Hà 2016
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng đấu giá huyện Lộc Hà 2016')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7603835',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng đấu giá huyện Lộc Hà 2016',
      '7603835',
      3,
      'H',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 216: Khối hành chính quản trị kết hợp phụ trợ học tập Trường THCS
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối hành chính quản trị kết hợp phụ trợ học tập Trường THCS Chu Văn An')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096034',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối hành chính quản trị kết hợp phụ trợ học tập Trường THCS Chu Văn An',
      '8096034',
      3,
      'H',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 217: Trung tâm văn hóa truyền thông huyện Lộc Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trung tâm văn hóa truyền thông huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7799576',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trung tâm văn hóa truyền thông huyện Lộc Hà',
      '7799576',
      3,
      'T',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 218: Trung tâm dạy nghề - hướng nghiệp và giáo dục thường xuyên h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trung tâm dạy nghề - hướng nghiệp và giáo dục thường xuyên huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7331691',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trung tâm dạy nghề - hướng nghiệp và giáo dục thường xuyên huyện Lộc Hà',
      '7331691',
      3,
      'T',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 219: Hồ chứa nước Khe Giao thuộc Hệ thống thủy lợi Khe Giao, huyệ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hồ chứa nước Khe Giao thuộc Hệ thống thủy lợi Khe Giao, huyện Thạch Hà, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7191688',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hồ chứa nước Khe Giao thuộc Hệ thống thủy lợi Khe Giao, huyện Thạch Hà, tỉnh Hà Tĩnh',
      '7191688',
      3,
      'T',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 220: Dự án Xây dựng nhà học 3 tầng 19 phòng và các hạng mục phụ t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Xây dựng nhà học 3 tầng 19 phòng và các hạng mục phụ trợ Trường tiểu học Thạch Kim')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8113064',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Xây dựng nhà học 3 tầng 19 phòng và các hạng mục phụ trợ Trường tiểu học Thạch Kim',
      '8113064',
      3,
      'H',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 221: Dự án Xây dựng kênh tưới, tiêu úng Khe Quả, Cồn Xóc xã Thịnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Xây dựng kênh tưới, tiêu úng Khe Quả, Cồn Xóc xã Thịnh Lộc, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8111569',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Xây dựng kênh tưới, tiêu úng Khe Quả, Cồn Xóc xã Thịnh Lộc, huyện Lộc Hà',
      '8111569',
      3,
      'H',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 222: Xây dựng hệ thống thoát nước thải xã Thạch Kim, huyện Lộc Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng hệ thống thoát nước thải xã Thạch Kim, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7892599',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng hệ thống thoát nước thải xã Thạch Kim, huyện Lộc Hà',
      '7892599',
      3,
      'H',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 223: Dự án Nâng cấp mở rộng đường giao thông liên xã Thạch Châu -
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nâng cấp mở rộng đường giao thông liên xã Thạch Châu - Thị trấn Lộc Hà, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8119945',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nâng cấp mở rộng đường giao thông liên xã Thạch Châu - Thị trấn Lộc Hà, huyện Lộc Hà',
      '8119945',
      3,
      'H',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 224: Xây dựng hệ thống kênh mương tưới, tiêu xã Ích Hậu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng hệ thống kênh mương tưới, tiêu xã Ích Hậu')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7908086',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng hệ thống kênh mương tưới, tiêu xã Ích Hậu',
      '7908086',
      3,
      'H',
      'Thạch Hà',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 225: Nhà máy nước và Hệ thống cấp nước sạch cho Nhân dân thị trấn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà máy nước và Hệ thống cấp nước sạch cho Nhân dân thị trấn Hương Khê và 8 xã vùng phụ cận thuộc huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7568910',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà máy nước và Hệ thống cấp nước sạch cho Nhân dân thị trấn Hương Khê và 8 xã vùng phụ cận thuộc huyện Hương Khê',
      '7568910',
      3,
      'T',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 226: Bảo tồn, nhân giống và phát triển bưởi Phúc Trạch, 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Bảo tồn, nhân giống và phát triển bưởi Phúc Trạch, giai đoạn 2016-2020, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7787922',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Bảo tồn, nhân giống và phát triển bưởi Phúc Trạch, giai đoạn 2016-2020, huyện Hương Khê',
      '7787922',
      3,
      'T',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 227: Khắc phục sạt lở bờ sông Ngàn Sâu đoạn qua thôn 2 và thôn 5 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khắc phục sạt lở bờ sông Ngàn Sâu đoạn qua thôn 2 và thôn 5 xã Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8078745',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khắc phục sạt lở bờ sông Ngàn Sâu đoạn qua thôn 2 và thôn 5 xã Hà Linh',
      '8078745',
      3,
      'T',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 228: Khắc phục sửa chữa đập Tắt xã Hòa Hải
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khắc phục sửa chữa đập Tắt xã Hòa Hải')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8078746',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khắc phục sửa chữa đập Tắt xã Hòa Hải',
      '8078746',
      3,
      'T',
      'Hương Khê',
      '2140',
      5,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 229: Kè chống sạt lở bờ sông Ngàn Sâu, đoạn qua xã Gia Phố, huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Kè chống sạt lở bờ sông Ngàn Sâu, đoạn qua xã Gia Phố, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7741572',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Kè chống sạt lở bờ sông Ngàn Sâu, đoạn qua xã Gia Phố, huyện Hương Khê',
      '7741572',
      3,
      'T',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 230: Xử lý sạt lở bờ sông Ngàn Sâu, đoạn qua các xã: Hương Trạch,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xử lý sạt lở bờ sông Ngàn Sâu, đoạn qua các xã: Hương Trạch, Hương Đô, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7875138',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xử lý sạt lở bờ sông Ngàn Sâu, đoạn qua các xã: Hương Trạch, Hương Đô, huyện Hương Khê',
      '7875138',
      3,
      'T',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 231: Nhà đa năng Trường THPT Phúc Trạch, huyện Hương Khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa năng Trường THPT Phúc Trạch, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = 'XHH2',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa năng Trường THPT Phúc Trạch, huyện Hương Khê',
      'XHH2',
      3,
      'H',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 232: Đường GTNT thôn 3, 4, 7 và cầu Động Bụt thôn 5 xã Hương Lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT thôn 3, 4, 7 và cầu Động Bụt thôn 5 xã Hương Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018896',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT thôn 3, 4, 7 và cầu Động Bụt thôn 5 xã Hương Lâm',
      '8018896',
      3,
      'H',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 233: Khối nhà hành chính quản trị kết hợp phòng học bộ môn 3 tầng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối nhà hành chính quản trị kết hợp phòng học bộ môn 3 tầng trường Tiểu học Lộc Yên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8159272',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối nhà hành chính quản trị kết hợp phòng học bộ môn 3 tầng trường Tiểu học Lộc Yên',
      '8159272',
      3,
      'H',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 234: Nâng cấp, cải tạo TH Hương Lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo TH Hương Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999322',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo TH Hương Lâm',
      '7999322',
      3,
      'H',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 235: Kè chống sạt lở bờ sông Tiêm đoạn qua xã Hương Xuân
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Kè chống sạt lở bờ sông Tiêm đoạn qua xã Hương Xuân')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026957',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Kè chống sạt lở bờ sông Tiêm đoạn qua xã Hương Xuân',
      '8026957',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 236: Nhà làm việc 02 tầng và các hạng mục phụ trợ UBND xã Hương L
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà làm việc 02 tầng và các hạng mục phụ trợ UBND xã Hương Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8002570',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà làm việc 02 tầng và các hạng mục phụ trợ UBND xã Hương Lâm',
      '8002570',
      3,
      'H',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 237: Nhà hành chính quản trị 2 tầng trường Tiểu học Hà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị 2 tầng trường Tiểu học Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7902752',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị 2 tầng trường Tiểu học Hà Linh',
      '7902752',
      3,
      'H',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 238: Nâng cấp, cải tạo THCS Phương Điền
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo THCS Phương Điền')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7990459',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo THCS Phương Điền',
      '7990459',
      3,
      'H',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 239: Đường GTNT xóm 4, 5 xã Hương Thủy
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xóm 4, 5 xã Hương Thủy')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7914473',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 6,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xóm 4, 5 xã Hương Thủy',
      '7914473',
      3,
      'H',
      'Hương Khê',
      '2140',
      6,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 240: Sửa chữa, nâng cấp Đường GTNT thôn Vĩnh Đại, xã Quang Vĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, nâng cấp Đường GTNT thôn Vĩnh Đại, xã Quang Vĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7903685',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, nâng cấp Đường GTNT thôn Vĩnh Đại, xã Quang Vĩnh',
      '7903685',
      1,
      'T',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 241: Dự án Đường nối Quốc lộ 8A - Cụm công nghiệp Thái Yên - Quốc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường nối Quốc lộ 8A - Cụm công nghiệp Thái Yên - Quốc lộ 15A, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7941296',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường nối Quốc lộ 8A - Cụm công nghiệp Thái Yên - Quốc lộ 15A, huyện Đức Thọ',
      '7941296',
      1,
      'T',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 242: Dự án Đường huyện lộ ĐH56 đoạn qua xã Hòa Lạc, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường huyện lộ ĐH56 đoạn qua xã Hòa Lạc, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7953262',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường huyện lộ ĐH56 đoạn qua xã Hòa Lạc, huyện Đức Thọ',
      '7953262',
      1,
      'T',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 243: Dự án Nâng cấp hệ thống mương thủy lợi Đập Am, xã Đức Đồng, 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nâng cấp hệ thống mương thủy lợi Đập Am, xã Đức Đồng, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7995822',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nâng cấp hệ thống mương thủy lợi Đập Am, xã Đức Đồng, huyện Đức Thọ',
      '7995822',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 244: Dự án Nâng cấp đường giao thông thôn Châu Diên, xã Tùng Châu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nâng cấp đường giao thông thôn Châu Diên, xã Tùng Châu')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8035279',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nâng cấp đường giao thông thôn Châu Diên, xã Tùng Châu',
      '8035279',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 245: Dự án Đường Trục xã 04 (TX04) đoạn qua xã Đức An, huyện Đức 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường Trục xã 04 (TX04) đoạn qua xã Đức An, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7845551',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường Trục xã 04 (TX04) đoạn qua xã Đức An, huyện Đức Thọ',
      '7845551',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 246: Dự án Đường Trục xã 03 (TX03) đoạn qua xã Đức Long
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường Trục xã 03 (TX03) đoạn qua xã Đức Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7845548',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường Trục xã 03 (TX03) đoạn qua xã Đức Long',
      '7845548',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 247: Dự án Đường giao thông nông thôn thôn Đại Nghĩa - thôn Hùng 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông nông thôn thôn Đại Nghĩa - thôn Hùng Dũng, xã Đức Yên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7894922',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông nông thôn thôn Đại Nghĩa - thôn Hùng Dũng, xã Đức Yên',
      '7894922',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 248: Dự án Nâng cấp đường vào và khuôn viên trước cổng Nghĩa tran
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nâng cấp đường vào và khuôn viên trước cổng Nghĩa trang liệt sỹ huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7954641',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nâng cấp đường vào và khuôn viên trước cổng Nghĩa trang liệt sỹ huyện Đức Thọ',
      '7954641',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 249: Dự án Nhà văn hóa cộng đồng kết hợp tránh, trú bão, lụt thôn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nhà văn hóa cộng đồng kết hợp tránh, trú bão, lụt thôn Thị Hòa, xã Hòa Lạc, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8161151',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nhà văn hóa cộng đồng kết hợp tránh, trú bão, lụt thôn Thị Hòa, xã Hòa Lạc, huyện Đức Thọ',
      '8161151',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 250: Dự án Nâng cấp tuyến đường liên xã Tùng Ảnh - Thị trấn (HL09
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nâng cấp tuyến đường liên xã Tùng Ảnh - Thị trấn (HL09)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7719105',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nâng cấp tuyến đường liên xã Tùng Ảnh - Thị trấn (HL09)',
      '7719105',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 251: Dự án Đường giao thông xã Đức Thủy - Thái Yên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông xã Đức Thủy - Thái Yên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7746751',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông xã Đức Thủy - Thái Yên',
      '7746751',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 252: Dự án Đường liên xã Đức An - Tân Hương, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường liên xã Đức An - Tân Hương, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7683783',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường liên xã Đức An - Tân Hương, huyện Đức Thọ',
      '7683783',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 253: Dự án Đường và kênh tiêu úng xã Đức Lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường và kênh tiêu úng xã Đức Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7756283',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường và kênh tiêu úng xã Đức Lâm',
      '7756283',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 254: Dự án Đường giao thông xã Đức Yên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông xã Đức Yên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7744993',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông xã Đức Yên',
      '7744993',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 255: Dự án Đường liên xã Đức Đồng - Đức Lạc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường liên xã Đức Đồng - Đức Lạc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7744995',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường liên xã Đức Đồng - Đức Lạc',
      '7744995',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 256: Dự án Đường giao thông xã Đức Dũng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông xã Đức Dũng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7754505',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông xã Đức Dũng',
      '7754505',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 257: Dự án Đường giao thông xã Đức Lâm nối đường đi trung tâm xã 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông xã Đức Lâm nối đường đi trung tâm xã Đức Lập và Quốc lộ 8A')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7763715',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông xã Đức Lâm nối đường đi trung tâm xã Đức Lập và Quốc lộ 8A',
      '7763715',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 258: Dự án Đường giao thông liên xã Đức La - Đức Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông liên xã Đức La - Đức Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7746750',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông liên xã Đức La - Đức Quang',
      '7746750',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 259: Dự án Đường giao thông thôn Thịnh Cường đi trung tâm xã Đức 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông thôn Thịnh Cường đi trung tâm xã Đức Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7745315',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông thôn Thịnh Cường đi trung tâm xã Đức Long',
      '7745315',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 260: Dự án Cầu Nhà Vẹo và đường ngang kết nối cầu, kè chống sạt l
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cầu Nhà Vẹo và đường ngang kết nối cầu, kè chống sạt lở thượng hạ lưu kênh T14 xã Đức An')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7693083',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cầu Nhà Vẹo và đường ngang kết nối cầu, kè chống sạt lở thượng hạ lưu kênh T14 xã Đức An',
      '7693083',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 261: Dự án Đường giao thông xã Đức Nhân
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông xã Đức Nhân')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7636876',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông xã Đức Nhân',
      '7636876',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 262: Dự án Cải tạo, sửa chữa Khu liên hợp thể thao Trung tâm văn 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cải tạo, sửa chữa Khu liên hợp thể thao Trung tâm văn hóa huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7753435',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cải tạo, sửa chữa Khu liên hợp thể thao Trung tâm văn hóa huyện Đức Thọ',
      '7753435',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 263: Dự án Trụ sở làm việc xã Đức Dũng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Trụ sở làm việc xã Đức Dũng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7687588',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Trụ sở làm việc xã Đức Dũng',
      '7687588',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 264: Dự án Trường tiểu học Đức Thanh - Hạng mục: Nhà hiệu bộ 2 tầ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Trường tiểu học Đức Thanh - Hạng mục: Nhà hiệu bộ 2 tầng và nhà đa chức năng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7769276',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Trường tiểu học Đức Thanh - Hạng mục: Nhà hiệu bộ 2 tầng và nhà đa chức năng',
      '7769276',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 265: Dự án Đường giao thông nông thôn xã Đức Châu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông nông thôn xã Đức Châu')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7681373',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông nông thôn xã Đức Châu',
      '7681373',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 266: Dự án Đường giao thông nông thôn xã Đức Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông nông thôn xã Đức Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7454867',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông nông thôn xã Đức Quang',
      '7454867',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 267: Dự án Đường giao thông nội thị thị trấn Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông nội thị thị trấn Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7549922',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông nội thị thị trấn Đức Thọ',
      '7549922',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 268: Dự án Kênh mương tiêu úng xã Đức Long
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Kênh mương tiêu úng xã Đức Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7691341',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Kênh mương tiêu úng xã Đức Long',
      '7691341',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 269: Dự án Sửa chữa, nâng cấp Đập Đá Trắng xã Tân Hương, huyện Đứ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Sửa chữa, nâng cấp Đập Đá Trắng xã Tân Hương, huyện Đức Thọ, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7596419',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Sửa chữa, nâng cấp Đập Đá Trắng xã Tân Hương, huyện Đức Thọ, tỉnh Hà Tĩnh',
      '7596419',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 270: Dự án Đường giao thông liên thôn xã Đức Thanh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông liên thôn xã Đức Thanh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7690169',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông liên thôn xã Đức Thanh',
      '7690169',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 271: Dự án Kênh tiêu úng xã Đức Nhân
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Kênh tiêu úng xã Đức Nhân')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8161152',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Kênh tiêu úng xã Đức Nhân',
      '8161152',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 272: Dự án Đường giao thông nông thôn xã Đức Lâm, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông nông thôn xã Đức Lâm, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7570530',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông nông thôn xã Đức Lâm, huyện Đức Thọ',
      '7570530',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 273: Dự án Đường trục chính xã Tân Hương đoạn qua thôn Tân Nhân
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường trục chính xã Tân Hương đoạn qua thôn Tân Nhân')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7719106',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường trục chính xã Tân Hương đoạn qua thôn Tân Nhân',
      '7719106',
      1,
      'H',
      'Đức Thọ',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 274: Khắc phục sạt lở Đường liên xã LX04 từ cầu Hương Đại TDP3, t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khắc phục sạt lở Đường liên xã LX04 từ cầu Hương Đại TDP3, thị trấn Vũ Quang – Giao đường ĐH.81 tại thôn 1 xã Quang Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8094303',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khắc phục sạt lở Đường liên xã LX04 từ cầu Hương Đại TDP3, thị trấn Vũ Quang – Giao đường ĐH.81 tại thôn 1 xã Quang Thọ',
      '8094303',
      1,
      'T',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 275: Cầu Trảy xã Đức Lĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Trảy xã Đức Lĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7472673',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Trảy xã Đức Lĩnh',
      '7472673',
      1,
      'T',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 276: Đường và mương thoát nước phía Tây thị trấn Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường và mương thoát nước phía Tây thị trấn Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7299796',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường và mương thoát nước phía Tây thị trấn Vũ Quang',
      '7299796',
      1,
      'T',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 277: Nâng cấp đường GTNT đoạn từ Cầu Gãy đến trung tâm xã Thọ Điề
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường GTNT đoạn từ Cầu Gãy đến trung tâm xã Thọ Điền')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8154496',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường GTNT đoạn từ Cầu Gãy đến trung tâm xã Thọ Điền',
      '8154496',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 278: Nhà văn hóa xóm 3 Bồng Giang xã Đức Giang, huyện Vũ Quang, t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa xóm 3 Bồng Giang xã Đức Giang, huyện Vũ Quang, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7569553',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa xóm 3 Bồng Giang xã Đức Giang, huyện Vũ Quang, tỉnh Hà Tĩnh',
      '7569553',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 279: Nhà họp chấp hành trực tuyến, huyện Vũ Quang, tỉnh Hà Tĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà họp chấp hành trực tuyến, huyện Vũ Quang, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7581438',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà họp chấp hành trực tuyến, huyện Vũ Quang, tỉnh Hà Tĩnh',
      '7581438',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 280: Đường 135 từ tỉnh lộ 552 đến đường IfaX (đoạn qua thôn 5 xã 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường 135 từ tỉnh lộ 552 đến đường IfaX (đoạn qua thôn 5 xã Đức Bồng)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7574135',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường 135 từ tỉnh lộ 552 đến đường IfaX (đoạn qua thôn 5 xã Đức Bồng)',
      '7574135',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 281: Đường trục thôn xóm 1 xóm 3 Bồng Giang xã Đức Giang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường trục thôn xóm 1 xóm 3 Bồng Giang xã Đức Giang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7573536',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường trục thôn xóm 1 xóm 3 Bồng Giang xã Đức Giang',
      '7573536',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 282: Đường vào khu sản xuất chăn nuôi tập trung khe Nác Nẫy xã Sơ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường vào khu sản xuất chăn nuôi tập trung khe Nác Nẫy xã Sơn Thọ, huyện Vũ Quang (đoạn từ Km2+780,66 đến Km3+399,11), tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7581503',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường vào khu sản xuất chăn nuôi tập trung khe Nác Nẫy xã Sơn Thọ, huyện Vũ Quang (đoạn từ Km2+780,66 đến Km3+399,11), tỉnh Hà Tĩnh',
      '7581503',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 283: Nhà văn hóa tổ dân phố 6 thị trấn Vũ Quang, huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa tổ dân phố 6 thị trấn Vũ Quang, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7690166',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa tổ dân phố 6 thị trấn Vũ Quang, huyện Vũ Quang',
      '7690166',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 284: Sửa chữa Trụ sở khôi dân huyện Vũ Quang thuộc dự án khắc phụ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa Trụ sở khôi dân huyện Vũ Quang thuộc dự án khắc phục thiệt hại do mưa lũ năm 2016 trên địa bàn huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7644739',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa Trụ sở khôi dân huyện Vũ Quang thuộc dự án khắc phục thiệt hại do mưa lũ năm 2016 trên địa bàn huyện Vũ Quang',
      '7644739',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 285: Duy tu, sửa chữa TTVH thể thao huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Duy tu, sửa chữa TTVH thể thao huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7632187',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Duy tu, sửa chữa TTVH thể thao huyện Vũ Quang',
      '7632187',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 286: Cải tạo, sửa chữa trường THCS Phan Đình Phùng, huyện Vũ Quan
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, sửa chữa trường THCS Phan Đình Phùng, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7713556',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, sửa chữa trường THCS Phan Đình Phùng, huyện Vũ Quang',
      '7713556',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 287: Nhà đa chức năng Trường tiểu học xã Đức Bồng, huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa chức năng Trường tiểu học xã Đức Bồng, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7635508',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa chức năng Trường tiểu học xã Đức Bồng, huyện Vũ Quang',
      '7635508',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 288: Cải tạo, sửa chữa trường tiểu học thị trấn Vũ Quang, huyện V
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, sửa chữa trường tiểu học thị trấn Vũ Quang, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7656673',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, sửa chữa trường tiểu học thị trấn Vũ Quang, huyện Vũ Quang',
      '7656673',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 289: Đường GTNT Hương Thọ - Hương Đại xã Đức Hương huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT Hương Thọ - Hương Đại xã Đức Hương huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7689103',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT Hương Thọ - Hương Đại xã Đức Hương huyện Vũ Quang',
      '7689103',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 290: Sửa chữa TTUD KHKT&BVCTVN huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa TTUD KHKT&BVCTVN huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7693205',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa TTUD KHKT&BVCTVN huyện Vũ Quang',
      '7693205',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 291: Đường GT liên thôn 4 đi thôn 8, xã Đức Bồng huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GT liên thôn 4 đi thôn 8, xã Đức Bồng huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7735056',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GT liên thôn 4 đi thôn 8, xã Đức Bồng huyện Vũ Quang',
      '7735056',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 292: Đường giao thông liên thôn Đồn Thượng đi Bình Quang, xã Đức 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên thôn Đồn Thượng đi Bình Quang, xã Đức Liên huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7897319',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên thôn Đồn Thượng đi Bình Quang, xã Đức Liên huyện Vũ Quang',
      '7897319',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 293: Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn 3, xã Ân Ph
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn 3, xã Ân Phú, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8161041',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn 3, xã Ân Phú, huyện Vũ Quang',
      '8161041',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 294: Nhà văn hoá cộng đồng kết hợp tránh bão, lũ, thôn 4, xã Đức 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hoá cộng đồng kết hợp tránh bão, lũ, thôn 4, xã Đức Bồng, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8161042',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hoá cộng đồng kết hợp tránh bão, lũ, thôn 4, xã Đức Bồng, huyện Vũ Quang',
      '8161042',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 295: Nhà học bộ môn 02 tầng 06 phòng trường THCS Liên Hương
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 02 tầng 06 phòng trường THCS Liên Hương')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7587959',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 02 tầng 06 phòng trường THCS Liên Hương',
      '7587959',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 296: Đường GTNT thôn Văn Giang, thôn Bồng Giang, xã Đức Giang, hu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT thôn Văn Giang, thôn Bồng Giang, xã Đức Giang, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7839654',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT thôn Văn Giang, thôn Bồng Giang, xã Đức Giang, huyện Vũ Quang',
      '7839654',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 297: Sửa chữa nâng cấp đập Khe Xai xã Hương Minh, huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa nâng cấp đập Khe Xai xã Hương Minh, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7963997',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa nâng cấp đập Khe Xai xã Hương Minh, huyện Vũ Quang',
      '7963997',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 298: Xây dựng kênh mương nội đồng xã Đức Giang (tuyến đập Hốp Trổ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng kênh mương nội đồng xã Đức Giang (tuyến đập Hốp Trổ - Chân Giác thôn 2 Văn Giang)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8049085',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng kênh mương nội đồng xã Đức Giang (tuyến đập Hốp Trổ - Chân Giác thôn 2 Văn Giang)',
      '8049085',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 299: Đường GTNT NX25 thôn 4 TL552 đến Bà Nga, xã Đức Bồng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT NX25 thôn 4 TL552 đến Bà Nga, xã Đức Bồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8073108',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT NX25 thôn 4 TL552 đến Bà Nga, xã Đức Bồng',
      '8073108',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 300: Hội trường xã Thọ Điền, huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hội trường xã Thọ Điền, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7903373',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hội trường xã Thọ Điền, huyện Vũ Quang',
      '7903373',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 301: Đường từ cầu Hương Đại đi bến thuyền, thị trấn Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường từ cầu Hương Đại đi bến thuyền, thị trấn Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7639966',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường từ cầu Hương Đại đi bến thuyền, thị trấn Vũ Quang',
      '7639966',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 302: Nâng cấp, cải tạo vỉa hè nút giao ngã 3 xã Đức Bồng Km64+500
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo vỉa hè nút giao ngã 3 xã Đức Bồng Km64+500/QL.281 (giao giữa QL.281 với ĐT.552) huyện Vũ Quang, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8031816',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo vỉa hè nút giao ngã 3 xã Đức Bồng Km64+500/QL.281 (giao giữa QL.281 với ĐT.552) huyện Vũ Quang, tỉnh Hà Tĩnh',
      '8031816',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 303: Nhà đa chức năng Trường TH&THCS Quang Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa chức năng Trường TH&THCS Quang Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7907143',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa chức năng Trường TH&THCS Quang Thọ',
      '7907143',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 304: Đường GTNT thôn Cao Phong, xã Đức Lĩnh huyện Vũ Quang (Tuyến
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT thôn Cao Phong, xã Đức Lĩnh huyện Vũ Quang (Tuyến Chọ Su- Tuyến Chọ Chưởng)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7961149',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT thôn Cao Phong, xã Đức Lĩnh huyện Vũ Quang (Tuyến Chọ Su- Tuyến Chọ Chưởng)',
      '7961149',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 305: Hệ thống điện chiếu sáng và điện trang trí trung tâm thị trấ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống điện chiếu sáng và điện trang trí trung tâm thị trấn Vũ Quang, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7653980',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống điện chiếu sáng và điện trang trí trung tâm thị trấn Vũ Quang, huyện Vũ Quang',
      '7653980',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 306: Đường liên thôn Liên Hòa Liên Châu xã Đức Liên huyện Vũ Quan
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường liên thôn Liên Hòa Liên Châu xã Đức Liên huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7651695',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường liên thôn Liên Hòa Liên Châu xã Đức Liên huyện Vũ Quang',
      '7651695',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 307: Nâng cấp mở rộng đường từ TT Vũ Quang đi Hương Thọ (Đoạn từ 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp mở rộng đường từ TT Vũ Quang đi Hương Thọ (Đoạn từ Cầu Hương Đại đến Bãi Cùng)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7665809',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp mở rộng đường từ TT Vũ Quang đi Hương Thọ (Đoạn từ Cầu Hương Đại đến Bãi Cùng)',
      '7665809',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 308: Nâng cấp Đường tỉnh lộ 552 đoạn qua thị trấn Vũ Quang, huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp Đường tỉnh lộ 552 đoạn qua thị trấn Vũ Quang, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7666376',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp Đường tỉnh lộ 552 đoạn qua thị trấn Vũ Quang, huyện Vũ Quang',
      '7666376',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 309: Nâng cấp mở rộng đường Hương Thọ - Cửa Rào( Đoạn qua trung t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp mở rộng đường Hương Thọ - Cửa Rào( Đoạn qua trung tâm hành chính xã Hương Thọ)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7677988',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp mở rộng đường Hương Thọ - Cửa Rào( Đoạn qua trung tâm hành chính xã Hương Thọ)',
      '7677988',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 310: Cầu Đập Bượm xã Hương Thọ huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Đập Bượm xã Hương Thọ huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7703413',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Đập Bượm xã Hương Thọ huyện Vũ Quang',
      '7703413',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 311: Cải tạo nhà làm việc 03 tầng UBND huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo nhà làm việc 03 tầng UBND huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7754557',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo nhà làm việc 03 tầng UBND huyện',
      '7754557',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 312: Nhà học 02 tầng 6 phòng Trường tiểu học xã Đức Lĩnh huyện Vũ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 02 tầng 6 phòng Trường tiểu học xã Đức Lĩnh huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7743782',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 02 tầng 6 phòng Trường tiểu học xã Đức Lĩnh huyện Vũ Quang',
      '7743782',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 313: Cải tạo nhà học bộ môn, nhà hội trường, sân lát gạch, mương 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo nhà học bộ môn, nhà hội trường, sân lát gạch, mương thoát nước trường THPT Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7859913',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo nhà học bộ môn, nhà hội trường, sân lát gạch, mương thoát nước trường THPT Vũ Quang',
      '7859913',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 314: Nhà tập luyện thế thao, Trung tâm văn hóa - truyền thông huy
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà tập luyện thế thao, Trung tâm văn hóa - truyền thông huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7878420',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà tập luyện thế thao, Trung tâm văn hóa - truyền thông huyện Vũ Quang',
      '7878420',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 315: Đường GTNT xã Đức Giang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xã Đức Giang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7541321',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xã Đức Giang',
      '7541321',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 316: Đường giao thông nội thị đoạn qua tổ dân phố 2 đi tổ dân phố
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nội thị đoạn qua tổ dân phố 2 đi tổ dân phố 1 thị trấn Vũ Quang, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7597353',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nội thị đoạn qua tổ dân phố 2 đi tổ dân phố 1 thị trấn Vũ Quang, tỉnh Hà Tĩnh',
      '7597353',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 317: Đường trục chính xã Đức Giang huyện Vũ Quang (Đoạn từ Trường
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường trục chính xã Đức Giang huyện Vũ Quang (Đoạn từ Trường THCS Ân Giang đến Cống Choăng) tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7575367',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường trục chính xã Đức Giang huyện Vũ Quang (Đoạn từ Trường THCS Ân Giang đến Cống Choăng) tỉnh Hà Tĩnh',
      '7575367',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 318: Cải tạo nhà làm việc 3 tầng, Trung tâm hành chính công huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo nhà làm việc 3 tầng, Trung tâm hành chính công huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7692917',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo nhà làm việc 3 tầng, Trung tâm hành chính công huyện Vũ Quang',
      '7692917',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 319: Cải tọa, sửa chữa khuôn viên, cổng, hàng rào Trung tâm GDTX 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tọa, sửa chữa khuôn viên, cổng, hàng rào Trung tâm GDTX huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7899091',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tọa, sửa chữa khuôn viên, cổng, hàng rào Trung tâm GDTX huyện Vũ Quang',
      '7899091',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 320: Đường Hương Phùng, Hương Hòa, Hương Tân, Hương Đồng xã Đức H
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường Hương Phùng, Hương Hòa, Hương Tân, Hương Đồng xã Đức Hương, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7935136',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường Hương Phùng, Hương Hòa, Hương Tân, Hương Đồng xã Đức Hương, huyện Vũ Quang',
      '7935136',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 321: Đường GT thôn 7 NX57 ĐH77 đến Ngàn Trươi xã Đức Bồng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GT thôn 7 NX57 ĐH77 đến Ngàn Trươi xã Đức Bồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8072686',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GT thôn 7 NX57 ĐH77 đến Ngàn Trươi xã Đức Bồng',
      '8072686',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 322: Đường vào khu chăn nuôi tập trung xã Hương Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường vào khu chăn nuôi tập trung xã Hương Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7489424',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường vào khu chăn nuôi tập trung xã Hương Quang',
      '7489424',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 323: Nhà học 02 tầng 04 phòng và bếp trường Mn xã Đức Hương
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 02 tầng 04 phòng và bếp trường Mn xã Đức Hương')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7899092',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 02 tầng 04 phòng và bếp trường Mn xã Đức Hương',
      '7899092',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 324: Nhà văn hóa tổ dân phố 5 thị trấn Vũ Quang, huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa tổ dân phố 5 thị trấn Vũ Quang, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7690165',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa tổ dân phố 5 thị trấn Vũ Quang, huyện Vũ Quang',
      '7690165',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 325: Duy tu, sửa chữa công trình HTKT khối 4 thị trấn VQ huyện Vũ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Duy tu, sửa chữa công trình HTKT khối 4 thị trấn VQ huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7637127',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Duy tu, sửa chữa công trình HTKT khối 4 thị trấn VQ huyện Vũ Quang',
      '7637127',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 326: Hệ thống điện chiếu sáng thị trấn Vũ Quang, huyện Vũ Quang (
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống điện chiếu sáng thị trấn Vũ Quang, huyện Vũ Quang (Đoạn từ Cổng chào điện tử đến cổng Đài Truyền hình; Nhánh vào Trung tâm chính trị và Đài tưởng niệm)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7740276',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống điện chiếu sáng thị trấn Vũ Quang, huyện Vũ Quang (Đoạn từ Cổng chào điện tử đến cổng Đài Truyền hình; Nhánh vào Trung tâm chính trị và Đài tưởng niệm)',
      '7740276',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 327: Sửa chữa đập Nảy Cầu xã Đức Hương
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa đập Nảy Cầu xã Đức Hương')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8075396',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa đập Nảy Cầu xã Đức Hương',
      '8075396',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 328: Nhà tưởng niệm liệt sỹ huyện Vũ Quang, Hạng mục: Hàng rào, k
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà tưởng niệm liệt sỹ huyện Vũ Quang, Hạng mục: Hàng rào, kè chắn đất')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080502',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà tưởng niệm liệt sỹ huyện Vũ Quang, Hạng mục: Hàng rào, kè chắn đất',
      '8080502',
      1,
      'H',
      'Vũ Quang',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 329: Quy hoạch chi tiết xây dựng Cụm công nghiệp - tiểu thủ công 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch chi tiết xây dựng Cụm công nghiệp - tiểu thủ công nghiệp tập trung huyện Vũ Quang, tỷ lệ 1/500')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8133134',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2977',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch chi tiết xây dựng Cụm công nghiệp - tiểu thủ công nghiệp tập trung huyện Vũ Quang, tỷ lệ 1/500',
      '8133134',
      1,
      'H',
      'Vũ Quang',
      '2977',
      7,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 330: Cầu Hội, thị trấn Cẩm Xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Hội, thị trấn Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7768527',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Hội, thị trấn Cẩm Xuyên',
      '7768527',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 331: Đường vào trung tâm xã Cẩm Nam, huyện Cẩm Xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường vào trung tâm xã Cẩm Nam, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7346114',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường vào trung tâm xã Cẩm Nam, huyện Cẩm Xuyên',
      '7346114',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 332: Nâng cấp đường giao thông từ đường ĐT548 đi chùa Hương Tích,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường giao thông từ đường ĐT548 đi chùa Hương Tích, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7905535',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường giao thông từ đường ĐT548 đi chùa Hương Tích, huyện Can Lộc',
      '7905535',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 333: Sửa chữa, nâng cấp nghĩa trang liệt sỹ huyện Can Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, nâng cấp nghĩa trang liệt sỹ huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7651398',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, nâng cấp nghĩa trang liệt sỹ huyện Can Lộc',
      '7651398',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 334: Nâng cấp, mở rộng đường giao thông liên xã Thanh Lộc - Khánh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường giao thông liên xã Thanh Lộc - Khánh Vĩnh yên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7853689',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường giao thông liên xã Thanh Lộc - Khánh Vĩnh yên',
      '7853689',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 335: Nhà học 3 tầng trường tiểu học Mỹ Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 3 tầng trường tiểu học Mỹ Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8031594',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 3 tầng trường tiểu học Mỹ Lộc',
      '8031594',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 336: Đường trung tâm thị trấn Nghèn đoạn từ QL 1a giao với đường 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường trung tâm thị trấn Nghèn đoạn từ QL 1a giao với đường Xuân Diệu (GĐ 2)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7771913',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường trung tâm thị trấn Nghèn đoạn từ QL 1a giao với đường Xuân Diệu (GĐ 2)',
      '7771913',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 337: Cầu Làng xã Khánh Vĩnh Yên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Làng xã Khánh Vĩnh Yên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7887208',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Làng xã Khánh Vĩnh Yên',
      '7887208',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 338: Đường giao thông liên xã Trung Lộc - Khánh Vĩnh Yên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên xã Trung Lộc - Khánh Vĩnh Yên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7898767',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên xã Trung Lộc - Khánh Vĩnh Yên',
      '7898767',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 339: Cải tạo, nâng cấp nhà làm việc UBND huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, nâng cấp nhà làm việc UBND huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7882370',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, nâng cấp nhà làm việc UBND huyện',
      '7882370',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 340: Đường liên thôn xóm Tài năm - Tùng Sơn và xóm Tân Hương - Tâ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường liên thôn xóm Tài năm - Tùng Sơn và xóm Tân Hương - Tây Vinh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7576610',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường liên thôn xóm Tài năm - Tùng Sơn và xóm Tân Hương - Tây Vinh',
      '7576610',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 341: Xây dựng ki ốt bán hàng tại chùa Hương Tích, huyện Can Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng ki ốt bán hàng tại chùa Hương Tích, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7871377',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng ki ốt bán hàng tại chùa Hương Tích, huyện Can Lộc',
      '7871377',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 342: Nâng cấp, mở rộng đường trục chính từ thôn Phong Sơn đến Cụm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường trục chính từ thôn Phong Sơn đến Cụm công nghiệp Yên Huy, xã Khánh Vĩnh Yên, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7911734',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường trục chính từ thôn Phong Sơn đến Cụm công nghiệp Yên Huy, xã Khánh Vĩnh Yên, huyện Can Lộc',
      '7911734',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 343: Kênh tiêu úng xã Tùng Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Kênh tiêu úng xã Tùng Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7924292',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Kênh tiêu úng xã Tùng Lộc',
      '7924292',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 344: Sửa chữa tuyến đê Hữu Nghèn từ K5+370 – K6+275.
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa tuyến đê Hữu Nghèn từ K5+370 – K6+275.')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7933045',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa tuyến đê Hữu Nghèn từ K5+370 – K6+275.',
      '7933045',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 345: Đường giao thông liên xã Khánh Vĩnh Yên – Vượng Lộc, huyện C
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên xã Khánh Vĩnh Yên – Vượng Lộc, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8117709',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên xã Khánh Vĩnh Yên – Vượng Lộc, huyện Can Lộc',
      '8117709',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 346: Kênh tiêu úng phía nam thị trấn Nghèn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Kênh tiêu úng phía nam thị trấn Nghèn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8062096',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Kênh tiêu úng phía nam thị trấn Nghèn',
      '8062096',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 347: Nâng cấp, mở rộng đường vào khu di tích làng K130 thị trấn N
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường vào khu di tích làng K130 thị trấn Nghèn, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7930594',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường vào khu di tích làng K130 thị trấn Nghèn, huyện Can Lộc',
      '7930594',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 348: Xây dựng phần mềm thành phần, bổ sung trang thiết bị phục vụ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng phần mềm thành phần, bổ sung trang thiết bị phục vụ cổng điều hành nội bộ trên địa bàn huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7870765',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng phần mềm thành phần, bổ sung trang thiết bị phục vụ cổng điều hành nội bộ trên địa bàn huyện',
      '7870765',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 349: Hệ thống điện trang trí dải phân cách tuyến đường QL1A đi qu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống điện trang trí dải phân cách tuyến đường QL1A đi qua thị trấn Nghèn, huyện Can Lộc.')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8131162',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống điện trang trí dải phân cách tuyến đường QL1A đi qua thị trấn Nghèn, huyện Can Lộc.',
      '8131162',
      2,
      'H',
      'Can Lộc',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 350: Nhà sinh hoạt cộng đồng thôn Minh Vượng xã Vượng Lộc, huyện 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà sinh hoạt cộng đồng thôn Minh Vượng xã Vượng Lộc, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7881487',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2578',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà sinh hoạt cộng đồng thôn Minh Vượng xã Vượng Lộc, huyện Can Lộc',
      '7881487',
      2,
      'H',
      'Can Lộc',
      '2578',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 351: Nhà sinh hoạt cộng đồng thôn Đồng Kim xã Trung Lộc, huyện Ca
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà sinh hoạt cộng đồng thôn Đồng Kim xã Trung Lộc, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7881488',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2578',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà sinh hoạt cộng đồng thôn Đồng Kim xã Trung Lộc, huyện Can Lộc',
      '7881488',
      2,
      'H',
      'Can Lộc',
      '2578',
      7,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 352: Nâng cấp,sữa chữa tuyến đường huyện ĐH.37 năm 2025, huyện Ca
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp,sữa chữa tuyến đường huyện ĐH.37 năm 2025, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8145036',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '3455',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp,sữa chữa tuyến đường huyện ĐH.37 năm 2025, huyện Can Lộc',
      '8145036',
      2,
      'H',
      'Can Lộc',
      '3455',
      7,
      jsonb_build_object('ke_toan', 'hương')
    );
  END IF;
END $$;

-- STT 353: Đường giao thông từ thôn Trung Văn đi thôn Bắc Văn, xã Thạch
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ thôn Trung Văn đi thôn Bắc Văn, xã Thạch Văn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8022641',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ thôn Trung Văn đi thôn Bắc Văn, xã Thạch Văn',
      '8022641',
      3,
      'H',
      'Thạch Hà',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 354: Hệ thống cây xanh tuyến đường ĐH.106 đoạn từ đường tránh Quố
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống cây xanh tuyến đường ĐH.106 đoạn từ đường tránh Quốc lộ 1A tại xã Tân Lâm Hương đến Tỉnh lộ 21')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025250',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống cây xanh tuyến đường ĐH.106 đoạn từ đường tránh Quốc lộ 1A tại xã Tân Lâm Hương đến Tỉnh lộ 21',
      '8025250',
      3,
      'H',
      'Thạch Hà',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 355: Hệ thống cây xanh Đường ĐH.105 đoạn từ cầu Hồng Quang, xã Vi
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống cây xanh Đường ĐH.105 đoạn từ cầu Hồng Quang, xã Việt Tiến đến thôn Song Hoành, xã Lưu Vĩnh Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025249',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống cây xanh Đường ĐH.105 đoạn từ cầu Hồng Quang, xã Việt Tiến đến thôn Song Hoành, xã Lưu Vĩnh Sơn',
      '8025249',
      3,
      'H',
      'Thạch Hà',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 356: Nhà đa chức năng Trường THCS Long Sơn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa chức năng Trường THCS Long Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8092881',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa chức năng Trường THCS Long Sơn',
      '8092881',
      3,
      'H',
      'Thạch Hà',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 357: Nhà đa chức năng Trường tiểu học Thạch Sơn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa chức năng Trường tiểu học Thạch Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8095527',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa chức năng Trường tiểu học Thạch Sơn',
      '8095527',
      3,
      'H',
      'Thạch Hà',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 358: Trạm biến áp 1000kVA- 22/04kV và hệ thống đường dây tại CCN 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trạm biến áp 1000kVA- 22/04kV và hệ thống đường dây tại CCN Thạch Kim')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7768262',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trạm biến áp 1000kVA- 22/04kV và hệ thống đường dây tại CCN Thạch Kim',
      '7768262',
      3,
      'H',
      'Thạch Hà',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 359: Xử lý mặt đê Hữu Nghèn đoạn từ K4+518,5 đến K4+872, thị trấn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xử lý mặt đê Hữu Nghèn đoạn từ K4+518,5 đến K4+872, thị trấn Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7757924',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xử lý mặt đê Hữu Nghèn đoạn từ K4+518,5 đến K4+872, thị trấn Thạch Hà',
      '7757924',
      3,
      'H',
      'Thạch Hà',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 360: Khối nhà khoa Cấp cứu chống độc; khoa Nội tổng hợp; khoa Y h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối nhà khoa Cấp cứu chống độc; khoa Nội tổng hợp; khoa Y học cổ truyền - phục hồi chức năng; khoa Dược và các hạng mục phụ trợ Trung tâm Y tế huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7960157',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối nhà khoa Cấp cứu chống độc; khoa Nội tổng hợp; khoa Y học cổ truyền - phục hồi chức năng; khoa Dược và các hạng mục phụ trợ Trung tâm Y tế huyện Thạch Hà',
      '7960157',
      3,
      'H',
      'Thạch Hà',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 361: Hạ tầng kỹ thuật khu dân cư nông thôn phục vụ phòng, chống n
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng kỹ thuật khu dân cư nông thôn phục vụ phòng, chống ngập lũ cho nhân dân xã Phương Mỹ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7671682',
      management_board      = 3,
      decision_level_before_handover = '#N/A',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng kỹ thuật khu dân cư nông thôn phục vụ phòng, chống ngập lũ cho nhân dân xã Phương Mỹ',
      '7671682',
      3,
      '#N/A',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 362: Cầu Cây Trồ, xã Phú Gia, huyện Hương Khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Cây Trồ, xã Phú Gia, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7744782',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Cây Trồ, xã Phú Gia, huyện Hương Khê',
      '7744782',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 363: Sửa chữa, nâng cấp hồ Thùng Trứa, xã Hương Trạch, huyện Hươn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, nâng cấp hồ Thùng Trứa, xã Hương Trạch, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7766221',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, nâng cấp hồ Thùng Trứa, xã Hương Trạch, huyện Hương Khê',
      '7766221',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 364: Đường từ đường Hồ Chí Minh đi Huyện lộ 1 đoạn qua xã Hương L
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường từ đường Hồ Chí Minh đi Huyện lộ 1 đoạn qua xã Hương Long, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7767761',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường từ đường Hồ Chí Minh đi Huyện lộ 1 đoạn qua xã Hương Long, huyện Hương Khê',
      '7767761',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 365: Cầu Bãi Hát và đường hai đầu cầu, xã Hòa Hải, huyê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Bãi Hát và đường hai đầu cầu, xã Hòa Hải, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7771915',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Bãi Hát và đường hai đầu cầu, xã Hòa Hải, huyện Hương Khê',
      '7771915',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 366: Cầu Lộc Yên, huyện Hương Khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Lộc Yên, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7767760',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Lộc Yên, huyện Hương Khê',
      '7767760',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 367: Sữa chữa, nâng cấp trường THCS Chu Văn An và trường THCS Phú
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sữa chữa, nâng cấp trường THCS Chu Văn An và trường THCS Phúc Trạch')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7896298',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sữa chữa, nâng cấp trường THCS Chu Văn An và trường THCS Phúc Trạch',
      '7896298',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 368: Khôi phục, nâng cấp Trường Tiểu học Hương Liên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khôi phục, nâng cấp Trường Tiểu học Hương Liên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7896299',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khôi phục, nâng cấp Trường Tiểu học Hương Liên',
      '7896299',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 369: Cầu Hói Địa, cầu Chăm Trèng và khắc phục các vị trí hư hỏng 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Hói Địa, cầu Chăm Trèng và khắc phục các vị trí hư hỏng cục bộ tuyến đường liên xã 8 (Hà Linh-Phương Mỹ) huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7769284',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Hói Địa, cầu Chăm Trèng và khắc phục các vị trí hư hỏng cục bộ tuyến đường liên xã 8 (Hà Linh-Phương Mỹ) huyện Hương Khê',
      '7769284',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 370: Khôi phục, nâng cấp Trường Tiểu học Hương Thủy
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khôi phục, nâng cấp Trường Tiểu học Hương Thủy')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7896300',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khôi phục, nâng cấp Trường Tiểu học Hương Thủy',
      '7896300',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 371: Khôi phục đường giao thông xã Hương Liên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khôi phục đường giao thông xã Hương Liên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7903057',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khôi phục đường giao thông xã Hương Liên',
      '7903057',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 372: Khôi phục đập Khe Tra xã Phú Gia
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khôi phục đập Khe Tra xã Phú Gia')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7957356',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khôi phục đập Khe Tra xã Phú Gia',
      '7957356',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 373: Đường giao thông từ đường Hồ Chí Minh vào trung tâm xã Hương
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ đường Hồ Chí Minh vào trung tâm xã Hương Thuỷ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7669984',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ đường Hồ Chí Minh vào trung tâm xã Hương Thuỷ',
      '7669984',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 374: Khu xử lý chất thải rắn tại huyện Hương Khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khu xử lý chất thải rắn tại huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7704352',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khu xử lý chất thải rắn tại huyện Hương Khê',
      '7704352',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 375: Nhà hành chính quản trị 02 tầng Trường Tiểu học Hương Đô
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị 02 tầng Trường Tiểu học Hương Đô')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8053449',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị 02 tầng Trường Tiểu học Hương Đô',
      '8053449',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 376: Hệ thống cấp nước phục vụ khu xử lý chất thải rắn tại huyện 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống cấp nước phục vụ khu xử lý chất thải rắn tại huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026958',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống cấp nước phục vụ khu xử lý chất thải rắn tại huyện Hương Khê',
      '8026958',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 377: Nâng cấp đường huyện lộ 8 (ĐH93)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường huyện lộ 8 (ĐH93)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7990463',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường huyện lộ 8 (ĐH93)',
      '7990463',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 378: Trung tâm giáo dục nghề nghiệp - giáo dục thường xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trung tâm giáo dục nghề nghiệp - giáo dục thường xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026949',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trung tâm giáo dục nghề nghiệp - giáo dục thường xuyên',
      '8026949',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 379: Nâng cấp, cải tạo nhà làm việc 3 tầng và hạng mục phụ trợ Tr
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo nhà làm việc 3 tầng và hạng mục phụ trợ Trung tâm y tế huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7990184',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo nhà làm việc 3 tầng và hạng mục phụ trợ Trung tâm y tế huyện',
      '7990184',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 380: Nhà HCQT kết hợp phòng phục vụ học tập Trường Mầm non Hương 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà HCQT kết hợp phòng phục vụ học tập Trường Mầm non Hương Trạch')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025723',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà HCQT kết hợp phòng phục vụ học tập Trường Mầm non Hương Trạch',
      '8025723',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 381: Nhà hỗ trợ học tập 2 tầng THCS Hương Lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hỗ trợ học tập 2 tầng THCS Hương Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7947025',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hỗ trợ học tập 2 tầng THCS Hương Lâm',
      '7947025',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 382: Đường GTNT xóm 12,13 Hoà Hải
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xóm 12,13 Hoà Hải')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7926124',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xóm 12,13 Hoà Hải',
      '7926124',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 383: Nhà hành chính quản trị Trường Tiểu học Phúc Trạch
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị Trường Tiểu học Phúc Trạch')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025721',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị Trường Tiểu học Phúc Trạch',
      '8025721',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 384: Nhà học 2 tầng 6 phòng trường THCS Hương Trà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng 6 phòng trường THCS Hương Trà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7947024',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng 6 phòng trường THCS Hương Trà',
      '7947024',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 385: Nhà phục vụ 3 tầng 6 phòng Tiểu học Hương Đô
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà phục vụ 3 tầng 6 phòng Tiểu học Hương Đô')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999319',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà phục vụ 3 tầng 6 phòng Tiểu học Hương Đô',
      '7999319',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 386: Nhà hành chính quản trị kết hợp phòng phục vụ học tập Trường
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị kết hợp phòng phục vụ học tập Trường Mầm non Hương Trà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025715',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị kết hợp phòng phục vụ học tập Trường Mầm non Hương Trà',
      '8025715',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 387: Nâng cấp, cải tạo Trung tâm văn hoá truyền thông huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo Trung tâm văn hoá truyền thông huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7990452',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo Trung tâm văn hoá truyền thông huyện',
      '7990452',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 388: Cải tạo trụ sở cơ quan Huyện ủy, UBND huyện, trụ sở làm việc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo trụ sở cơ quan Huyện ủy, UBND huyện, trụ sở làm việc Trung tâm Ứng dụng khoa học kỹ thuật và Bảo vệ cây trồng, vật nuôi huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7957799',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo trụ sở cơ quan Huyện ủy, UBND huyện, trụ sở làm việc Trung tâm Ứng dụng khoa học kỹ thuật và Bảo vệ cây trồng, vật nuôi huyện',
      '7957799',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 389: Nâng cấp, cải tạo Trung tâm Văn hóa - Truyền thông huyện Hươ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo Trung tâm Văn hóa - Truyền thông huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7835060',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo Trung tâm Văn hóa - Truyền thông huyện Hương Khê',
      '7835060',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 390: Sửa chữa, bảo dưỡng Trụ sở làm việc Phòng Giáo dục và Đào tạ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, bảo dưỡng Trụ sở làm việc Phòng Giáo dục và Đào tạo')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8066750',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, bảo dưỡng Trụ sở làm việc Phòng Giáo dục và Đào tạo',
      '8066750',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 391: Nhà học 2T8P Tiểu học xã hương thuỷ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2T8P Tiểu học xã hương thuỷ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7902768',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2T8P Tiểu học xã hương thuỷ',
      '7902768',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 392: Nhà HCQT kết hợp phòng phục vụ học tập Trường mầm non Hương 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà HCQT kết hợp phòng phục vụ học tập Trường mầm non Hương Giang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025714',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà HCQT kết hợp phòng phục vụ học tập Trường mầm non Hương Giang',
      '8025714',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 393: Nhà học 1 tầng 4 phòng và các hạng mục phụ trợ Trường Mầm no
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 1 tầng 4 phòng và các hạng mục phụ trợ Trường Mầm non Hương Giang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7890935',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 1 tầng 4 phòng và các hạng mục phụ trợ Trường Mầm non Hương Giang',
      '7890935',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 394: Sửa chữa trụ sở làm việc Khối dân và nhà làm việc Phòng Tài 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa trụ sở làm việc Khối dân và nhà làm việc Phòng Tài nguyên & Môi trường cũ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026950',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa trụ sở làm việc Khối dân và nhà làm việc Phòng Tài nguyên & Môi trường cũ',
      '8026950',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 395: Nâng cấp, cải tạo Trường TH Hương Lâm (điểm chính và chúc A)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo Trường TH Hương Lâm (điểm chính và chúc A) và trường Mầm non (điểm thôn 10)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7955257',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo Trường TH Hương Lâm (điểm chính và chúc A) và trường Mầm non (điểm thôn 10)',
      '7955257',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 396: Khối hỗ trợ, phụ trợ học tập 2 tầng Trường Mầm non Hương Vĩn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối hỗ trợ, phụ trợ học tập 2 tầng Trường Mầm non Hương Vĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026956',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối hỗ trợ, phụ trợ học tập 2 tầng Trường Mầm non Hương Vĩnh',
      '8026956',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 397: Nhà bộ môn 2T4P THCS Hoà Hải
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà bộ môn 2T4P THCS Hoà Hải')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7946768',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà bộ môn 2T4P THCS Hoà Hải',
      '7946768',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 398: Khối phòng học và hỗ trợ học tập 2 tầng trường Mầm non Hương
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng học và hỗ trợ học tập 2 tầng trường Mầm non Hương Bình')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026954',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng học và hỗ trợ học tập 2 tầng trường Mầm non Hương Bình',
      '8026954',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 399: Nâng cấp, cải tạo trường THCS và TH phúc đồng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo trường THCS và TH phúc đồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018890',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo trường THCS và TH phúc đồng',
      '8018890',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 400: Khối phòng phục vụ học tập 2T6P Trường Tiểu học Hà Linh (điể
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng phục vụ học tập 2T6P Trường Tiểu học Hà Linh (điểm chính)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7959537',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng phục vụ học tập 2T6P Trường Tiểu học Hà Linh (điểm chính)',
      '7959537',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 401: Nhà văn hoá xã Điền Mỹ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hoá xã Điền Mỹ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7957358',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hoá xã Điền Mỹ',
      '7957358',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 402: Nhà học bộ môn 3T9P điểm Truông Bát, Tiểu học Hà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 3T9P điểm Truông Bát, Tiểu học Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999320',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 3T9P điểm Truông Bát, Tiểu học Hà Linh',
      '7999320',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 403: Nhà hành chính quản trị kết hợp phòng phục vụ học tập trường
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị kết hợp phòng phục vụ học tập trường mầm non Điền Mỹ (điểm chính)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7957791',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị kết hợp phòng phục vụ học tập trường mầm non Điền Mỹ (điểm chính)',
      '7957791',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 404: Nhà chức năng văn hoá 2 tầng xã Hà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà chức năng văn hoá 2 tầng xã Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7990454',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà chức năng văn hoá 2 tầng xã Hà Linh',
      '7990454',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 405: Nâng cấp, sửa chữa đường ĐH93 đoạn Hương Vĩnh đi Bản Giàng 2
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, sửa chữa đường ĐH93 đoạn Hương Vĩnh đi Bản Giàng 2 và đường ĐH87 đoạn qua xã Hương Thủy, Hương Giang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026947',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, sửa chữa đường ĐH93 đoạn Hương Vĩnh đi Bản Giàng 2 và đường ĐH87 đoạn qua xã Hương Thủy, Hương Giang',
      '8026947',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 406: Đường GT từ đường HCM đi khu xử lý chất thải rắn huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GT từ đường HCM đi khu xử lý chất thải rắn huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018898',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GT từ đường HCM đi khu xử lý chất thải rắn huyện',
      '8018898',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 407: Khối phòng học và hỗ trợ học tập 2 tầng Trường Mầm non Hương
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng học và hỗ trợ học tập 2 tầng Trường Mầm non Hương Trà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026955',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng học và hỗ trợ học tập 2 tầng Trường Mầm non Hương Trà',
      '8026955',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 408: Nhà học bộ môn kết hợp phòng phụ trợ học tập 2 tầng Trường t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn kết hợp phòng phụ trợ học tập 2 tầng Trường tiểu học Phúc Trạch')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026951',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn kết hợp phòng phụ trợ học tập 2 tầng Trường tiểu học Phúc Trạch',
      '8026951',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 409: Nhà hành chính quản trị kết hợp học tập, Trường tiểu học Hươ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị kết hợp học tập, Trường tiểu học Hương Lâm (điểm Chúc A)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7946116',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị kết hợp học tập, Trường tiểu học Hương Lâm (điểm Chúc A)',
      '7946116',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 410: Nâng cấp, cải tạo trường THCS Hương Lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo trường THCS Hương Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7921704',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo trường THCS Hương Lâm',
      '7921704',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 411: Khối phòng phụ trợ học tập 2 tầng THCS Hà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng phụ trợ học tập 2 tầng THCS Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025719',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng phụ trợ học tập 2 tầng THCS Hà Linh',
      '8025719',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 412: Nhà hành chính quản trị 02 tầng Trường THCS Phú Gia
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị 02 tầng Trường THCS Phú Gia')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7896620',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị 02 tầng Trường THCS Phú Gia',
      '7896620',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 413: Sửa chữa, nâng cấp hồ chứa nước Khe mui xã Hương lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, nâng cấp hồ chứa nước Khe mui xã Hương lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7964402',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, nâng cấp hồ chứa nước Khe mui xã Hương lâm',
      '7964402',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 414: Nâng cấp cải tạo mầm non Bông Sen
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp cải tạo mầm non Bông Sen')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018891',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp cải tạo mầm non Bông Sen',
      '8018891',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 415: Khối phòng phục vụ học tập 3T6P Trường Tiểu học Điền Mỹ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng phục vụ học tập 3T6P Trường Tiểu học Điền Mỹ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025722',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng phục vụ học tập 3T6P Trường Tiểu học Điền Mỹ',
      '8025722',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 416: Đường GTNT xóm Bình Giang xã Hương Bình
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xóm Bình Giang xã Hương Bình')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7944312',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xóm Bình Giang xã Hương Bình',
      '7944312',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 417: Nhà xưởng thực hành trung tâm giáo dục nghề nghiệp, giáo dục
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà xưởng thực hành trung tâm giáo dục nghề nghiệp, giáo dục thường xuyên huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7990474',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà xưởng thực hành trung tâm giáo dục nghề nghiệp, giáo dục thường xuyên huyện Hương Khê',
      '7990474',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 418: Nhà học bộ môn 02 tầng 6 phòng Trường Tiểu học Hương Lâm (đi
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 02 tầng 6 phòng Trường Tiểu học Hương Lâm (điểm chính)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7946769',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 02 tầng 6 phòng Trường Tiểu học Hương Lâm (điểm chính)',
      '7946769',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 419: Cầu dân sinh tại thôn 6,8,10 xã Hương Lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu dân sinh tại thôn 6,8,10 xã Hương Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018897',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu dân sinh tại thôn 6,8,10 xã Hương Lâm',
      '8018897',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 420: Cầu Khe trong, khe tuần
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Khe trong, khe tuần')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8053445',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Khe trong, khe tuần',
      '8053445',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 421: Nhà HCQT kết hợp phòng phục vụ học tập THCS Hương Giang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà HCQT kết hợp phòng phục vụ học tập THCS Hương Giang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026952',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà HCQT kết hợp phòng phục vụ học tập THCS Hương Giang',
      '8026952',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 422: Đường GTNT Hà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8002571',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT Hà Linh',
      '8002571',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 423: Nhà HCQT 2 tầng, TH Phúc Đồng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà HCQT 2 tầng, TH Phúc Đồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7946767',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà HCQT 2 tầng, TH Phúc Đồng',
      '7946767',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 424: Đường GT huyện lộ 12 (ĐH97) đoạn qua xã Gia Phố
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GT huyện lộ 12 (ĐH97) đoạn qua xã Gia Phố')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999324',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GT huyện lộ 12 (ĐH97) đoạn qua xã Gia Phố',
      '7999324',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 425: Nhà chức năng văn hoá 02 tầng xã Hương Lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà chức năng văn hoá 02 tầng xã Hương Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7990453',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà chức năng văn hoá 02 tầng xã Hương Lâm',
      '7990453',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 426: Đường giao thông từ cầu Chợ Hôm đến khu hạ tầng tránh lũ xã 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ cầu Chợ Hôm đến khu hạ tầng tránh lũ xã Điền Mỹ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7946770',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ cầu Chợ Hôm đến khu hạ tầng tránh lũ xã Điền Mỹ',
      '7946770',
      3,
      'T',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 427: Đường GTNT xã Hương Thuỷ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xã Hương Thuỷ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7942220',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xã Hương Thuỷ',
      '7942220',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 428: Nhà HCQT 2 tầng THCS Phương Điền
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà HCQT 2 tầng THCS Phương Điền')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025718',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà HCQT 2 tầng THCS Phương Điền',
      '8025718',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 429: Nhà học bộ môn 2 tầng 6 phòng trường THCS Hương Trà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 2 tầng 6 phòng trường THCS Hương Trà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7842909',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 2 tầng 6 phòng trường THCS Hương Trà',
      '7842909',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 430: Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Trung Thượn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Trung Thượng, xã Lộc Yên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8156240',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Trung Thượng, xã Lộc Yên',
      '8156240',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 431: Nhà hành chính quản trị 02 tầng Trường THCS Hương Trạch
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị 02 tầng Trường THCS Hương Trạch')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7913871',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị 02 tầng Trường THCS Hương Trạch',
      '7913871',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 432: Nhà phục vụ học tập 4 phòng 1 tầng trường Tiểu học Hương Trạ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà phục vụ học tập 4 phòng 1 tầng trường Tiểu học Hương Trạch (điểm La Khê), huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7913872',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà phục vụ học tập 4 phòng 1 tầng trường Tiểu học Hương Trạch (điểm La Khê), huyện Hương Khê',
      '7913872',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 433: Nâng cấp, cải tạo Trường mầm non Hương Liên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo Trường mầm non Hương Liên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999321',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo Trường mầm non Hương Liên',
      '7999321',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 434: Nâng cấp, sửa chữa dãy nhà tiếp công dân, dãy nhà Thanh tra-
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, sửa chữa dãy nhà tiếp công dân, dãy nhà Thanh tra-Thống kê, dãy nhà lãnh đạo thuộc trụ sơ Cơ quan UBND huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7743739',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, sửa chữa dãy nhà tiếp công dân, dãy nhà Thanh tra-Thống kê, dãy nhà lãnh đạo thuộc trụ sơ Cơ quan UBND huyện',
      '7743739',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 435: Cải tạo nhà ăn, nhà bếp, nhà thể thao, phòng làm việc thuộc 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo nhà ăn, nhà bếp, nhà thể thao, phòng làm việc thuộc trụ sở UBND huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7875149',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo nhà ăn, nhà bếp, nhà thể thao, phòng làm việc thuộc trụ sở UBND huyện',
      '7875149',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 436: Nâng cấp khuôn viên Trung tâm Hành chính công huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp khuôn viên Trung tâm Hành chính công huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7894470',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp khuôn viên Trung tâm Hành chính công huyện',
      '7894470',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 437: Nhà học bộ môn 03 tầng Trường THCS Phú Gia
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 03 tầng Trường THCS Phú Gia')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7947026',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 03 tầng Trường THCS Phú Gia',
      '7947026',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 438: Nâng cấp, cải tạo Trung tâm giáo dục nghề nghiệp - Giáo dục 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo Trung tâm giáo dục nghề nghiệp - Giáo dục thường xuyên huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7990451',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo Trung tâm giáo dục nghề nghiệp - Giáo dục thường xuyên huyện Hương Khê',
      '7990451',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 439: Cải tạo, nâng cấp Hội trường lớn và Trụ sở làm việc UBND huy
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, nâng cấp Hội trường lớn và Trụ sở làm việc UBND huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7573535',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, nâng cấp Hội trường lớn và Trụ sở làm việc UBND huyện',
      '7573535',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 440: Nâng cấp, cải tạo Trung tâm hành chính công huyện Hương Khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo Trung tâm hành chính công huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7709956',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo Trung tâm hành chính công huyện Hương Khê',
      '7709956',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 441: Nâng cấp đường giao thông vào trung tâm xã Hương Long
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường giao thông vào trung tâm xã Hương Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7946215',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường giao thông vào trung tâm xã Hương Long',
      '7946215',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 442: Nhà hành chính quản trị 2 tầng - Trường Tiểu học Hương Giang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị 2 tầng - Trường Tiểu học Hương Giang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7842905',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị 2 tầng - Trường Tiểu học Hương Giang',
      '7842905',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 443: Nhà học bộ môn 2 tầng 6 phòng trường Mầm non Hương Thủy
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 2 tầng 6 phòng trường Mầm non Hương Thủy')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7842906',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 2 tầng 6 phòng trường Mầm non Hương Thủy',
      '7842906',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 444: Nâng cấp, cải tạo trường THPT Gia Phố cũ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo trường THPT Gia Phố cũ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7910257',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo trường THPT Gia Phố cũ',
      '7910257',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 445: Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Trung Hải, 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Trung Hải, xã Gia Phố')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = 'XHH3',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Trung Hải, xã Gia Phố',
      'XHH3',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 446: Nhà học 2 tầng 4 phòng Trường Mầm non xã Hương Vĩnh, huyện H
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng 4 phòng Trường Mầm non xã Hương Vĩnh, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7743738',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng 4 phòng Trường Mầm non xã Hương Vĩnh, huyện Hương Khê',
      '7743738',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 447: Nhà học bộ môn 2 tầng trường THCS Hương Lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 2 tầng trường THCS Hương Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7842907',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 2 tầng trường THCS Hương Lâm',
      '7842907',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 448: Nhà hành chính quản tri 02 tầng trường TH Hương Xuân
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản tri 02 tầng trường TH Hương Xuân')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7909982',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản tri 02 tầng trường TH Hương Xuân',
      '7909982',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 449: Nhà hành chính quản trị 02 tầng Trường THCS Hương Lâm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị 02 tầng Trường THCS Hương Lâm')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7902753',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị 02 tầng Trường THCS Hương Lâm',
      '7902753',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 450: Nhà hành chính quản trị kết hợp phòng phục vụ học tập Trường
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị kết hợp phòng phục vụ học tập Trường Mầm non Hương Lâm (điểm chính)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7951423',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị kết hợp phòng phục vụ học tập Trường Mầm non Hương Lâm (điểm chính)',
      '7951423',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 451: Nhà hành chính quản trị Trường Tiểu học xã Hương Lâm (điểm c
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị Trường Tiểu học xã Hương Lâm (điểm chính)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7951424',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị Trường Tiểu học xã Hương Lâm (điểm chính)',
      '7951424',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 452: Sửa chữa, nâng cấp tràn đập Làng xã Hương Bình
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, nâng cấp tràn đập Làng xã Hương Bình')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7868259',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, nâng cấp tràn đập Làng xã Hương Bình',
      '7868259',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 453: Nhà làm việc 02 tầng Trụ sở UBND xã Hương Bình
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà làm việc 02 tầng Trụ sở UBND xã Hương Bình')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7889262',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà làm việc 02 tầng Trụ sở UBND xã Hương Bình',
      '7889262',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 454: Nhà hành chính quản trị kết hợp phòng phục vụ học tập trường
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị kết hợp phòng phục vụ học tập trường Mầm non Phúc Đồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7894475',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị kết hợp phòng phục vụ học tập trường Mầm non Phúc Đồng',
      '7894475',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 455: Nhà hành chính quản trị 02 tầng Trường THCS Phúc Đồng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị 02 tầng Trường THCS Phúc Đồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7900141',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị 02 tầng Trường THCS Phúc Đồng',
      '7900141',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 456: Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Tân Thượng,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Tân Thượng, xã Hòa Hải')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8129809',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Tân Thượng, xã Hòa Hải',
      '8129809',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 457: Nhà hành chính quản trị kết hợp phục vụ học tập 3 tầng trườn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị kết hợp phục vụ học tập 3 tầng trường Tiểu học Hòa Hải')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7914215',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị kết hợp phục vụ học tập 3 tầng trường Tiểu học Hòa Hải',
      '7914215',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 458: Đường giao thông nông thôn xóm 5, xã Phúc Đồng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nông thôn xóm 5, xã Phúc Đồng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7921874',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nông thôn xóm 5, xã Phúc Đồng',
      '7921874',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 459: Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Tân Trung, 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Tân Trung, xã Hoà Hải')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = 'XHH5',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Tân Trung, xã Hoà Hải',
      'XHH5',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 460: Nhà văn hóa xã Hà Linh, huyện Hương Khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa xã Hà Linh, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7855994',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa xã Hà Linh, huyện Hương Khê',
      '7855994',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 461: Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Trung Tiến,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Trung Tiến, xã Điền Mỹ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = 'XHH6',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Trung Tiến, xã Điền Mỹ',
      'XHH6',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 462: Sửa chữa, nâng cấp đập Cơn Hương, xã Hà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, nâng cấp đập Cơn Hương, xã Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7868258',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, nâng cấp đập Cơn Hương, xã Hà Linh',
      '7868258',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 463: Nhà văn hoá cộng đồng kết hợp tránh bão, lũ thôn 5 xã Hà Lin
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hoá cộng đồng kết hợp tránh bão, lũ thôn 5 xã Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = 'XHH7',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hoá cộng đồng kết hợp tránh bão, lũ thôn 5 xã Hà Linh',
      'XHH7',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 464: Nhà học bộ môn 02 tầng trường THCS xã Hà Linh huyện Hương Kh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 02 tầng trường THCS xã Hà Linh huyện Hương Khê tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8129807',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 02 tầng trường THCS xã Hà Linh huyện Hương Khê tỉnh Hà Tĩnh',
      '8129807',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 465: Trường Tiểu học, trường THCS các xã: Hương Giang, Hươn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trường Tiểu học, trường THCS các xã: Hương Giang, Hương Xuân, huyện Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7801450',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trường Tiểu học, trường THCS các xã: Hương Giang, Hương Xuân, huyện Hương Khê',
      '7801450',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 466: Xây dựng, nâng cấp các tuyến đường ngoài hàng rào ch
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng, nâng cấp các tuyến đường ngoài hàng rào chợ Huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7801459',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng, nâng cấp các tuyến đường ngoài hàng rào chợ Huyện',
      '7801459',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 467: Nâng cấp, cải tạo nhà văn hóa xã Phúc Đồng và xây mới phòng 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo nhà văn hóa xã Phúc Đồng và xây mới phòng chức năng văn hóa xã Phúc Đồng và Lộc Yên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7896621',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo nhà văn hóa xã Phúc Đồng và xây mới phòng chức năng văn hóa xã Phúc Đồng và Lộc Yên',
      '7896621',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 468: Khối phục vụ học tập 2 tầng Trường THCS Phúc Trạch
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phục vụ học tập 2 tầng Trường THCS Phúc Trạch')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025720',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phục vụ học tập 2 tầng Trường THCS Phúc Trạch',
      '8025720',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 469: Kiên cố hoá trường Mầm non, trường Tiểu học xã Hương Long và
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Kiên cố hoá trường Mầm non, trường Tiểu học xã Hương Long và xã Phú Gia')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7906804',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Kiên cố hoá trường Mầm non, trường Tiểu học xã Hương Long và xã Phú Gia',
      '7906804',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 470: Cải tạo, sửa chữa trường Mầm non Bông Sen Thị trấn H
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, sửa chữa trường Mầm non Bông Sen Thị trấn Hương Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7795861',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, sửa chữa trường Mầm non Bông Sen Thị trấn Hương Khê',
      '7795861',
      3,
      'H',
      'Hương Khê',
      '2140',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 471: Đường vào các xã Hà Linh, Hương Thủy, Hương Giang, Lộ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường vào các xã Hà Linh, Hương Thủy, Hương Giang, Lộc Yên, Hương Đô, Phúc Trạch huyện Hương Khê (đoạn từ km 15+642,72 đến km 25+252,86)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7810104',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '3026',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường vào các xã Hà Linh, Hương Thủy, Hương Giang, Lộc Yên, Hương Đô, Phúc Trạch huyện Hương Khê (đoạn từ km 15+642,72 đến km 25+252,86)',
      '7810104',
      3,
      'T',
      'Hương Khê',
      '3026',
      7,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 472: Công trình Xây dựng kênh tiêu Vĩnh Phong, Yên Thọ xã Hộ Độ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Công trình Xây dựng kênh tiêu Vĩnh Phong, Yên Thọ xã Hộ Độ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8043918',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '3455',
      current_status_code   = 7,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Công trình Xây dựng kênh tiêu Vĩnh Phong, Yên Thọ xã Hộ Độ',
      '8043918',
      3,
      'H',
      'Thạch Hà',
      '3455',
      7,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 473: Dự án đầu tư xây mới, nâng cấp, cải tạo 19 Trạm y tế xã, tỉn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án đầu tư xây mới, nâng cấp, cải tạo 19 Trạm y tế xã, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7980684',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 8,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án đầu tư xây mới, nâng cấp, cải tạo 19 Trạm y tế xã, tỉnh Hà Tĩnh',
      '7980684',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      8,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 474: Đường vào trung tâm xã Trung Lễ, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường vào trung tâm xã Trung Lễ, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7292495',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3026',
      current_status_code   = 8,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường vào trung tâm xã Trung Lễ, huyện Đức Thọ',
      '7292495',
      1,
      'H',
      'Đức Thọ',
      '3026',
      8,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 475: Nâng cấp, mở rộng đường Tỉnh lộ 21
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường Tỉnh lộ 21')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7187999',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 8,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường Tỉnh lộ 21',
      '7187999',
      3,
      'T',
      'Thạch Hà',
      '2140',
      8,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 476: Xây dựng đường giao thông nội vùng khu trung tâm hành chính 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng đường giao thông nội vùng khu trung tâm hành chính huyện Lộc Hà (giai đoạn 2)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7897322',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 8,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng đường giao thông nội vùng khu trung tâm hành chính huyện Lộc Hà (giai đoạn 2)',
      '7897322',
      3,
      'H',
      'Thạch Hà',
      '2140',
      8,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 477: Đường giao thông từ Le Ve Cửa Trẹm đến Vùng Cồn Trửa
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ Le Ve Cửa Trẹm đến Vùng Cồn Trửa và Bải rác xã Hồng Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7910838',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 8,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ Le Ve Cửa Trẹm đến Vùng Cồn Trửa và Bải rác xã Hồng Lộc',
      '7910838',
      3,
      'H',
      'Thạch Hà',
      '2140',
      8,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 478: Nâng cấp, cải tạo trụ sở HĐND và UBND huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo trụ sở HĐND và UBND huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7294340',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo trụ sở HĐND và UBND huyện Vũ Quang',
      '7294340',
      1,
      'T',
      'Vũ Quang',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 479: Hệ thống điện vào khu chăn nuôi tập trung xã Đức Bồng huyện 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống điện vào khu chăn nuôi tập trung xã Đức Bồng huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7440943',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống điện vào khu chăn nuôi tập trung xã Đức Bồng huyện Vũ Quang',
      '7440943',
      1,
      'H',
      'Vũ Quang',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 480: Hệ thống điện vào khu chăn nuôi tập trung xã Đức Giang, huyệ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống điện vào khu chăn nuôi tập trung xã Đức Giang, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7489421',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống điện vào khu chăn nuôi tập trung xã Đức Giang, huyện Vũ Quang',
      '7489421',
      1,
      'H',
      'Vũ Quang',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 481: Hệ thống điện vào khu chăn nuôi tập trung xã Đức Hương huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống điện vào khu chăn nuôi tập trung xã Đức Hương huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7440942',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống điện vào khu chăn nuôi tập trung xã Đức Hương huyện Vũ Quang',
      '7440942',
      1,
      'H',
      'Vũ Quang',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 482: Nhà thư viện tiên tiến, sân chơi, bãi tập và các hạng mục ph
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà thư viện tiên tiến, sân chơi, bãi tập và các hạng mục phụ trợ thuộc trường tiểu học Hương Minh, xã Hương Minh, huyện Vũ Quang, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = 'XHH8',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà thư viện tiên tiến, sân chơi, bãi tập và các hạng mục phụ trợ thuộc trường tiểu học Hương Minh, xã Hương Minh, huyện Vũ Quang, tỉnh Hà Tĩnh',
      'XHH8',
      1,
      'H',
      'Vũ Quang',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 483: Khu tập thể giáo viên 1 tầng, trường trung học phổ thông Cù 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khu tập thể giáo viên 1 tầng, trường trung học phổ thông Cù Huy Cận, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = 'XHH9',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khu tập thể giáo viên 1 tầng, trường trung học phổ thông Cù Huy Cận, huyện Vũ Quang',
      'XHH9',
      1,
      'H',
      'Vũ Quang',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 484: Dự án Khắc phục sạt lở bờ sông Ngàn Phố, đoạn qua xã Trường 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Khắc phục sạt lở bờ sông Ngàn Phố, đoạn qua xã Trường Sơn, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8078085',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Khắc phục sạt lở bờ sông Ngàn Phố, đoạn qua xã Trường Sơn, huyện Đức Thọ',
      '8078085',
      1,
      'T',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 485: Dự án Đường Trục xã 01 xã Bùi La Nhân, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường Trục xã 01 xã Bùi La Nhân, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8071083',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường Trục xã 01 xã Bùi La Nhân, huyện Đức Thọ',
      '8071083',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 486: Dự án Cải tạo, nâng cấp nhà văn hóa, nhà làm việc 2 tầng và 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cải tạo, nâng cấp nhà văn hóa, nhà làm việc 2 tầng và các hạng mục phụ trợ Trụ sở HĐND - UBND huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8114174',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cải tạo, nâng cấp nhà văn hóa, nhà làm việc 2 tầng và các hạng mục phụ trợ Trụ sở HĐND - UBND huyện Đức Thọ',
      '8114174',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 487: Dự án Nâng cấp hệ thống tưới tiêu Hói Tùng, xã Tùng Châu, hu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nâng cấp hệ thống tưới tiêu Hói Tùng, xã Tùng Châu, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8027878',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nâng cấp hệ thống tưới tiêu Hói Tùng, xã Tùng Châu, huyện Đức Thọ',
      '8027878',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 488: Dự án Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Lai Đ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Lai Đồng, xã Đức Đồng, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8094293',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Lai Đồng, xã Đức Đồng, huyện Đức Thọ',
      '8094293',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 489: Dự án Sửa chữa, nâng cấp hệ thống kênh mương Đập Trạ, xã Đức
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Sửa chữa, nâng cấp hệ thống kênh mương Đập Trạ, xã Đức Lạng, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8062894',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Sửa chữa, nâng cấp hệ thống kênh mương Đập Trạ, xã Đức Lạng, huyện Đức Thọ',
      '8062894',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 490: Dự án Đường giao thông tổ dân phố 3, 4 và tổ dân phố 8, thị 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông tổ dân phố 3, 4 và tổ dân phố 8, thị trấn Đức Thọ, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7980677',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông tổ dân phố 3, 4 và tổ dân phố 8, thị trấn Đức Thọ, huyện Đức Thọ',
      '7980677',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 491: Dự án Trường THCS Lê Ninh, huyện Đức Thọ - Hạng mục: Nhà học
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Trường THCS Lê Ninh, huyện Đức Thọ - Hạng mục: Nhà học bộ môn 2 tầng 6 phòng; Nhà đa năng; Khuôn viên trường')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7993038',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Trường THCS Lê Ninh, huyện Đức Thọ - Hạng mục: Nhà học bộ môn 2 tầng 6 phòng; Nhà đa năng; Khuôn viên trường',
      '7993038',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 492: Dự án Cầu Rào Cạn và đường hai đầu cầu, xã Hòa Lạc, huyện Đứ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cầu Rào Cạn và đường hai đầu cầu, xã Hòa Lạc, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8020026',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cầu Rào Cạn và đường hai đầu cầu, xã Hòa Lạc, huyện Đức Thọ',
      '8020026',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 493: Dự án Trường mầm non Đức Dũng, huyện Đức Thọ; Hạng mục: Xây 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Trường mầm non Đức Dũng, huyện Đức Thọ; Hạng mục: Xây dựng nhà học 2 tầng 4 phòng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018186',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Trường mầm non Đức Dũng, huyện Đức Thọ; Hạng mục: Xây dựng nhà học 2 tầng 4 phòng',
      '8018186',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 494: Dự án Xây dựng điểm check in tại bến Tam Soa, xã Tùng Ảnh, h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Xây dựng điểm check in tại bến Tam Soa, xã Tùng Ảnh, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8131826',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Xây dựng điểm check in tại bến Tam Soa, xã Tùng Ảnh, huyện Đức Thọ',
      '8131826',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 495: Dự án Cầu Bến Lỗ, thôn Đồng Vịnh, xã Đức Đồng, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cầu Bến Lỗ, thôn Đồng Vịnh, xã Đức Đồng, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8071075',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cầu Bến Lỗ, thôn Đồng Vịnh, xã Đức Đồng, huyện Đức Thọ',
      '8071075',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 496: Dự án Cải tạo đường vào Khu di tích Cố Tổng bí thư Trần Phú,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cải tạo đường vào Khu di tích Cố Tổng bí thư Trần Phú, xã Tùng Ảnh, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8079695',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cải tạo đường vào Khu di tích Cố Tổng bí thư Trần Phú, xã Tùng Ảnh, huyện Đức Thọ',
      '8079695',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 497: Dự án Đường liên xã Trung Lễ - Bùi Xá huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường liên xã Trung Lễ - Bùi Xá huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7687589',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường liên xã Trung Lễ - Bùi Xá huyện Đức Thọ',
      '7687589',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 498: Dự án Đường giao thông xã Đức Thanh huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông xã Đức Thanh huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7626324',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông xã Đức Thanh huyện Đức Thọ',
      '7626324',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 499: Dự án Sửa chữa, nâng cấp hồ Bàu Quán, thôn Đông Thái, xã Tùn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Sửa chữa, nâng cấp hồ Bàu Quán, thôn Đông Thái, xã Tùng Ảnh, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8062923',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Sửa chữa, nâng cấp hồ Bàu Quán, thôn Đông Thái, xã Tùng Ảnh, huyện Đức Thọ',
      '8062923',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 500: Dự án Hội trường HDND - UBND huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Hội trường HDND - UBND huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7646339',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Hội trường HDND - UBND huyện Đức Thọ',
      '7646339',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 501: Dự án Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Yên C
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Yên Cường, xã Hòa Lạc, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8094294',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Yên Cường, xã Hòa Lạc, huyện Đức Thọ',
      '8094294',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 502: Dự án Đường liên thôn Trại Trắn - Yên Cường, xã Hòa Lạc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường liên thôn Trại Trắn - Yên Cường, xã Hòa Lạc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8042564',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường liên thôn Trại Trắn - Yên Cường, xã Hòa Lạc',
      '8042564',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 503: Dự án Hội trường khối dân huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Hội trường khối dân huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7648113',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Hội trường khối dân huyện Đức Thọ',
      '7648113',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 504: Dự án Đường giao thông xã Yên Hồ, huyện Đức Thọ (trục xã 09)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông xã Yên Hồ, huyện Đức Thọ (trục xã 09)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8072345',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông xã Yên Hồ, huyện Đức Thọ (trục xã 09)',
      '8072345',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 505: Dự án Cầu Kênh số 1, xã Tùng Ảnh, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cầu Kênh số 1, xã Tùng Ảnh, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8064111',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cầu Kênh số 1, xã Tùng Ảnh, huyện Đức Thọ',
      '8064111',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 506: Dự án Khăc phục, sửa chữa Hồ chứa nước Ao Sen, xã Đức Lập, h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Khăc phục, sửa chữa Hồ chứa nước Ao Sen, xã Đức Lập, huyện Đức Thọ, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7425552',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Khăc phục, sửa chữa Hồ chứa nước Ao Sen, xã Đức Lập, huyện Đức Thọ, tỉnh Hà Tĩnh',
      '7425552',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 507: Dự án Kênh tiêu úng thị trấn Đức Thọ, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Kênh tiêu úng thị trấn Đức Thọ, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7944138',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Kênh tiêu úng thị trấn Đức Thọ, huyện Đức Thọ',
      '7944138',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 508: Dự án Bể bơi phục vụ thi đấu thể dục thể thao các trường học
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Bể bơi phục vụ thi đấu thể dục thể thao các trường học - Trường tiểu học Đức Yên, thị trấn Đức Thọ, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8088008',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Bể bơi phục vụ thi đấu thể dục thể thao các trường học - Trường tiểu học Đức Yên, thị trấn Đức Thọ, huyện Đức Thọ',
      '8088008',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 509: Dự án Cải tạo Nhà ăn, Nhà tập luyện thể thao và các công trì
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cải tạo Nhà ăn, Nhà tập luyện thể thao và các công trình phụ trợ Trụ sở Ủy ban nhân dân huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8053437',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cải tạo Nhà ăn, Nhà tập luyện thể thao và các công trình phụ trợ Trụ sở Ủy ban nhân dân huyện Đức Thọ',
      '8053437',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 510: Dự án Đường giao thông xã Trường Sơn, huyện Đức Thọ (trục xã
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông xã Trường Sơn, huyện Đức Thọ (trục xã 21)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8062891',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông xã Trường Sơn, huyện Đức Thọ (trục xã 21)',
      '8062891',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 511: Dự án Cải tạo, nâng cấp Trung tâm hành chính công huyện Đức 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cải tạo, nâng cấp Trung tâm hành chính công huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8050829',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cải tạo, nâng cấp Trung tâm hành chính công huyện Đức Thọ',
      '8050829',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 512: Dự án Khối phòng học, phòng chức năng 2 tầng trường mầm non 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Khối phòng học, phòng chức năng 2 tầng trường mầm non Tùng Châu, xã Tùng Châu, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8097448',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Khối phòng học, phòng chức năng 2 tầng trường mầm non Tùng Châu, xã Tùng Châu, huyện Đức Thọ',
      '8097448',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 513: Dự án Đường giao thông trục chính thôn Ninh Thái, xã Trường 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông trục chính thôn Ninh Thái, xã Trường Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8042563',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông trục chính thôn Ninh Thái, xã Trường Sơn',
      '8042563',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 514: Khối phòng học chức năng và hỗ trợ học tập 02 tầng 06 phòng,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng học chức năng và hỗ trợ học tập 02 tầng 06 phòng, trường tiểu học Quang Vĩnh, xã Quang Vĩnh, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8059061',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng học chức năng và hỗ trợ học tập 02 tầng 06 phòng, trường tiểu học Quang Vĩnh, xã Quang Vĩnh, huyện Đức Thọ',
      '8059061',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 515: Dự án Cải tạo, nâng cấp nghĩa trang liệt sỹ huyện Đức Thọ - 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cải tạo, nâng cấp nghĩa trang liệt sỹ huyện Đức Thọ - Hạng mục: Cải tạo nhà điều hành, hệ thống điện khu bia, làm nhà vệ sinh và hệ thống cấp nước')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8050830',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cải tạo, nâng cấp nghĩa trang liệt sỹ huyện Đức Thọ - Hạng mục: Cải tạo nhà điều hành, hệ thống điện khu bia, làm nhà vệ sinh và hệ thống cấp nước',
      '8050830',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 516: Dự án Chỉnh trang, nâng cấp cơ sở hạ tầng các tuyến đường tr
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Chỉnh trang, nâng cấp cơ sở hạ tầng các tuyến đường trục chính trung tâm huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8079694',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Chỉnh trang, nâng cấp cơ sở hạ tầng các tuyến đường trục chính trung tâm huyện Đức Thọ',
      '8079694',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 517: Dự án Sửa chữa, nâng cấp hệ thống chiếu sáng công cộng bằng 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Sửa chữa, nâng cấp hệ thống chiếu sáng công cộng bằng đèn Led trên địa bàn huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8050828',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Sửa chữa, nâng cấp hệ thống chiếu sáng công cộng bằng đèn Led trên địa bàn huyện Đức Thọ',
      '8050828',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 518: Dự án Nâng cấp tuyến đường huyện ĐH53, huyện Đức Thọ (đoạn t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Nâng cấp tuyến đường huyện ĐH53, huyện Đức Thọ (đoạn từ QL15 đến đường sắt xã Liên Minh)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8071077',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Nâng cấp tuyến đường huyện ĐH53, huyện Đức Thọ (đoạn từ QL15 đến đường sắt xã Liên Minh)',
      '8071077',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 519: Dự án Đường trục xã 30 (TX30) đoạn qua xã Tân Dân, huyện Đức
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường trục xã 30 (TX30) đoạn qua xã Tân Dân, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8071080',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường trục xã 30 (TX30) đoạn qua xã Tân Dân, huyện Đức Thọ',
      '8071080',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 520: Dự án Xây dựng các trường học do quỹ Thiện Tâm - Tập đoàn Vi
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Xây dựng các trường học do quỹ Thiện Tâm - Tập đoàn Vingroup tài trợ trên địa bàn huyện Đức Thọ. HM: Nhà học 2 tầng 6 phòng trường MN Liên Minh xã Liên Minh và nhà học 2 tầng 4 phòng trường MN Trường Sơn xã Trường Sơn, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7845552',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Xây dựng các trường học do quỹ Thiện Tâm - Tập đoàn Vingroup tài trợ trên địa bàn huyện Đức Thọ. HM: Nhà học 2 tầng 6 phòng trường MN Liên Minh xã Liên Minh và nhà học 2 tầng 4 phòng trường MN Trường Sơn xã Trường Sơn, huyện Đức Thọ',
      '7845552',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 521: Dự án Đường giao thông tổ dân phố Đại Lợi và tổ dân phố 7, t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông tổ dân phố Đại Lợi và tổ dân phố 7, thị trấn Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8076773',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông tổ dân phố Đại Lợi và tổ dân phố 7, thị trấn Đức Thọ',
      '8076773',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 522: Dự án Cải tạo, nâng cấp khuôn viên trước cổng bệnh viện đa k
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cải tạo, nâng cấp khuôn viên trước cổng bệnh viện đa khoa Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8019139',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cải tạo, nâng cấp khuôn viên trước cổng bệnh viện đa khoa Đức Thọ',
      '8019139',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 523: Dự án Đường giao thông nội vùng xã Liên Minh huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường giao thông nội vùng xã Liên Minh huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7705254',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường giao thông nội vùng xã Liên Minh huyện Đức Thọ',
      '7705254',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 524: Dự án Cổng trang trí đèn Led đoạn Ngã tư Yên Trung đến Khu l
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cổng trang trí đèn Led đoạn Ngã tư Yên Trung đến Khu lưu niệm Trần Phú và 02 nút giao QL8A, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7927747',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cổng trang trí đèn Led đoạn Ngã tư Yên Trung đến Khu lưu niệm Trần Phú và 02 nút giao QL8A, huyện Đức Thọ',
      '7927747',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 525: Dự án Cải tạo, nâng cấp bến Tam Soa, xã Tùng Ảnh, huyện Đức 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cải tạo, nâng cấp bến Tam Soa, xã Tùng Ảnh, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7931983',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cải tạo, nâng cấp bến Tam Soa, xã Tùng Ảnh, huyện Đức Thọ',
      '7931983',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 526: Dự án Thay thế bó vỉa đường Yên Trung, Thị trấn Đức Thọ, huy
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Thay thế bó vỉa đường Yên Trung, Thị trấn Đức Thọ, huyện Đức Thọ (phía phải tuyến)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7892100',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Thay thế bó vỉa đường Yên Trung, Thị trấn Đức Thọ, huyện Đức Thọ (phía phải tuyến)',
      '7892100',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 527: Dự án Chỉnh trang, nâng cấp hệ thống vỉa hè tuyến đường Phan
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Chỉnh trang, nâng cấp hệ thống vỉa hè tuyến đường Phan Đình Phùng, thị trấn Đức Thọ (đoạn từ cầu Đôi 2 đến Ngã tư Bà Viên)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8079696',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Chỉnh trang, nâng cấp hệ thống vỉa hè tuyến đường Phan Đình Phùng, thị trấn Đức Thọ (đoạn từ cầu Đôi 2 đến Ngã tư Bà Viên)',
      '8079696',
      1,
      'H',
      'Đức Thọ',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 528: Đường dốc Bà toàn - Hương Thọ (đoạn từ thôn Đồng Minh xã Hươ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường dốc Bà toàn - Hương Thọ (đoạn từ thôn Đồng Minh xã Hương Minh đến thôn 2 xã Hương Thọ), huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7851159',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường dốc Bà toàn - Hương Thọ (đoạn từ thôn Đồng Minh xã Hương Minh đến thôn 2 xã Hương Thọ), huyện Vũ Quang',
      '7851159',
      1,
      'T',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 529: Cầu Cửa Rào, huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Cửa Rào, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7770171',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Cửa Rào, huyện Vũ Quang',
      '7770171',
      1,
      'T',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 530: Sống chung với lũ huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sống chung với lũ huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7750092',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sống chung với lũ huyện Vũ Quang',
      '7750092',
      1,
      'T',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 531: Cầu Liên Hòa, huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Liên Hòa, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7674976',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Liên Hòa, huyện Vũ Quang',
      '7674976',
      1,
      'T',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 532: Đường giao thông liên xã Đức Lĩnh đi Thị trấn Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên xã Đức Lĩnh đi Thị trấn Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7509845',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên xã Đức Lĩnh đi Thị trấn Vũ Quang',
      '7509845',
      1,
      'T',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 533: Đường GTNT trục xã (Tuyến Ân Phú Cửa Rào - Ông Thực - Đập tr
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT trục xã (Tuyến Ân Phú Cửa Rào - Ông Thực - Đập tràn Hương Giang), xã Đức Hương')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8074706',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT trục xã (Tuyến Ân Phú Cửa Rào - Ông Thực - Đập tràn Hương Giang), xã Đức Hương',
      '8074706',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 534: Nâng cấp, sửa chữa đường 71 xã Hương Minh (Điểm đầu ngõ bà L
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, sửa chữa đường 71 xã Hương Minh (Điểm đầu ngõ bà Liên thôn Hợp Trùa, điểm cuối ngõ ông Lịch thôn Hợp Duận)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8074707',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, sửa chữa đường 71 xã Hương Minh (Điểm đầu ngõ bà Liên thôn Hợp Trùa, điểm cuối ngõ ông Lịch thôn Hợp Duận)',
      '8074707',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 535: Đường giao thông nội thị TDP6 thị trấn Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nội thị TDP6 thị trấn Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8074708',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nội thị TDP6 thị trấn Vũ Quang',
      '8074708',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 536: Đường GTNT xã Đức Giang (tuyến cổng ông Vinh - ông Thiệu, th
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xã Đức Giang (tuyến cổng ông Vinh - ông Thiệu, thôn 3 Bồng Giang), huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8121501',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xã Đức Giang (tuyến cổng ông Vinh - ông Thiệu, thôn 3 Bồng Giang), huyện Vũ Quang',
      '8121501',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 537: Xây dựng Kè chống sạt lở đường trục xã tại thôn 6 (đoạn từ n
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng Kè chống sạt lở đường trục xã tại thôn 6 (đoạn từ nhà anh Thông đến nhà anh Thành), xã Thọ Điền')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8126748',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng Kè chống sạt lở đường trục xã tại thôn 6 (đoạn từ nhà anh Thông đến nhà anh Thành), xã Thọ Điền',
      '8126748',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 538: Sửa chữa, cải tạo hệ thống điện chiếu sáng đường Phan Đình P
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, cải tạo hệ thống điện chiếu sáng đường Phan Đình Phùng và xây dựng mới hệ thống điện chiếu sáng đường Phan Đình Phùng kéo dài')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8126750',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, cải tạo hệ thống điện chiếu sáng đường Phan Đình Phùng và xây dựng mới hệ thống điện chiếu sáng đường Phan Đình Phùng kéo dài',
      '8126750',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 539: Xây dựng, nâng cấp đường trục thôn 3 (điểm đầu tại Bưu Điện 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng, nâng cấp đường trục thôn 3 (điểm đầu tại Bưu Điện - điểm cuối tại cây Đa), xã Quang Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8121644',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng, nâng cấp đường trục thôn 3 (điểm đầu tại Bưu Điện - điểm cuối tại cây Đa), xã Quang Thọ',
      '8121644',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 540: Mở rộng, nâng cấp đường trục xã Trục Thác - Ngõ Bà Tuyết (th
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Mở rộng, nâng cấp đường trục xã Trục Thác - Ngõ Bà Tuyết (thôn 2, thôn 3, thôn 4, thôn 5) xã Ân phú, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8068858',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Mở rộng, nâng cấp đường trục xã Trục Thác - Ngõ Bà Tuyết (thôn 2, thôn 3, thôn 4, thôn 5) xã Ân phú, huyện Vũ Quang',
      '8068858',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 541: Đường GTNT từ thôn Bình Phong đi thôn Tân Hưng xã Đức Lĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT từ thôn Bình Phong đi thôn Tân Hưng xã Đức Lĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8073107',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT từ thôn Bình Phong đi thôn Tân Hưng xã Đức Lĩnh',
      '8073107',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 542: Đường giao thông Ân Phú - Cửa Rào, đoạn qua xã Đức Liên huyệ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông Ân Phú - Cửa Rào, đoạn qua xã Đức Liên huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7959985',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông Ân Phú - Cửa Rào, đoạn qua xã Đức Liên huyện Vũ Quang',
      '7959985',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 543: Đường giao thông Lộc Hầu, Nguyễn Du, thị trấn Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông Lộc Hầu, Nguyễn Du, thị trấn Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7959986',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông Lộc Hầu, Nguyễn Du, thị trấn Vũ Quang',
      '7959986',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 544: Nâng cấp đường GTNT thôn 2 tuyến đường con Cuông - ông Dần -
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường GTNT thôn 2 tuyến đường con Cuông - ông Dần - đập Trộ Thầy xã Quang Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8032447',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường GTNT thôn 2 tuyến đường con Cuông - ông Dần - đập Trộ Thầy xã Quang Thọ',
      '8032447',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 545: Đường GTNT thôn Thanh Sơn xã Đức Lĩnh (Đoạn từ đường IFAX đi
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT thôn Thanh Sơn xã Đức Lĩnh (Đoạn từ đường IFAX đi Khe Ổi – Khe Du – Khe Chèo)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8027805',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT thôn Thanh Sơn xã Đức Lĩnh (Đoạn từ đường IFAX đi Khe Ổi – Khe Du – Khe Chèo)',
      '8027805',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 546: Xây dựng cầu Áng Ngò (tuyến đường Sơn Long - Chợ Bộng), xã Â
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng cầu Áng Ngò (tuyến đường Sơn Long - Chợ Bộng), xã Ân Phú')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8045175',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng cầu Áng Ngò (tuyến đường Sơn Long - Chợ Bộng), xã Ân Phú',
      '8045175',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 547: Nâng cấp sửa chữa khuôn viên, nhà vệ sinh và các hạng mục ph
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp sửa chữa khuôn viên, nhà vệ sinh và các hạng mục phụ trợ trường Tiểu học xã Đức Giang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8117231',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp sửa chữa khuôn viên, nhà vệ sinh và các hạng mục phụ trợ trường Tiểu học xã Đức Giang',
      '8117231',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 548: Đường giao thông thôn 5 xã Hương Thọ, huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông thôn 5 xã Hương Thọ, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7677847',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông thôn 5 xã Hương Thọ, huyện Vũ Quang',
      '7677847',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 549: Cải tạo, sửa chữa phòng Giáo dục huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, sửa chữa phòng Giáo dục huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7654764',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, sửa chữa phòng Giáo dục huyện Vũ Quang',
      '7654764',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 550: Cải tạo, sửa chữa nhà kỹ thuật, nhà điều trị bệnh lây Trung 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, sửa chữa nhà kỹ thuật, nhà điều trị bệnh lây Trung tâm y tế huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7884785',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, sửa chữa nhà kỹ thuật, nhà điều trị bệnh lây Trung tâm y tế huyện Vũ Quang',
      '7884785',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 551: Nhà đa chức năng 1 tầng công trình trường THCS Phan Đình Phù
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa chức năng 1 tầng công trình trường THCS Phan Đình Phùng, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7666226',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa chức năng 1 tầng công trình trường THCS Phan Đình Phùng, huyện Vũ Quang',
      '7666226',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 552: Hệ thống cống và mương tiêu nước xứ Đồng Vời, xã Đức Liên, h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống cống và mương tiêu nước xứ Đồng Vời, xã Đức Liên, huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8066769',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống cống và mương tiêu nước xứ Đồng Vời, xã Đức Liên, huyện Vũ Quang',
      '8066769',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 553: Lắp đặt biển tên đường khu trung tâm thị trấn Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Lắp đặt biển tên đường khu trung tâm thị trấn Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7859855',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Lắp đặt biển tên đường khu trung tâm thị trấn Vũ Quang',
      '7859855',
      1,
      'H',
      'Vũ Quang',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 554: Đường liên xã Liên Minh - Đức Tùng - Đức Châu, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường liên xã Liên Minh - Đức Tùng - Đức Châu, huyện Đức Thọ, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7767041',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường liên xã Liên Minh - Đức Tùng - Đức Châu, huyện Đức Thọ, tỉnh Hà Tĩnh',
      '7767041',
      1,
      'T',
      'Đức Thọ',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 555: Đường liên xã Đức Đồng - Đức Lập - Tân Hương, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường liên xã Đức Đồng - Đức Lập - Tân Hương, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7595639',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường liên xã Đức Đồng - Đức Lập - Tân Hương, huyện Đức Thọ',
      '7595639',
      1,
      'T',
      'Đức Thọ',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 556: Đường nội vùng Cụm CN-TTCN tập trung huyện Đức Thọ, tỉnh Hà 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường nội vùng Cụm CN-TTCN tập trung huyện Đức Thọ, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7059920',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường nội vùng Cụm CN-TTCN tập trung huyện Đức Thọ, tỉnh Hà Tĩnh',
      '7059920',
      1,
      'T',
      'Đức Thọ',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 557: Dự án: Phát triển cơ sở hạ tầng du lịch phục vụ cho tăng trư
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án: Phát triển cơ sở hạ tầng du lịch phục vụ cho tăng trưởng toàn diện khu vực Tiểu vùng Mê Công mở rộng tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7464241',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án: Phát triển cơ sở hạ tầng du lịch phục vụ cho tăng trưởng toàn diện khu vực Tiểu vùng Mê Công mở rộng tỉnh Hà Tĩnh',
      '7464241',
      1,
      'T',
      'Dân dụng',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 558: Dự án " Cải thiện cơ sở hạ tầng cho các xã bị ảnh hưởng bởi 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án " Cải thiện cơ sở hạ tầng cho các xã bị ảnh hưởng bởi ngập lụt của tỉnh Hà Tĩnh"')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7501924',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án " Cải thiện cơ sở hạ tầng cho các xã bị ảnh hưởng bởi ngập lụt của tỉnh Hà Tĩnh"',
      '7501924',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      9,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 559: Dự án Xây dựng cột thu, phát sóng truyền hình thị xã Kỳ Anh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Xây dựng cột thu, phát sóng truyền hình thị xã Kỳ Anh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7679830',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Xây dựng cột thu, phát sóng truyền hình thị xã Kỳ Anh',
      '7679830',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      9,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 560: Dự án Đầu tư xây dựng công trình Khu nhà Khám bệnh, Khoa Cấp
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đầu tư xây dựng công trình Khu nhà Khám bệnh, Khoa Cấp cứu -Điều trị tích cực, Khoa Sản, Khoa Phẫu thuật và Hành chính tổng hợp Bệnh viện Đa khoa huyện Nghi Xuân')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7732935.1',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đầu tư xây dựng công trình Khu nhà Khám bệnh, Khoa Cấp cứu -Điều trị tích cực, Khoa Sản, Khoa Phẫu thuật và Hành chính tổng hợp Bệnh viện Đa khoa huyện Nghi Xuân',
      '7732935.1',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      9,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 561: Đầu tư xây dựng công trình Khu nhà Khoa sản, Khoa nhi, Khoa 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đầu tư xây dựng công trình Khu nhà Khoa sản, Khoa nhi, Khoa ngoại, Khoa 3 CK và các hạng mục phụ trợ Bệnh viện Đa khoa huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7732935.2',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đầu tư xây dựng công trình Khu nhà Khoa sản, Khoa nhi, Khoa ngoại, Khoa 3 CK và các hạng mục phụ trợ Bệnh viện Đa khoa huyện Thạch Hà',
      '7732935.2',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      9,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 562: Dự án Cải tạo, nâng cấp, tăng cường cơ sở vật chất Trụ sở là
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Cải tạo, nâng cấp, tăng cường cơ sở vật chất Trụ sở làm việc Cơ quan Tỉnh uỷ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7796352',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Cải tạo, nâng cấp, tăng cường cơ sở vật chất Trụ sở làm việc Cơ quan Tỉnh uỷ',
      '7796352',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      9,
      jsonb_build_object('ke_toan', 'Hương Giang')
    );
  END IF;
END $$;

-- STT 563: Nâng cấp trụ sở làm việc Sở Y tế
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp trụ sở làm việc Sở Y tế')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8044607',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Dân dụng',
      transfer_decision     = 'DDCN',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Vũ Giang')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp trụ sở làm việc Sở Y tế',
      '8044607',
      1,
      'T',
      'Dân dụng',
      'DDCN',
      9,
      jsonb_build_object('ke_toan', 'Vũ Giang')
    );
  END IF;
END $$;

-- STT 564: Đường trục chính từ Trung tâm xã Đức Lạng vào thôn Đồng Quan
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường trục chính từ Trung tâm xã Đức Lạng vào thôn Đồng Quang, Tân Quang huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7010700',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường trục chính từ Trung tâm xã Đức Lạng vào thôn Đồng Quang, Tân Quang huyện Đức Thọ',
      '7010700',
      1,
      'T',
      'Đức Thọ',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 565: Nâng cấp trạm bơm và hệ thống tưới, tiêu vùng trọng điểm lúa
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp trạm bơm và hệ thống tưới, tiêu vùng trọng điểm lúa huyện Đức Thọ, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7280505',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp trạm bơm và hệ thống tưới, tiêu vùng trọng điểm lúa huyện Đức Thọ, tỉnh Hà Tĩnh',
      '7280505',
      1,
      'T',
      'Đức Thọ',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 566: Nắn dòng Hói Trươi xã Sơn Thọ huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nắn dòng Hói Trươi xã Sơn Thọ huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7745757',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nắn dòng Hói Trươi xã Sơn Thọ huyện Vũ Quang',
      '7745757',
      1,
      'T',
      'Vũ Quang',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 567: Đường  giao  thông  nối  từ  trung  tâm  xã Đức  Đồng  đến  
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường  giao  thông  nối  từ  trung  tâm  xã Đức  Đồng  đến  thôn  Bồng  Phúc  xã  Đức Lạng, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7010934',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường  giao  thông  nối  từ  trung  tâm  xã Đức  Đồng  đến  thôn  Bồng  Phúc  xã  Đức Lạng, huyện Đức Thọ',
      '7010934',
      1,
      'T',
      'Đức Thọ',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 568: Đường giao thông nông thôn kết hợp vào trang  trại  chăn  nu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nông thôn kết hợp vào trang  trại  chăn  nuôi  tập  trung  xã  Đức Lạng,   xã   Tân   Hương,   xã   Đức   Dũng, huyện Đức Thọ, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7487883',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nông thôn kết hợp vào trang  trại  chăn  nuôi  tập  trung  xã  Đức Lạng,   xã   Tân   Hương,   xã   Đức   Dũng, huyện Đức Thọ, tỉnh Hà Tĩnh',
      '7487883',
      1,
      'T',
      'Đức Thọ',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 569: Hệ thống kênh mương nội đồng xã  Đức Thủy, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống kênh mương nội đồng xã  Đức Thủy, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7593405',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống kênh mương nội đồng xã  Đức Thủy, huyện Đức Thọ',
      '7593405',
      1,
      'T',
      'Đức Thọ',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 570: Cải  tạo,  nâng  cấp  Đường  Tỉnh  lộ  28, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải  tạo,  nâng  cấp  Đường  Tỉnh  lộ  28, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7010431',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải  tạo,  nâng  cấp  Đường  Tỉnh  lộ  28, huyện Đức Thọ',
      '7010431',
      1,
      'T',
      'Đức Thọ',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 571: Đường giao thông nội vùng xã Đức Hòa, huyện Đức Thọ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nội vùng xã Đức Hòa, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7731075',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nội vùng xã Đức Hòa, huyện Đức Thọ',
      '7731075',
      1,
      'T',
      'Đức Thọ',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 572: Nâng  cấp  đường  nối  Quốc  lộ  15  đi  qua trung  tâm  xã 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng  cấp  đường  nối  Quốc  lộ  15  đi  qua trung  tâm  xã  Đức  Dũng,  Hồ  chứa  nước Khe Lang, huyện Đức Thọ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7742106',
      management_board      = 1,
      decision_level_before_handover = 'T',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng  cấp  đường  nối  Quốc  lộ  15  đi  qua trung  tâm  xã  Đức  Dũng,  Hồ  chứa  nước Khe Lang, huyện Đức Thọ',
      '7742106',
      1,
      'T',
      'Đức Thọ',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 573: Khắc phục cấp bách kè chống sạt lở bờ tả hạ lưu cầu Chợ Vực,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khắc phục cấp bách kè chống sạt lở bờ tả hạ lưu cầu Chợ Vực, xã Cẩm Duệ, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096166',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khắc phục cấp bách kè chống sạt lở bờ tả hạ lưu cầu Chợ Vực, xã Cẩm Duệ, huyện Cẩm Xuyên',
      '8096166',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 574: Xử lý sạt lở bờ sông Rác đoạn qua xã Cẩm Lạc, huyện Cẩm Xuyê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xử lý sạt lở bờ sông Rác đoạn qua xã Cẩm Lạc, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7959879',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xử lý sạt lở bờ sông Rác đoạn qua xã Cẩm Lạc, huyện Cẩm Xuyên',
      '7959879',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 575: Khôi phục cầu Đá Bạc, xã Cẩm Thịnh, huyện Cẩm Xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khôi phục cầu Đá Bạc, xã Cẩm Thịnh, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7904313',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khôi phục cầu Đá Bạc, xã Cẩm Thịnh, huyện Cẩm Xuyên',
      '7904313',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 576: Khắc phục kè biển xã Cẩm Nhượng, huyện Cẩm Xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khắc phục kè biển xã Cẩm Nhượng, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7902750',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khắc phục kè biển xã Cẩm Nhượng, huyện Cẩm Xuyên',
      '7902750',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 577: Khắc phục đường trục xã ven biển xã Cẩm Lĩnh, huyện Cẩm Xuyê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khắc phục đường trục xã ven biển xã Cẩm Lĩnh, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7904312',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khắc phục đường trục xã ven biển xã Cẩm Lĩnh, huyện Cẩm Xuyên',
      '7904312',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 578: Đường Cẩm Dương - Cẩm Thịnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường Cẩm Dương - Cẩm Thịnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7677500',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường Cẩm Dương - Cẩm Thịnh',
      '7677500',
      2,
      'T',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 579: Trụ sở làm việc và các hạng mục phụ trợ Ban Quản lý dự án đầ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trụ sở làm việc và các hạng mục phụ trợ Ban Quản lý dự án đầu tư xây dựng huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8115972',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trụ sở làm việc và các hạng mục phụ trợ Ban Quản lý dự án đầu tư xây dựng huyện Cẩm Xuyên',
      '8115972',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 580: Cầu qua kênh Xô Viết KN2 thôn Hưng Tiến, xã Cẩm Hưng, huyện 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu qua kênh Xô Viết KN2 thôn Hưng Tiến, xã Cẩm Hưng, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7972206',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu qua kênh Xô Viết KN2 thôn Hưng Tiến, xã Cẩm Hưng, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '7972206',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 581: Đường doc bờ biển Thiên Cầm đoạn từ Khách sạn Công Đoàn đến 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường doc bờ biển Thiên Cầm đoạn từ Khách sạn Công Đoàn đến chân núi Thiên Cầm, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8065607',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường doc bờ biển Thiên Cầm đoạn từ Khách sạn Công Đoàn đến chân núi Thiên Cầm, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '8065607',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 582: Đường ĐH.128 đoạn từ Quốc lộ 8C đến Giếng Cồn, thị trấn Thiê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường ĐH.128 đoạn từ Quốc lộ 8C đến Giếng Cồn, thị trấn Thiên Cầm, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7956684',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường ĐH.128 đoạn từ Quốc lộ 8C đến Giếng Cồn, thị trấn Thiên Cầm, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '7956684',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 583: Đường trục chính vào thôn Mỹ Hòa, xã Yên Hòa, huyện Cẩm Xuyê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường trục chính vào thôn Mỹ Hòa, xã Yên Hòa, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8060389',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường trục chính vào thôn Mỹ Hòa, xã Yên Hòa, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '8060389',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 584: Nhà học 03 tầng 9 phòng trường Tiểu học Cẩm Thạch, huyện Cẩm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 03 tầng 9 phòng trường Tiểu học Cẩm Thạch, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8013448',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 03 tầng 9 phòng trường Tiểu học Cẩm Thạch, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '8013448',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 585: DA Nhà học 2 tầng 10 phòng trường MN Cẩm Minh, huyện Cẩm Xuy
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('DA Nhà học 2 tầng 10 phòng trường MN Cẩm Minh, huyện Cẩm Xuyên (Mã DA 7961957)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7961957',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'DA Nhà học 2 tầng 10 phòng trường MN Cẩm Minh, huyện Cẩm Xuyên (Mã DA 7961957)',
      '7961957',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 586: Nhà học 2 tầng 8 phòng học bộ môn  trường THCS Mỹ Duệ, huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng 8 phòng học bộ môn  trường THCS Mỹ Duệ, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7972203',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng 8 phòng học bộ môn  trường THCS Mỹ Duệ, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '7972203',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 587: Nhà học 2 tầng 8 phòng học bộ môn trường Tiểu học Cẩm Sơn, h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng 8 phòng học bộ môn trường Tiểu học Cẩm Sơn, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7972950',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng 8 phòng học bộ môn trường Tiểu học Cẩm Sơn, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '7972950',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 588: Nhà học 3 tầng 12 phòng học bộ môn trường THCS Cẩm Nhượng, h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 3 tầng 12 phòng học bộ môn trường THCS Cẩm Nhượng, huyện Cẩm Xuyên, tỉnh Hà Tĩnh.')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7972953',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 3 tầng 12 phòng học bộ môn trường THCS Cẩm Nhượng, huyện Cẩm Xuyên, tỉnh Hà Tĩnh.',
      '7972953',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 589: Nhà học bộ môn 02 tầng 10 phòng Trường tiểu học Cẩm Hưng, hu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn 02 tầng 10 phòng Trường tiểu học Cẩm Hưng, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8064109',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn 02 tầng 10 phòng Trường tiểu học Cẩm Hưng, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '8064109',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 590: Trường tiểu học Cẩm Hưng, hạng mục san nền và nhà học 2 tầng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trường tiểu học Cẩm Hưng, hạng mục san nền và nhà học 2 tầng 12 phòng, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7972201',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trường tiểu học Cẩm Hưng, hạng mục san nền và nhà học 2 tầng 12 phòng, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '7972201',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 591: Nhà học 02 tầng 10 phòng trường Tiểu học Nam Phúc Thăng 2, h
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 02 tầng 10 phòng trường Tiểu học Nam Phúc Thăng 2, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7972208',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 02 tầng 10 phòng trường Tiểu học Nam Phúc Thăng 2, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '7972208',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 592: Nhà học 2 tầng 8 phòng học bộ môn trường tiểu học Cẩm Trung,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng 8 phòng học bộ môn trường tiểu học Cẩm Trung, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7972210',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng 8 phòng học bộ môn trường tiểu học Cẩm Trung, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '7972210',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 593: Nâng cấp, cải tạo khuôn viên, sân vườn Trung tâm văn hóa Hà 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo khuôn viên, sân vườn Trung tâm văn hóa Hà Huy Tập, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8013449',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo khuôn viên, sân vườn Trung tâm văn hóa Hà Huy Tập, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '8013449',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 594: Cải tạo, sữa chữa Nhà làm việc 2 tầng Trung tâm giáo dục ngh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, sữa chữa Nhà làm việc 2 tầng Trung tâm giáo dục nghề nghiệp - GDTX, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8013450',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, sữa chữa Nhà làm việc 2 tầng Trung tâm giáo dục nghề nghiệp - GDTX, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '8013450',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 595: Nâng cấp, cải tạo Trụ sở chi cục Thuế cũ huyện Cẩm Xuyên, tỉ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo Trụ sở chi cục Thuế cũ huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8064108',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo Trụ sở chi cục Thuế cũ huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '8064108',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 596: Cầu Truộc Nhăng, xã Cẩm Lạc, huyện Cẩm Xuyên, tỉnh Hà Tĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Truộc Nhăng, xã Cẩm Lạc, huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8070790',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Truộc Nhăng, xã Cẩm Lạc, huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '8070790',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 597: Nâng cấp, cải tạo sữa chữa Hội trường Hà Huy Tập, huyện Cẩm 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, cải tạo sữa chữa Hội trường Hà Huy Tập, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8115970',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, cải tạo sữa chữa Hội trường Hà Huy Tập, huyện Cẩm Xuyên',
      '8115970',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 598: Xử lý sạt lở bờ sông Ngàn Mọ đoạn qua xã Cẩm Thành, huyện Cẩ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xử lý sạt lở bờ sông Ngàn Mọ đoạn qua xã Cẩm Thành, huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8128678',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xử lý sạt lở bờ sông Ngàn Mọ đoạn qua xã Cẩm Thành, huyện Cẩm Xuyên',
      '8128678',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 599: Xây dựng trụ sở Công an xã Cẩm Lĩnh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trụ sở Công an xã Cẩm Lĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7874264.3',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trụ sở Công an xã Cẩm Lĩnh',
      '7874264.3',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 600: Xây dựng trụ sở Công an xã Cẩm Dương
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trụ sở Công an xã Cẩm Dương')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7874264.4',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trụ sở Công an xã Cẩm Dương',
      '7874264.4',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 601: Xây dựng trụ sở Công an xã Cẩm Thành
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trụ sở Công an xã Cẩm Thành')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7874264.5',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trụ sở Công an xã Cẩm Thành',
      '7874264.5',
      2,
      'H',
      'Cẩm Xuyên',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 602: Đường thị trấn Nghèn - Đồng Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường thị trấn Nghèn - Đồng Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7920259',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường thị trấn Nghèn - Đồng Lộc',
      '7920259',
      2,
      'T',
      'Can Lộc',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 603: Sơn bó vỉa, bổ sung hệ thống an toàn giao thông một số tuyến
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sơn bó vỉa, bổ sung hệ thống an toàn giao thông một số tuyến đường nội thị, thị trấn Nghèn, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8120806',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sơn bó vỉa, bổ sung hệ thống an toàn giao thông một số tuyến đường nội thị, thị trấn Nghèn, huyện Can Lộc',
      '8120806',
      2,
      'H',
      'Can Lộc',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 604: Khu thể thao, sân vận động huyện Can Lộc (giai đoạn 1)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khu thể thao, sân vận động huyện Can Lộc (giai đoạn 1)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7771916',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khu thể thao, sân vận động huyện Can Lộc (giai đoạn 1)',
      '7771916',
      2,
      'H',
      'Can Lộc',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 605: Nâng cấp, mở rộng đường trục chính xã Thuần Thiện đi đập Cù 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường trục chính xã Thuần Thiện đi đập Cù Lây, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7779873',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường trục chính xã Thuần Thiện đi đập Cù Lây, huyện Can Lộc',
      '7779873',
      2,
      'H',
      'Can Lộc',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 606: Xây dựng Trụ sở làm việc cơ quan chính quyền huyện Can Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng Trụ sở làm việc cơ quan chính quyền huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7945813',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng Trụ sở làm việc cơ quan chính quyền huyện Can Lộc',
      '7945813',
      2,
      'H',
      'Can Lộc',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 607: Đường giao thông và cầu Cồn Ao, xã Kim Song Trường, huyện Ca
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông và cầu Cồn Ao, xã Kim Song Trường, huyện Can Lôc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7988217',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông và cầu Cồn Ao, xã Kim Song Trường, huyện Can Lôc',
      '7988217',
      2,
      'H',
      'Can Lộc',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 608: Hệ thống điện chiếu sáng Quốc lộ 1A thị trấn Nghèn, huyện Ca
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống điện chiếu sáng Quốc lộ 1A thị trấn Nghèn, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8033930',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống điện chiếu sáng Quốc lộ 1A thị trấn Nghèn, huyện Can Lộc',
      '8033930',
      2,
      'H',
      'Can Lộc',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 609: Xây dựng trụ sở làm việc xã Kim Song Trường, huyện Can Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trụ sở làm việc xã Kim Song Trường, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8042572',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trụ sở làm việc xã Kim Song Trường, huyện Can Lộc',
      '8042572',
      2,
      'H',
      'Can Lộc',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 610: Nhà học 2 tầng 8 phòng trường THCS Trà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng 8 phòng trường THCS Trà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7619874',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng 8 phòng trường THCS Trà Linh',
      '7619874',
      2,
      'H',
      'Can Lộc',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 611: Xây dựng hạ tầng khuôn viên trụ sở Huyện uỷ, cơ quan chính q
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng hạ tầng khuôn viên trụ sở Huyện uỷ, cơ quan chính quyền huyện Can Lộc. Hạng mục: Hạ ngầm đường điện 0,4KV, nhà để xe, mái kính và các hạng mục phụ trợ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8117704',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng hạ tầng khuôn viên trụ sở Huyện uỷ, cơ quan chính quyền huyện Can Lộc. Hạng mục: Hạ ngầm đường điện 0,4KV, nhà để xe, mái kính và các hạng mục phụ trợ',
      '8117704',
      2,
      'H',
      'Can Lộc',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 612: Kè chống sạt lỡ bờ sông Đập Đình, xã Trung Lộc, huyện Can Lộ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Kè chống sạt lỡ bờ sông Đập Đình, xã Trung Lộc, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7899875',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Kè chống sạt lỡ bờ sông Đập Đình, xã Trung Lộc, huyện Can Lộc',
      '7899875',
      2,
      'H',
      'Can Lộc',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 613: Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Thượng Phúc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Thượng Phúc, xã Khánh Vĩnh Yên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = 'XHH10',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2578',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà văn hóa cộng đồng kết hợp tránh bão, lũ thôn Thượng Phúc, xã Khánh Vĩnh Yên',
      'XHH10',
      2,
      'H',
      'Can Lộc',
      '2578',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 614: Tu  bổ,  tôn  tạo  quần  thể  di  tích  khu  mộ, khu  lưu  n
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Tu  bổ,  tôn  tạo  quần  thể  di  tích  khu  mộ, khu  lưu  niệm  và  quảng  trường  Cố  Tổng Bí thư  Hà  Huy Tập,  huyện  Cẩm  Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7296126',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Tu  bổ,  tôn  tạo  quần  thể  di  tích  khu  mộ, khu  lưu  niệm  và  quảng  trường  Cố  Tổng Bí thư  Hà  Huy Tập,  huyện  Cẩm  Xuyên, tỉnh Hà Tĩnh',
      '7296126',
      2,
      'T',
      'Cẩm Xuyên',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 615: Sữa chữa, nâng cấp đập Miếu Lớn, xã Thiên Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sữa chữa, nâng cấp đập Miếu Lớn, xã Thiên Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7430928',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Can Lộc',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sữa chữa, nâng cấp đập Miếu Lớn, xã Thiên Lộc',
      '7430928',
      2,
      'T',
      'Can Lộc',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 616: Dự án Đường trục chính Khu du lịch Nam Thiên Cầm,  huyện Cẩm
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Đường trục chính Khu du lịch Nam Thiên Cầm,  huyện Cẩm Xuyên, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7647120',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Đường trục chính Khu du lịch Nam Thiên Cầm,  huyện Cẩm Xuyên, tỉnh Hà Tĩnh',
      '7647120',
      2,
      'T',
      'Cẩm Xuyên',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 617: Cải tạo, nâng cấp đường tỉnh lộ 7 đi Chùa Hương Tích, huyện 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, nâng cấp đường tỉnh lộ 7 đi Chùa Hương Tích, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7050846',
      management_board      = 2,
      decision_level_before_handover = 'T',
      old_investor          = 'Can Lộc',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, nâng cấp đường tỉnh lộ 7 đi Chùa Hương Tích, huyện Can Lộc',
      '7050846',
      2,
      'T',
      'Can Lộc',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 618: Hệ thống thoát thải cụm Công nghiệp Bắc huyện Cẩm Xuyên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hệ thống thoát thải cụm Công nghiệp Bắc huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7830641',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hệ thống thoát thải cụm Công nghiệp Bắc huyện Cẩm Xuyên',
      '7830641',
      2,
      'H',
      'Cẩm Xuyên',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 619: Đường giao thông nông thôn xã Gia Hanh, huyện Can Lộc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nông thôn xã Gia Hanh, huyện Can Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7955538',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Can Lộc',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nông thôn xã Gia Hanh, huyện Can Lộc',
      '7955538',
      2,
      'H',
      'Can Lộc',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 620: DA cải thiện CS hạ tầng cho các xã chịu ảnh hưởng của DA KT 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('DA cải thiện CS hạ tầng cho các xã chịu ảnh hưởng của DA KT mỏ sắt Thạch Khê, thực hiện Đề án PT bền vững KT-XH các xã chịu ảnh hưởng của DA KT mỏ sắt Thạch Khê - GĐ2 (Đề án 946)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7660122',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'DA cải thiện CS hạ tầng cho các xã chịu ảnh hưởng của DA KT mỏ sắt Thạch Khê, thực hiện Đề án PT bền vững KT-XH các xã chịu ảnh hưởng của DA KT mỏ sắt Thạch Khê - GĐ2 (Đề án 946)',
      '7660122',
      3,
      'T',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 621: Nâng cấp, mở rộng đường Tỉnh lộ 9 (Đoạn từ cầu Hộ Độ đến tru
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường Tỉnh lộ 9 (Đoạn từ cầu Hộ Độ đến trung tâm huyện Lộc Hà)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7043186',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường Tỉnh lộ 9 (Đoạn từ cầu Hộ Độ đến trung tâm huyện Lộc Hà)',
      '7043186',
      3,
      'T',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 622: Nâng cấp, mở rộng đường nối Quốc lộ 1 tại ngã 3 Thạch Long đ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường nối Quốc lộ 1 tại ngã 3 Thạch Long đi đường tỉnh ĐT.549')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7933908',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường nối Quốc lộ 1 tại ngã 3 Thạch Long đi đường tỉnh ĐT.549',
      '7933908',
      3,
      'T',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 623: Củng cố, nâng cấp tuyến đê Hữu Phủ đoạn từ cầu Cửa Sót đến n
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Củng cố, nâng cấp tuyến đê Hữu Phủ đoạn từ cầu Cửa Sót đến núi Nam Giới, huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7590863',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Củng cố, nâng cấp tuyến đê Hữu Phủ đoạn từ cầu Cửa Sót đến núi Nam Giới, huyện Thạch Hà',
      '7590863',
      3,
      'T',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 624: Đường giao thông nông thôn kết hợp vào khu chăn nuôi tập t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nông thôn kết hợp vào khu chăn nuôi tập trung xã Phù Lưu, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7591640',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nông thôn kết hợp vào khu chăn nuôi tập trung xã Phù Lưu, huyện Lộc Hà',
      '7591640',
      3,
      'T',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 625: Chỉnh trang hệ thống cây xanh trên địa bàn huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Chỉnh trang hệ thống cây xanh trên địa bàn huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7957789',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Chỉnh trang hệ thống cây xanh trên địa bàn huyện',
      '7957789',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 626: Lắp đặt cụm đèn tín hiệu giao thông tại nút giao đường huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Lắp đặt cụm đèn tín hiệu giao thông tại nút giao đường huyện lộ 03 với đường Quốc lộ 15B tại xã Thạch Văn và nút giao đường trục chính xã Thạch Long với QL15B')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7908579',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Lắp đặt cụm đèn tín hiệu giao thông tại nút giao đường huyện lộ 03 với đường Quốc lộ 15B tại xã Thạch Văn và nút giao đường trục chính xã Thạch Long với QL15B',
      '7908579',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 627: Nâng cấp, mở rộng tuyến đường tổ dân phố 14 đoạn từ đường Lý
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng tuyến đường tổ dân phố 14 đoạn từ đường Lý Nhật Quang đến đường liên xã Lưu Vĩnh Sơn - Việt Tiến')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8093845',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng tuyến đường tổ dân phố 14 đoạn từ đường Lý Nhật Quang đến đường liên xã Lưu Vĩnh Sơn - Việt Tiến',
      '8093845',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 628: Cải tạo trụ sở huyện Đoàn (Trung tâm chính trị cũ)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo trụ sở huyện Đoàn (Trung tâm chính trị cũ)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7572540',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo trụ sở huyện Đoàn (Trung tâm chính trị cũ)',
      '7572540',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 629: Chỉnh trang hệ thống chiếu sáng, khuôn viên trụ sở Huyện ủy,
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Chỉnh trang hệ thống chiếu sáng, khuôn viên trụ sở Huyện ủy, trụ sở HĐND - UBND huyện, Công viên Văn hóa Lý Tự Trọng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8123611',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Tâm')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Chỉnh trang hệ thống chiếu sáng, khuôn viên trụ sở Huyện ủy, trụ sở HĐND - UBND huyện, Công viên Văn hóa Lý Tự Trọng',
      '8123611',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Tâm')
    );
  END IF;
END $$;

-- STT 630: Xây dựng kênh tiêu úng thôn Thanh Tân xã Thạch Châu đến thôn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng kênh tiêu úng thôn Thanh Tân xã Thạch Châu đến thôn Phú Sơn xã Mai Phụ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7897753',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng kênh tiêu úng thôn Thanh Tân xã Thạch Châu đến thôn Phú Sơn xã Mai Phụ',
      '7897753',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 631: Khối phòng bộ môn 2 tầng trường Tiểu học Thạch Lưu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng bộ môn 2 tầng trường Tiểu học Thạch Lưu')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8031133',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng bộ môn 2 tầng trường Tiểu học Thạch Lưu',
      '8031133',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 632: Nâng cấp sân trường, nhà xe giáo viên và các hạng mục phụ tr
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp sân trường, nhà xe giáo viên và các hạng mục phụ trợ Trường THCS Nguyễn Thiếp')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8086193',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp sân trường, nhà xe giáo viên và các hạng mục phụ trợ Trường THCS Nguyễn Thiếp',
      '8086193',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 633: Nâng cấp đường Carboncor từ thôn Hòa Bình đi thôn Thống Nhất
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường Carboncor từ thôn Hòa Bình đi thôn Thống Nhất, xã Nam Điền')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8089590',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường Carboncor từ thôn Hòa Bình đi thôn Thống Nhất, xã Nam Điền',
      '8089590',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 634: Cải tạo sữa chữa trụ làm việc hội người mù, Hội cựu TNXP và 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo sữa chữa trụ làm việc hội người mù, Hội cựu TNXP và Hội Đông Y châm cứu huyên Thạch Hà.')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8092444',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo sữa chữa trụ làm việc hội người mù, Hội cựu TNXP và Hội Đông Y châm cứu huyên Thạch Hà.',
      '8092444',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 635: Xây mới cổng, hàng rào và các hạng mục phụ trợ Trường THCS H
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây mới cổng, hàng rào và các hạng mục phụ trợ Trường THCS Hương Điền Nam Hương')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8082379',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây mới cổng, hàng rào và các hạng mục phụ trợ Trường THCS Hương Điền Nam Hương',
      '8082379',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 636: Đường giao thông liên xã Ngọc Sơn - Lưu Vĩnh Sơn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên xã Ngọc Sơn - Lưu Vĩnh Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7908581',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên xã Ngọc Sơn - Lưu Vĩnh Sơn',
      '7908581',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 637: Nâng cấp đường trục chính xã Thạch Văn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp đường trục chính xã Thạch Văn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7903690',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp đường trục chính xã Thạch Văn',
      '7903690',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 638: Xây dựng sân bóng, cổng và hàng rào Trường tiểu học 2 thị tr
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng sân bóng, cổng và hàng rào Trường tiểu học 2 thị trấn Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7923797',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng sân bóng, cổng và hàng rào Trường tiểu học 2 thị trấn Thạch Hà',
      '7923797',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 639: Nâng cấp sân trường và hệ thống thoát nước Trường Tiểu học T
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp sân trường và hệ thống thoát nước Trường Tiểu học Thạch Ngọc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8088626',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp sân trường và hệ thống thoát nước Trường Tiểu học Thạch Ngọc',
      '8088626',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 640: Hạ tầng khuôn viên, bếp ăn bán trú và các hạng mục phụ trợ T
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng khuôn viên, bếp ăn bán trú và các hạng mục phụ trợ Trường mầm non Thạch Hải')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7991489',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng khuôn viên, bếp ăn bán trú và các hạng mục phụ trợ Trường mầm non Thạch Hải',
      '7991489',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 641: Nhà đa chức năng trường tiểu học Thạch Kênh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa chức năng trường tiểu học Thạch Kênh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7985900',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa chức năng trường tiểu học Thạch Kênh',
      '7985900',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 642: Nhà đa chức năng trường THCS Nguyễn Thiếp
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa chức năng trường THCS Nguyễn Thiếp')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7985921',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa chức năng trường THCS Nguyễn Thiếp',
      '7985921',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 643: Nhà đa chức năng và các hạng mục phụ trợ trưởng tiểu học Thạ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa chức năng và các hạng mục phụ trợ trưởng tiểu học Thạch Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7991492',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa chức năng và các hạng mục phụ trợ trưởng tiểu học Thạch Long',
      '7991492',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 644: Nhà HCQT và các phòng phục vụ học tập , các hạng mục phụ trợ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà HCQT và các phòng phục vụ học tập , các hạng mục phụ trợ trường TH Tượng Sơn, huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7922940',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà HCQT và các phòng phục vụ học tập , các hạng mục phụ trợ trường TH Tượng Sơn, huyện Thạch Hà',
      '7922940',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 645: Nhà học 2 tầng 10 phòng Trường Tiểu học Lý Tự Trọng, xã Việt
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng 10 phòng Trường Tiểu học Lý Tự Trọng, xã Việt Tiến')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7954937',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng 10 phòng Trường Tiểu học Lý Tự Trọng, xã Việt Tiến',
      '7954937',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 646: Nhà học 2 tầng 4 phòng trường tiểu học Đỉnh Bàn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng 4 phòng trường tiểu học Đỉnh Bàn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7986994',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng 4 phòng trường tiểu học Đỉnh Bàn',
      '7986994',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 647: Nhà học bộ môn trường Tiểu học Thạch Kênh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn trường Tiểu học Thạch Kênh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7980676',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn trường Tiểu học Thạch Kênh',
      '7980676',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 648: Nhà làm việc 2 tầng trạm Y tế xã Lưu Vĩnh Sơn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà làm việc 2 tầng trạm Y tế xã Lưu Vĩnh Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7959877',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà làm việc 2 tầng trạm Y tế xã Lưu Vĩnh Sơn',
      '7959877',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 649: Nhà làm việc cơ quan khối dân huyện Thạch Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà làm việc cơ quan khối dân huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7978607',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà làm việc cơ quan khối dân huyện Thạch Hà',
      '7978607',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 650: Xây dựng Nhà văn hoá cộng đồng – Ngôi nhà trí tuệ tại thôn N
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng Nhà văn hoá cộng đồng – Ngôi nhà trí tuệ tại thôn Nam Sơn, xã Ngọc Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7980675',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng Nhà văn hoá cộng đồng – Ngôi nhà trí tuệ tại thôn Nam Sơn, xã Ngọc Sơn',
      '7980675',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 651: Nhà học 02 tầng Trường tiểu học Thạch Sơn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 02 tầng Trường tiểu học Thạch Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8031591',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 02 tầng Trường tiểu học Thạch Sơn',
      '8031591',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 652: Nhà vệ sinh và các hạng mục phụ trợ, trường THPT Nguyễn Trun
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà vệ sinh và các hạng mục phụ trợ, trường THPT Nguyễn Trung Thiên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7904967',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà vệ sinh và các hạng mục phụ trợ, trường THPT Nguyễn Trung Thiên',
      '7904967',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 653: Nhà học bộ môn trường THCS Phan Huy Chú
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học bộ môn trường THCS Phan Huy Chú')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8031592',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học bộ môn trường THCS Phan Huy Chú',
      '8031592',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 654: Cải tạo, sửa chữa nhà công vụ 2 tầng và các hạng mục phụ trợ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo, sửa chữa nhà công vụ 2 tầng và các hạng mục phụ trợ Trụ sở làm việc HĐND - UBND huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7997597',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo, sửa chữa nhà công vụ 2 tầng và các hạng mục phụ trợ Trụ sở làm việc HĐND - UBND huyện Thạch Hà',
      '7997597',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 655: Nâng cấp, sửa chữa Trạm Y tế xã Ngọc Sơn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, sửa chữa Trạm Y tế xã Ngọc Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7949361',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, sửa chữa Trạm Y tế xã Ngọc Sơn',
      '7949361',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 656: Nhà học 02 tầng Trường tiểu học Thạch Liên
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 02 tầng Trường tiểu học Thạch Liên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8031590',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 02 tầng Trường tiểu học Thạch Liên',
      '8031590',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 657: Nhà học 2 tầng Trường Mầm non Thạch Thắng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng Trường Mầm non Thạch Thắng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8027330',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng Trường Mầm non Thạch Thắng',
      '8027330',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 658: Nhà học 2 tầng Trường tiểu học Thạch Văn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà học 2 tầng Trường tiểu học Thạch Văn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8027331',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà học 2 tầng Trường tiểu học Thạch Văn',
      '8027331',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 659: Hạ tầng, khuôn viên sân trường và các hạng mục phụ trợ Trườn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Hạ tầng, khuôn viên sân trường và các hạng mục phụ trợ Trường THCS Đồng Tiến')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8027882',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Hạ tầng, khuôn viên sân trường và các hạng mục phụ trợ Trường THCS Đồng Tiến',
      '8027882',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 660: Nhà soạn lễ và các hạng mục phụ trợ Di tích Lịch sử văn hoá 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà soạn lễ và các hạng mục phụ trợ Di tích Lịch sử văn hoá quốc gia đền thờ lăng mộ Lê Khôi')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8042570',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà soạn lễ và các hạng mục phụ trợ Di tích Lịch sử văn hoá quốc gia đền thờ lăng mộ Lê Khôi',
      '8042570',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 661: Cải tạo sân vận động huyện Thạch Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cải tạo sân vận động huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8050819',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cải tạo sân vận động huyện Thạch Hà',
      '8050819',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 662: Nang cap co so vat chat Trung Tam giao duc Nghe nghiep - Gia
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nang cap co so vat chat Trung Tam giao duc Nghe nghiep - Giao duc thuong xuyen Thach Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8092683',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nang cap co so vat chat Trung Tam giao duc Nghe nghiep - Giao duc thuong xuyen Thach Hà',
      '8092683',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 663: Khối phòng sinh hoạt chung, phòng phục vụ học tập, phòng hàn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phòng sinh hoạt chung, phòng phục vụ học tập, phòng hành chính quản trị và các hạng mục phụ trợ trường mầm non Thạch Liên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8082854',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phòng sinh hoạt chung, phòng phục vụ học tập, phòng hành chính quản trị và các hạng mục phụ trợ trường mầm non Thạch Liên',
      '8082854',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 664: Đường giao thông liên thôn Quyết Tiến - Trung Lạc, xã Thạch 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên thôn Quyết Tiến - Trung Lạc, xã Thạch Lạc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8020725',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên thôn Quyết Tiến - Trung Lạc, xã Thạch Lạc',
      '8020725',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 665: Nâng cấp mở rộng tuyến đường từ Cầu phủ 2 đi thôn Sơn trình 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp mở rộng tuyến đường từ Cầu phủ 2 đi thôn Sơn trình Xã Tân Lâm Hương, huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7892597',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp mở rộng tuyến đường từ Cầu phủ 2 đi thôn Sơn trình Xã Tân Lâm Hương, huyện Thạch Hà',
      '7892597',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 666: Nhà đa chức năng Trường Tiểu học Thạch Thắng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà đa chức năng Trường Tiểu học Thạch Thắng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7978299',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà đa chức năng Trường Tiểu học Thạch Thắng',
      '7978299',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 667: Đường giao thông Tổ dân phố 15, thị trấn Thạch Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông Tổ dân phố 15, thị trấn Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8022920',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông Tổ dân phố 15, thị trấn Thạch Hà',
      '8022920',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 668: Đường giao thông từ thôn Vĩnh Hòa đi thôn Thanh Long, xã Đỉn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ thôn Vĩnh Hòa đi thôn Thanh Long, xã Đỉnh Bàn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8027883',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ thôn Vĩnh Hòa đi thôn Thanh Long, xã Đỉnh Bàn',
      '8027883',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 669: Đường giao thông liên xã Tượng Sơn - Thạch Lạc (LX-06) đoạn 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên xã Tượng Sơn - Thạch Lạc (LX-06) đoạn từ Km1+00 đến Km4+100')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025251',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên xã Tượng Sơn - Thạch Lạc (LX-06) đoạn từ Km1+00 đến Km4+100',
      '8025251',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 670: Cầu Đò Bang, xã Thạch Lạc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu Đò Bang, xã Thạch Lạc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8050823',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu Đò Bang, xã Thạch Lạc',
      '8050823',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 671: Đường giao thông từ đường Huyện lộ 03 đến thôn Trần Phú, xã 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ đường Huyện lộ 03 đến thôn Trần Phú, xã Thạch Trị')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7993035',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ đường Huyện lộ 03 đến thôn Trần Phú, xã Thạch Trị',
      '7993035',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 672: Đường giao thông liên thôn Trung Trinh, Hương Giang, Tân Lon
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên thôn Trung Trinh, Hương Giang, Tân Long, xã Việt Tiến')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7994843',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên thôn Trung Trinh, Hương Giang, Tân Long, xã Việt Tiến',
      '7994843',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 673: Nâng cấp, mở rộng tuyến đường từ UBND xã Thạch Hải đến khu d
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng tuyến đường từ UBND xã Thạch Hải đến khu di tích đến Lê Khôi')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7817200',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng tuyến đường từ UBND xã Thạch Hải đến khu di tích đến Lê Khôi',
      '7817200',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 674: Khôi phục, nâng cấp cầu dân sinh Hói Trẻn thôn Tân Hòa, xã T
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khôi phục, nâng cấp cầu dân sinh Hói Trẻn thôn Tân Hòa, xã Tân Lâm Hương, huyện Thạch Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7901444',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khôi phục, nâng cấp cầu dân sinh Hói Trẻn thôn Tân Hòa, xã Tân Lâm Hương, huyện Thạch Hà',
      '7901444',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 675: Đường giao thông thôn Tân Hương, xã Thạch Khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông thôn Tân Hương, xã Thạch Khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7986298',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông thôn Tân Hương, xã Thạch Khê',
      '7986298',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 676: Đường giao thông liên xã từ thôn Bắc Văn, xã Thạch Văn đến t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên xã từ thôn Bắc Văn, xã Thạch Văn đến thôn Bắc Dinh, xã Thạch Trị')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7955254',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên xã từ thôn Bắc Văn, xã Thạch Văn đến thôn Bắc Dinh, xã Thạch Trị',
      '7955254',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 677: Nâng cấp, mở rộng đường giao thông từ Quốc lộ 15B đến khu du
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, mở rộng đường giao thông từ Quốc lộ 15B đến khu du lịch biển Văn Trị, xã Thạch Văn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7919803',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, mở rộng đường giao thông từ Quốc lộ 15B đến khu du lịch biển Văn Trị, xã Thạch Văn',
      '7919803',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 678: Xây dựng hệ thống kênh mương xã Lưu Vĩnh Sơn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng hệ thống kênh mương xã Lưu Vĩnh Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8020723',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng hệ thống kênh mương xã Lưu Vĩnh Sơn',
      '8020723',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 679: Nâng cấp, sữa chữa trạm bơm Đò Bang và hệ thống kênh tưới sa
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, sữa chữa trạm bơm Đò Bang và hệ thống kênh tưới sau trạm bơm, xã Tượng Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8020724',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, sữa chữa trạm bơm Đò Bang và hệ thống kênh tưới sau trạm bơm, xã Tượng Sơn',
      '8020724',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 680: Nhà để xe và các hạng mục phụ trợ, trụ sở HĐND-UBND huyện
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà để xe và các hạng mục phụ trợ, trụ sở HĐND-UBND huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8068189',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà để xe và các hạng mục phụ trợ, trụ sở HĐND-UBND huyện',
      '8068189',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 681: Sửa chữa nâng cấp trạm bơm đội Trều và công điều tiết Đập Tr
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa nâng cấp trạm bơm đội Trều và công điều tiết Đập Trằm xã Việt Tiến')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8086192',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa nâng cấp trạm bơm đội Trều và công điều tiết Đập Trằm xã Việt Tiến',
      '8086192',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 682: Xây dựng tràn điều tiết và trạm bơm, kênh dẫn xứ đồng Đập Cộ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng tràn điều tiết và trạm bơm, kênh dẫn xứ đồng Đập Cộc, xã Thạch Ngọc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8086198',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng tràn điều tiết và trạm bơm, kênh dẫn xứ đồng Đập Cộc, xã Thạch Ngọc',
      '8086198',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 683: Xây dựng tuyến kênh tiêu thoát lũ thôn Đông Tiến đến thôn Lộ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng tuyến kênh tiêu thoát lũ thôn Đông Tiến đến thôn Lộc Ân xã Lưu Vĩnh Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8084058',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng tuyến kênh tiêu thoát lũ thôn Đông Tiến đến thôn Lộc Ân xã Lưu Vĩnh Sơn',
      '8084058',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 684: Xây dựng tuyến kênh từ kênh N1-19 đến giếng Nạng, thôn Mỹ Ch
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng tuyến kênh từ kênh N1-19 đến giếng Nạng, thôn Mỹ Châu, xã Thạch Ngọc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7978296',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng tuyến kênh từ kênh N1-19 đến giếng Nạng, thôn Mỹ Châu, xã Thạch Ngọc',
      '7978296',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 685: Xây dưng tuyến kênh tưới thôn Khe Giao và thôn Trung Tâm, xã
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dưng tuyến kênh tưới thôn Khe Giao và thôn Trung Tâm, xã Ngọc Sơn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7978301',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dưng tuyến kênh tưới thôn Khe Giao và thôn Trung Tâm, xã Ngọc Sơn',
      '7978301',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 686: Kênh tiêu thoát nước thôn Phúc Thanh, xã Thạch khê
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Kênh tiêu thoát nước thôn Phúc Thanh, xã Thạch khê')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7978619',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Kênh tiêu thoát nước thôn Phúc Thanh, xã Thạch khê',
      '7978619',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 687: Tuyến kênh tiêu thoát lũ Khe Trửa xã Tân Lâm Hương
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Tuyến kênh tiêu thoát lũ Khe Trửa xã Tân Lâm Hương')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8079340',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Tuyến kênh tiêu thoát lũ Khe Trửa xã Tân Lâm Hương',
      '8079340',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 688: Xây dựng trạm bơm Bầu Nẫy và hệ thống cấp điện cho trạm bơm 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng trạm bơm Bầu Nẫy và hệ thống cấp điện cho trạm bơm Bàu Nẫy, xã Hồng Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8076989',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng trạm bơm Bầu Nẫy và hệ thống cấp điện cho trạm bơm Bàu Nẫy, xã Hồng Lộc',
      '8076989',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 689: Nâng cấp, sữa chữa kênh tiêu úng Xuân Hải, thị trấn Lộc Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nâng cấp, sữa chữa kênh tiêu úng Xuân Hải, thị trấn Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8056728',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nâng cấp, sữa chữa kênh tiêu úng Xuân Hải, thị trấn Lộc Hà',
      '8056728',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 690: Kênh tiêu Đông Liên xã Thịnh Lộc và Bình An huyện Lộc Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Kênh tiêu Đông Liên xã Thịnh Lộc và Bình An huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7918424',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Kênh tiêu Đông Liên xã Thịnh Lộc và Bình An huyện Lộc Hà',
      '7918424',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 691: Đường giao thông xã Bình An
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông xã Bình An')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8065168',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông xã Bình An',
      '8065168',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 692: Đường giao thông liên xã Mai Phụ - Hộ Độ, huyện Lộc Hà (dự á
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông liên xã Mai Phụ - Hộ Độ, huyện Lộc Hà (dự án thành phần 01)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8096969',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông liên xã Mai Phụ - Hộ Độ, huyện Lộc Hà (dự án thành phần 01)',
      '8096969',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 693: Trồng mới, bổ sung, cải tạo cây xanh tại Đại lộ Bằng Sơn và 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trồng mới, bổ sung, cải tạo cây xanh tại Đại lộ Bằng Sơn và Đại lộ Mai Hắc Đế năm 2023')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8073714',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trồng mới, bổ sung, cải tạo cây xanh tại Đại lộ Bằng Sơn và Đại lộ Mai Hắc Đế năm 2023',
      '8073714',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 694: Đường giao thông từ khu vực hạ tầng tái định cư dự án AFD tạ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông từ khu vực hạ tầng tái định cư dự án AFD tại thôn Gia Ngãi 1 đến sông Vách Nam, xã Thạch Long')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7908090',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông từ khu vực hạ tầng tái định cư dự án AFD tại thôn Gia Ngãi 1 đến sông Vách Nam, xã Thạch Long',
      '7908090',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 695: Đường giao thông khu du lịch biển Lộc Hà đoạn từ Kè 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông khu du lịch biển Lộc Hà đoạn từ Kè biển Xuân Hải đến đường Quốc lộ Xuân Hội-Thạch Khê-Vũng Áng')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7810518',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông khu du lịch biển Lộc Hà đoạn từ Kè biển Xuân Hải đến đường Quốc lộ Xuân Hội-Thạch Khê-Vũng Áng',
      '7810518',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 696: Đường giao thông nội vùng khu vực trung tâm hành chính
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông nội vùng khu vực trung tâm hành chính giai đoạn 4')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7897532',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông nội vùng khu vực trung tâm hành chính giai đoạn 4',
      '7897532',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 697: Xây dựng hệ thống kênh mương tưới, tiêu xã Hồng Lôc
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng hệ thống kênh mương tưới, tiêu xã Hồng Lôc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7899640',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng hệ thống kênh mương tưới, tiêu xã Hồng Lôc',
      '7899640',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 698: Xây dựng cống vành đai Cổ Ngựa, xã Thạch Mỹ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng cống vành đai Cổ Ngựa, xã Thạch Mỹ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7966756',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng cống vành đai Cổ Ngựa, xã Thạch Mỹ',
      '7966756',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 699: Xây dựng Kênh tiêu úng liên xã Bình An - Phù Lưu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng Kênh tiêu úng liên xã Bình An - Phù Lưu')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8065169',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng Kênh tiêu úng liên xã Bình An - Phù Lưu',
      '8065169',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 700: Xây dựng nhà 03 tầng, 14 phòng và các hạng mục phụ trợ Trườn
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng nhà 03 tầng, 14 phòng và các hạng mục phụ trợ Trường Tiểu học Thịnh Lộc')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8076990',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng nhà 03 tầng, 14 phòng và các hạng mục phụ trợ Trường Tiểu học Thịnh Lộc',
      '8076990',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 701: Xây dựng nhà học 03 tầng 11 phòng Trường THCS Mỹ Châu
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng nhà học 03 tầng 11 phòng Trường THCS Mỹ Châu')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8076991',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng nhà học 03 tầng 11 phòng Trường THCS Mỹ Châu',
      '8076991',
      3,
      'H',
      'Thạch Hà',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 702: Khắc phục sửa chữa đập Cây Sắn xã Gia Phố
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khắc phục sửa chữa đập Cây Sắn xã Gia Phố')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8078747',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khắc phục sửa chữa đập Cây Sắn xã Gia Phố',
      '8078747',
      3,
      'T',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 703: Đường GTNT thôn 5 đi thôn 6, 7 xã Hương Thủy
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT thôn 5 đi thôn 6, 7 xã Hương Thủy')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080498',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT thôn 5 đi thôn 6, 7 xã Hương Thủy',
      '8080498',
      3,
      'H',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 704: Nhà bộ môn 2 tầng 6 phòng Trường Tiểu học Hương Trà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà bộ môn 2 tầng 6 phòng Trường Tiểu học Hương Trà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026953',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà bộ môn 2 tầng 6 phòng Trường Tiểu học Hương Trà',
      '8026953',
      3,
      'H',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 705: Trung tâm giáo dục nghề nghiệp - giáo dục thường xuyên (hạng
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Trung tâm giáo dục nghề nghiệp - giáo dục thường xuyên (hạng mục xây dựng hàng rào, sửa chữa nhà bảo vệ, xây dựng khu vực sau khối nhà học 3 tầng)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080484',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Trung tâm giáo dục nghề nghiệp - giáo dục thường xuyên (hạng mục xây dựng hàng rào, sửa chữa nhà bảo vệ, xây dựng khu vực sau khối nhà học 3 tầng)',
      '8080484',
      3,
      'H',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 706: Đường GTNT xã Hương Vĩnh (đường trục xã HV01)
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xã Hương Vĩnh (đường trục xã HV01)')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8080499',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xã Hương Vĩnh (đường trục xã HV01)',
      '8080499',
      3,
      'H',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 707: Đường GTNT Hà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8026959',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT Hà Linh',
      '8026959',
      3,
      'H',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 708: Đường GTNT xóm 6 Hà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT xóm 6 Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999331',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT xóm 6 Hà Linh',
      '7999331',
      3,
      'H',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 709: Khối phục vụ học tập 02 tầng 06 phòng trường THCS Phương Điề
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Khối phục vụ học tập 02 tầng 06 phòng trường THCS Phương Điền')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8025717',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Khối phục vụ học tập 02 tầng 06 phòng trường THCS Phương Điền',
      '8025717',
      3,
      'H',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 710: Đường giao thông huyện lộ 10 (ĐH.95) đoạn qua xã Hà Linh
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường giao thông huyện lộ 10 (ĐH.95) đoạn qua xã Hà Linh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7999329',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường giao thông huyện lộ 10 (ĐH.95) đoạn qua xã Hà Linh',
      '7999329',
      3,
      'H',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 711: Đường GTNT Điền Mỹ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Đường GTNT Điền Mỹ')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018892',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Đường GTNT Điền Mỹ',
      '8018892',
      3,
      'H',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 712: Nhà hành chính quản trị 2 tầng Trường THCS Phúc Trạch
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Nhà hành chính quản trị 2 tầng Trường THCS Phúc Trạch')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7896622',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '2140',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Nhà hành chính quản trị 2 tầng Trường THCS Phúc Trạch',
      '7896622',
      3,
      'H',
      'Hương Khê',
      '2140',
      9,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;

-- STT 713: Quy hoạch chung xây dựng thị trấn Thạch Hà, huyện Thạch Hà, 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch chung xây dựng thị trấn Thạch Hà, huyện Thạch Hà, tỉnh Hà Tĩnh đến năm 2035, tỷ lệ 1/5.000')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7899079',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2977',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch chung xây dựng thị trấn Thạch Hà, huyện Thạch Hà, tỉnh Hà Tĩnh đến năm 2035, tỷ lệ 1/5.000',
      '7899079',
      3,
      'H',
      'Thạch Hà',
      '2977',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 714: Quy hoạch chung thị trấn Lộc Hà và vùng phụ cận đến năm 2035
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch chung thị trấn Lộc Hà và vùng phụ cận đến năm 2035, tầm nhìn đến năm 2050, tỷ lệ 1/5.000')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8018464',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2977',
      current_status_code   = 5,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch chung thị trấn Lộc Hà và vùng phụ cận đến năm 2035, tầm nhìn đến năm 2050, tỷ lệ 1/5.000',
      '8018464',
      3,
      'H',
      'Thạch Hà',
      '2977',
      5,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 715: Cầu phục vụ dân sinh, sản xuất muối và nuôi trồng thủy sản t
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Cầu phục vụ dân sinh, sản xuất muối và nuôi trồng thủy sản tại thôn Vĩnh Sơn, xã Đỉnh Bàn')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7955256',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '3026',
      current_status_code   = 9,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Cầu phục vụ dân sinh, sản xuất muối và nuôi trồng thủy sản tại thôn Vĩnh Sơn, xã Đỉnh Bàn',
      '7955256',
      3,
      'H',
      'Thạch Hà',
      '3026',
      9,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 716: Dự án nâng cấp đường giao thông liên xã Huyện Lộc Hà
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án nâng cấp đường giao thông liên xã Huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7043149',
      management_board      = 3,
      decision_level_before_handover = 'T',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2578',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án nâng cấp đường giao thông liên xã Huyện Lộc Hà',
      '7043149',
      3,
      'T',
      'Thạch Hà',
      '2578',
      10,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 717: Dự án Trạm bơm chính và kênh dẫn nước ngọt phục vụ sản xuất 
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Trạm bơm chính và kênh dẫn nước ngọt phục vụ sản xuất nông nghiệp và nuôi trồng thủy sản tại các xã Thạch Mỹ, Hộ Độ và Mai Phụ, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7305121',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Trạm bơm chính và kênh dẫn nước ngọt phục vụ sản xuất nông nghiệp và nuôi trồng thủy sản tại các xã Thạch Mỹ, Hộ Độ và Mai Phụ, huyện Lộc Hà',
      '7305121',
      3,
      'H',
      'Thạch Hà',
      '2140',
      10,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 718: Dự án Sửa chữa nâng cấp kênh dẫn, trạm bơm Đầu Cầu xã Hồng L
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án Sửa chữa nâng cấp kênh dẫn, trạm bơm Đầu Cầu xã Hồng Lộc, huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7292327',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án Sửa chữa nâng cấp kênh dẫn, trạm bơm Đầu Cầu xã Hồng Lộc, huyện Lộc Hà',
      '7292327',
      3,
      'H',
      'Thạch Hà',
      '2140',
      10,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 719: Dự án đầu tư xây dựng công trình Nghĩa trang Liệt sỹ huyện L
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Dự án đầu tư xây dựng công trình Nghĩa trang Liệt sỹ huyện Lộc Hà')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7268232',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '2140',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Dự án đầu tư xây dựng công trình Nghĩa trang Liệt sỹ huyện Lộc Hà',
      '7268232',
      3,
      'H',
      'Thạch Hà',
      '2140',
      10,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 720: Quy hoạch chung xây dựng thị trấn Đức Thọ và vùng phụ cận đế
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch chung xây dựng thị trấn Đức Thọ và vùng phụ cận đến năm 2035, tỷ lệ 1/5000')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7937654',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3455',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch chung xây dựng thị trấn Đức Thọ và vùng phụ cận đến năm 2035, tỷ lệ 1/5000',
      '7937654',
      1,
      'H',
      'Đức Thọ',
      '3455',
      10,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 721: Điều chỉnh quy hoạch xây dựng vùng huyện Đức Thọ đến năm 203
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Điều chỉnh quy hoạch xây dựng vùng huyện Đức Thọ đến năm 2035, tầm nhìn đến 2050')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8040453',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Đức Thọ',
      transfer_decision     = '3455',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Huân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Điều chỉnh quy hoạch xây dựng vùng huyện Đức Thọ đến năm 2035, tầm nhìn đến 2050',
      '8040453',
      1,
      'H',
      'Đức Thọ',
      '3455',
      10,
      jsonb_build_object('ke_toan', 'Huân')
    );
  END IF;
END $$;

-- STT 722: Lập kế hoạch sử dụng đất năm 2021 - 2030 huyện Vũ Quang
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Lập kế hoạch sử dụng đất năm 2021 - 2030 huyện Vũ Quang')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7926548',
      management_board      = 1,
      decision_level_before_handover = 'H',
      old_investor          = 'Vũ Quang',
      transfer_decision     = '3455',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Thuận')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Lập kế hoạch sử dụng đất năm 2021 - 2030 huyện Vũ Quang',
      '7926548',
      1,
      'H',
      'Vũ Quang',
      '3455',
      10,
      jsonb_build_object('ke_toan', 'Thuận')
    );
  END IF;
END $$;

-- STT 723: Điều chỉnh Quy hoạch xây dựng vùng huyện Can Lộc đến năm 203
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Điều chỉnh Quy hoạch xây dựng vùng huyện Can Lộc đến năm 2035, tầm nhìn 2050')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = NULL,
      management_board      = 2,
      decision_level_before_handover = '#N/A',
      old_investor          = 'Can Lộc',
      transfer_decision     = '2977',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Hương')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Điều chỉnh Quy hoạch xây dựng vùng huyện Can Lộc đến năm 2035, tầm nhìn 2050',
      NULL,
      2,
      '#N/A',
      'Can Lộc',
      '2977',
      10,
      jsonb_build_object('ke_toan', 'Hương')
    );
  END IF;
END $$;

-- STT 724: Điều chỉnh quy hoạch chung xây dựng thị trấn Cẩm Xuyên và vù
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Điều chỉnh quy hoạch chung xây dựng thị trấn Cẩm Xuyên và vùng phụ cận đến năm 2035')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7902785',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '3455',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Điều chỉnh quy hoạch chung xây dựng thị trấn Cẩm Xuyên và vùng phụ cận đến năm 2035',
      '7902785',
      2,
      'H',
      'Cẩm Xuyên',
      '3455',
      10,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 725: ứng dụng công nghê thông tin, chuyển đổi số tại UBND huyện C
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('ứng dụng công nghê thông tin, chuyển đổi số tại UBND huyện Cẩm Xuyên')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8073451',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '3455',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'ứng dụng công nghê thông tin, chuyển đổi số tại UBND huyện Cẩm Xuyên',
      '8073451',
      2,
      'H',
      'Cẩm Xuyên',
      '3455',
      10,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 726: Quy hoạch chi tiết xây dựng khu dân cư và thương mại dịch vụ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch chi tiết xây dựng khu dân cư và thương mại dịch vụ xã Cẩm Nhượng, tỷ lệ 1/500')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8152306',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '3455',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch chi tiết xây dựng khu dân cư và thương mại dịch vụ xã Cẩm Nhượng, tỷ lệ 1/500',
      '8152306',
      2,
      'H',
      'Cẩm Xuyên',
      '3455',
      10,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 727: Quy hoạch chi tiết xây dựng khu dân cư và thương mại dịch vụ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Quy hoạch chi tiết xây dựng khu dân cư và thương mại dịch vụ xã Cẩm Quang, huyện Cẩm Xuyên, tỷ lệ 1/500')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '8153850',
      management_board      = 2,
      decision_level_before_handover = 'H',
      old_investor          = 'Cẩm Xuyên',
      transfer_decision     = '3455',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Nam')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Quy hoạch chi tiết xây dựng khu dân cư và thương mại dịch vụ xã Cẩm Quang, huyện Cẩm Xuyên, tỷ lệ 1/500',
      '8153850',
      2,
      'H',
      'Cẩm Xuyên',
      '3455',
      10,
      jsonb_build_object('ke_toan', 'Nam')
    );
  END IF;
END $$;

-- STT 728: Xây dựng phần mềm thành phần, bổ sung trang thiết bị phục vụ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Xây dựng phần mềm thành phần, bổ sung trang thiết bị phục vụ cổng điều hành nội bộ trên địa bàn huyện')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7895893',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Thạch Hà',
      transfer_decision     = '3455',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Phú')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Xây dựng phần mềm thành phần, bổ sung trang thiết bị phục vụ cổng điều hành nội bộ trên địa bàn huyện',
      '7895893',
      3,
      'H',
      'Thạch Hà',
      '3455',
      10,
      jsonb_build_object('ke_toan', 'Phú')
    );
  END IF;
END $$;

-- STT 729: Sửa chữa, nâng cấp hệ thống thủy lợi Khe Con - Họ Võ, xã Hươ
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM('Sửa chữa, nâng cấp hệ thống thủy lợi Khe Con - Họ Võ, xã Hương Giang, huyện Hương Khê, tỉnh Hà Tĩnh')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = '7425690',
      management_board      = 3,
      decision_level_before_handover = 'H',
      old_investor          = 'Hương Khê',
      transfer_decision     = '3455',
      current_status_code   = 10,
      project_management    = jsonb_set(COALESCE(project_management,'{}'), '{ke_toan}', 'Quân')
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      'Sửa chữa, nâng cấp hệ thống thủy lợi Khe Con - Họ Võ, xã Hương Giang, huyện Hương Khê, tỉnh Hà Tĩnh',
      '7425690',
      3,
      'H',
      'Hương Khê',
      '3455',
      10,
      jsonb_build_object('ke_toan', 'Quân')
    );
  END IF;
END $$;
