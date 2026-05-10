"""
Script: seed_projects.py
Mục đích: Đọc file DM dự án.txt, tạo SQL UPSERT vào bảng projects
Matching: Dùng project_name (trim) để match; nếu khớp thì UPDATE, không thì INSERT
"""
import re

INPUT_FILE = r"d:\01_Projects\qlda-ddcn-ht\ks\DM dự án.txt"
OUTPUT_FILE = r"d:\01_Projects\qlda-ddcn-ht\ks\upsert_projects.sql"

def escape_sql(s):
    """Escape single quotes cho PostgreSQL"""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''").strip() + "'"

def parse_ma(ma):
    """Chuẩn hóa mã dự án"""
    if not ma or ma.strip() in ('', 'chưa mở mã', '#N/A'):
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
        stt = int(stt_raw)
        ma_da = parse_ma(parts[1])
        ten_da = parts[2].strip()
        ke_toan = parts[3].strip()
        phong_da_raw = parts[4].strip()
        cap_qd = parts[5].strip()
        cdt_cu = parts[6].strip()
        qd_chuyen = parts[7].strip()
        tinh_trang_raw = parts[8].strip()

        phong_da = int(phong_da_raw) if phong_da_raw.isdigit() else None
        tinh_trang = int(tinh_trang_raw) if tinh_trang_raw.isdigit() else None

        if not ten_da:
            continue

        rows.append({
            'stt': stt,
            'ma_da': ma_da,
            'ten_da': ten_da,
            'ke_toan': ke_toan,
            'phong_da': phong_da,
            'cap_qd': cap_qd,
            'cdt_cu': cdt_cu,
            'qd_chuyen': qd_chuyen,
            'tinh_trang': tinh_trang,
        })

print(f"Parsed {len(rows)} rows")

# Tạo SQL
sql_lines = []
sql_lines.append("-- Auto-generated: seed từ DM dự án.txt")
sql_lines.append("-- Logic: UPDATE nếu project_name khớp, INSERT nếu không tìm thấy")
sql_lines.append("")

for r in rows:
    name = escape_sql(r['ten_da'])
    ma = escape_sql(r['ma_da']) if r['ma_da'] else 'NULL'
    phong = str(r['phong_da']) if r['phong_da'] else 'NULL'
    cap = escape_sql(r['cap_qd']) if r['cap_qd'] else 'NULL'
    cdt = escape_sql(r['cdt_cu']) if r['cdt_cu'] else 'NULL'
    qd = escape_sql(r['qd_chuyen']) if r['qd_chuyen'] else 'NULL'
    tt = str(r['tinh_trang']) if r['tinh_trang'] is not None else 'NULL'
    kt = escape_sql(r['ke_toan']) if r['ke_toan'] else 'NULL'

    sql_lines.append(f"""-- STT {r['stt']}: {r['ten_da'][:60]}
DO $$
DECLARE v_id text;
BEGIN
  SELECT project_id INTO v_id FROM projects
  WHERE TRIM(project_name) = TRIM({name})
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE projects SET
      national_project_code = {ma},
      management_board      = {phong},
      decision_level_before_handover = {cap},
      old_investor          = {cdt},
      transfer_decision     = {qd},
      current_status_code   = {tt},
      project_management    = jsonb_set(COALESCE(project_management,'{{}}'), '{{ke_toan}}', {escape_sql(r['ke_toan']) if r['ke_toan'] else "'null'"})
    WHERE project_id = v_id;
  ELSE
    INSERT INTO projects (
      project_id, project_name, national_project_code,
      management_board, decision_level_before_handover,
      old_investor, transfer_decision, current_status_code,
      project_management
    ) VALUES (
      gen_random_uuid()::text,
      {name},
      {ma},
      {phong},
      {cap},
      {cdt},
      {qd},
      {tt},
      jsonb_build_object('ke_toan', {escape_sql(r['ke_toan'])})
    );
  END IF;
END $$;
""")

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"✅ Đã tạo {OUTPUT_FILE}")
print(f"   Tổng: {len(rows)} dự án")
