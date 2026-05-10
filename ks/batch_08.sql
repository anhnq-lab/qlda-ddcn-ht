WITH dm(national_project_code,project_name,management_board,decision_level_before_handover,old_investor,transfer_decision,current_status_code) AS (
  VALUES
  ('8040453','Điều chỉnh quy hoạch xây dựng vùng huyện Đức Thọ đến năm 2035, tầm nhìn đến 2050',1,'H','Đức Thọ','3455',10),
  ('7926548','Lập kế hoạch sử dụng đất năm 2021 - 2030 huyện Vũ Quang',1,'H','Vũ Quang','3455',10),
  (NULL,'Điều chỉnh Quy hoạch xây dựng vùng huyện Can Lộc đến năm 2035, tầm nhìn 2050',2,NULL,'Can Lộc','2977',10),
  ('7902785','Điều chỉnh quy hoạch chung xây dựng thị trấn Cẩm Xuyên và vùng phụ cận đến năm 2035',2,'H','Cẩm Xuyên','3455',10),
  ('8073451','ứng dụng công nghê thông tin, chuyển đổi số tại UBND huyện Cẩm Xuyên',2,'H','Cẩm Xuyên','3455',10),
  ('8152306','Quy hoạch chi tiết xây dựng khu dân cư và thương mại dịch vụ xã Cẩm Nhượng, tỷ lệ 1/500',2,'H','Cẩm Xuyên','3455',10),
  ('8153850','Quy hoạch chi tiết xây dựng khu dân cư và thương mại dịch vụ xã Cẩm Quang, huyện Cẩm Xuyên, tỷ lệ 1/500',2,'H','Cẩm Xuyên','3455',10),
  ('7895893','Xây dựng phần mềm thành phần, bổ sung trang thiết bị phục vụ cổng điều hành nội bộ trên địa bàn huyện',3,'H','Thạch Hà','3455',10),
  ('7425690','Sửa chữa, nâng cấp hệ thống thủy lợi Khe Con - Họ Võ, xã Hương Giang, huyện Hương Khê, tỉnh Hà Tĩnh',3,'H','Hương Khê','3455',10)
)
UPDATE projects p SET
  national_project_code          = dm.national_project_code,
  management_board               = dm.management_board::integer,
  decision_level_before_handover = dm.decision_level_before_handover,
  old_investor                   = dm.old_investor,
  transfer_decision              = dm.transfer_decision,
  current_status_code            = dm.current_status_code::integer,
  updated_at = now()
FROM dm
WHERE TRIM(p.project_name) = TRIM(dm.project_name);