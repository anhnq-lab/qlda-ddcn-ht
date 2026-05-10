"""
Script: seed_projects_v2.py
Approach: Dùng INSERT với ON CONFLICT (project_name) để upsert hiệu quả
Cần tạo UNIQUE index tạm trên project_name
"""
import os

INPUT_FILE = r"d:\01_Projects\qlda-ddcn-ht\ks\DM dự án.txt"
OUTPUT_FILE = r"d:\01_Projects\qlda-ddcn-ht\ks\upsert_projects_v2.sql"

def esc(s):
    if s is None or s == '':
        return 'NULL'
    return "'" + str(s).replace("'", "''").strip() + "'"

def parse_ma(ma):
    if not ma or ma.strip() in ('', 'chưa mở mã', '#N/A', 'XHH1','XHH2','XHH3','XHH4','XHH5','XHH6','XHH7','XHH8','XHH9','XHH10'):
        return None
    return ma.strip()

rows = []
with open(INPUT_FILE, encoding='utf-8-sig') as f:
    for line in f:
        line = line.rstrip('\r\n')
        parts = line.split('\t')
        if len(parts) < 9:
            continue
        stt_raw = parts[0].strip()
        if not stt_raw or not stt_raw.isdigit():
            continue
        
        ma_da     = parse_ma(parts[1])
        ten_da    = parts[2].strip()
        ke_toan   = parts[3].strip() or None
        phong_raw = parts[4].strip()
        cap_qd    = parts[5].strip() or None
        cdt_cu    = parts[6].strip() or None
        qd_chuyen = parts[7].strip() or None
        tt_raw    = parts[8].strip()
        
        if not ten_da:
            continue
        
        phong_da  = int(phong_raw) if phong_raw.isdigit() else None
        tinh_trang = int(tt_raw) if tt_raw.isdigit() else None
        
        # Xử lý qd_chuyen - nếu là số thì convert
        if qd_chuyen and qd_chuyen.isdigit():
            qd_chuyen = qd_chuyen  # giữ nguyên dạng text
        
        rows.append((ma_da, ten_da, ke_toan, phong_da, cap_qd, cdt_cu, qd_chuyen, tinh_trang))

print(f"Parsed {len(rows)} rows")

sql = []
sql.append("-- ============================================================")
sql.append("-- Seed dữ liệu từ DM dự án.txt")
sql.append("-- Chiến lược: UPDATE khi tên khớp, INSERT khi không tìm thấy")
sql.append("-- ============================================================")
sql.append("")

# Tạo bảng tạm VALUES
val_parts = []
for (ma, name, kt, phong, cap, cdt, qd, tt) in rows:
    v = (
        f"({esc(ma)}, {esc(name)}, {esc(kt)}, "
        f"{'NULL' if phong is None else phong}, "
        f"{esc(cap)}, {esc(cdt)}, {esc(qd)}, "
        f"{'NULL' if tt is None else tt})"
    )
    val_parts.append(v)

sql.append("-- Bước 1: Cập nhật các dự án đã tồn tại (match by project_name)")
sql.append("WITH dm AS (")
sql.append("  SELECT * FROM (VALUES")
sql.append(",\n".join(val_parts))
sql.append("  ) AS t(national_project_code, project_name, ke_toan, management_board,")
sql.append("         decision_level_before_handover, old_investor, transfer_decision, current_status_code)")
sql.append(")")
sql.append("UPDATE projects p SET")
sql.append("  national_project_code          = dm.national_project_code,")
sql.append("  management_board               = dm.management_board::integer,")
sql.append("  decision_level_before_handover = dm.decision_level_before_handover,")
sql.append("  old_investor                   = dm.old_investor,")
sql.append("  transfer_decision              = dm.transfer_decision,")
sql.append("  current_status_code            = dm.current_status_code::integer,")
sql.append("  project_management             = jsonb_set(")
sql.append("    COALESCE(p.project_management, '{}'),")
sql.append("    '{ke_toan}',")
sql.append("    to_jsonb(dm.ke_toan)")
sql.append("  ),")
sql.append("  updated_at = now()")
sql.append("FROM dm")
sql.append("WHERE TRIM(p.project_name) = TRIM(dm.project_name);")
sql.append("")
sql.append("-- Bước 2: Kiểm tra kết quả")
sql.append("SELECT")
sql.append("  COUNT(*) as total_updated,")
sql.append("  COUNT(national_project_code) as with_code,")
sql.append("  COUNT(management_board) as with_phong,")
sql.append("  COUNT(current_status_code) as with_status")
sql.append("FROM projects")
sql.append("WHERE national_project_code IS NOT NULL")
sql.append("   OR management_board IS NOT NULL;")

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql))

print(f"Done: {OUTPUT_FILE} ({len(rows)} projects)")
