"""
Script: run_upsert.py  
Dùng python-dotenv + supabase-py để execute SQL upsert theo batch
"""
import os
import sys

# Đọc .env
env_path = r"d:\01_Projects\qlda-ddcn-ht\.env"
env_vars = {}
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env_vars[k.strip()] = v.strip().strip('"\'')

SUPABASE_URL = env_vars.get('VITE_SUPABASE_URL', '')
SUPABASE_KEY = env_vars.get('VITE_SUPABASE_ANON_KEY', '')

print("URL:", SUPABASE_URL[:40] if SUPABASE_URL else "NOT FOUND")
print("KEY:", SUPABASE_KEY[:20] + "..." if SUPABASE_KEY else "NOT FOUND")

INPUT_FILE = r"d:\01_Projects\qlda-ddcn-ht\ks\DM dự án.txt"

def esc(s):
    if s is None or s == '':
        return 'NULL'
    return "'" + str(s).replace("'", "''").strip() + "'"

def parse_ma(ma):
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
        
        phong_da   = int(phong_raw) if phong_raw.isdigit() else None
        tinh_trang = int(tt_raw) if tt_raw.isdigit() else None
        
        rows.append((ma_da, ten_da, ke_toan, phong_da, cap_qd, cdt_cu, qd_chuyen, tinh_trang))

print(f"Parsed {len(rows)} rows")

# Tạo batch SQL files (mỗi batch 100)
import math
BATCH_SIZE = 100
batches = [rows[i:i+BATCH_SIZE] for i in range(0, len(rows), BATCH_SIZE)]
print(f"Total batches: {len(batches)}")

for batch_num, batch in enumerate(batches):
    val_parts = []
    for (ma, name, kt, phong, cap, cdt, qd, tt) in batch:
        v = (
            f"({esc(ma)}, {esc(name)}, {esc(kt)}, "
            f"{'NULL' if phong is None else phong}, "
            f"{esc(cap)}, {esc(cdt)}, {esc(qd)}, "
            f"{'NULL' if tt is None else tt})"
        )
        val_parts.append(v)
    
    sql = f"""WITH dm AS (
  SELECT * FROM (VALUES
{chr(44) + chr(10)}.join(val_parts)
  ) AS t(national_project_code, project_name, ke_toan, management_board,
         decision_level_before_handover, old_investor, transfer_decision, current_status_code)
)
UPDATE projects p SET
  national_project_code          = dm.national_project_code,
  management_board               = dm.management_board::integer,
  decision_level_before_handover = dm.decision_level_before_handover,
  old_investor                   = dm.old_investor,
  transfer_decision              = dm.transfer_decision,
  current_status_code            = dm.current_status_code::integer,
  project_management             = jsonb_set(
    COALESCE(p.project_management, '{{}}'),
    '{{ke_toan}}',
    to_jsonb(dm.ke_toan)
  ),
  updated_at = now()
FROM dm
WHERE TRIM(p.project_name) = TRIM(dm.project_name);"""
    
    outfile = f"ks/batch_{batch_num:03d}.sql"
    sql_content = f"WITH dm AS (\n  SELECT * FROM (VALUES\n{chr(44)+chr(10).join(val_parts)}\n  ) AS t(national_project_code, project_name, ke_toan, management_board,\n         decision_level_before_handover, old_investor, transfer_decision, current_status_code)\n)\nUPDATE projects p SET\n  national_project_code          = dm.national_project_code,\n  management_board               = dm.management_board::integer,\n  decision_level_before_handover = dm.decision_level_before_handover,\n  old_investor                   = dm.old_investor,\n  transfer_decision              = dm.transfer_decision,\n  current_status_code            = dm.current_status_code::integer,\n  project_management             = jsonb_set(\n    COALESCE(p.project_management, '{}'),\n    '{ke_toan}',\n    to_jsonb(dm.ke_toan)\n  ),\n  updated_at = now()\nFROM dm\nWHERE TRIM(p.project_name) = TRIM(dm.project_name);"
    
    with open(outfile, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    print(f"  batch_{batch_num:03d}.sql: {len(batch)} rows")

print("Done generating batches!")
