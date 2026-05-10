"""
gen_batch_sql.py - Sinh các file SQL batch để chạy qua apply_migration
Mỗi batch ~90 projects, không chứa ke_toan (sẽ xử lý riêng)
"""
import os

def parse_ma(s):
    s = s.strip()
    return s if s and s not in ('', 'chưa mở mã', '#N/A') else None

def esc(s):
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''").strip() + "'"

rows = []
with open(r"d:\01_Projects\qlda-ddcn-ht\ks\DM dự án.txt", encoding='utf-8-sig') as f:
    for line in f:
        parts = line.rstrip('\r\n').split('\t')
        if len(parts) < 9 or not parts[0].strip().isdigit():
            continue
        ma   = parse_ma(parts[1])
        name = parts[2].strip()
        kt   = parts[3].strip() or None
        ph   = parts[4].strip()
        cap  = parts[5].strip()
        cdt  = parts[6].strip()
        qd   = parts[7].strip()
        tt   = parts[8].strip()
        if not name:
            continue
        rows.append((
            ma, name, kt,
            int(ph) if ph.isdigit() else None,
            cap if cap and cap != '#N/A' else None,
            cdt if cdt and cdt != '#N/A' else None,
            qd if qd and qd not in ('', '#N/A') else None,
            int(tt) if tt.isdigit() else None,
        ))

print(f"Total rows: {len(rows)}")

BATCH = 90
batches = [rows[i:i+BATCH] for i in range(0, len(rows), BATCH)]

for bi, batch in enumerate(batches):
    vals = []
    for (ma, name, kt, ph, cap, cdt, qd, tt) in batch:
        ph_s = str(ph) if ph is not None else 'NULL'
        tt_s = str(tt) if tt is not None else 'NULL'
        vals.append(
            f"  ({esc(ma)},{esc(name)},{ph_s},{esc(cap)},{esc(cdt)},{esc(qd)},{tt_s})"
        )
    
    sql = f"""WITH dm(national_project_code,project_name,management_board,decision_level_before_handover,old_investor,transfer_decision,current_status_code) AS (
  VALUES
{','.join(vals[0:1])}
{chr(44).join(vals[1:])}
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
WHERE TRIM(p.project_name) = TRIM(dm.project_name);"""
    
    # Fix: ghép vals đúng  
    vals_str = ',\n'.join(vals)
    sql = f"""WITH dm(national_project_code,project_name,management_board,decision_level_before_handover,old_investor,transfer_decision,current_status_code) AS (
  VALUES
{vals_str}
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
WHERE TRIM(p.project_name) = TRIM(dm.project_name);"""
    
    out = f"ks/batch_{bi:02d}.sql"
    with open(out, 'w', encoding='utf-8') as f:
        f.write(sql)
    print(f"  {out}: {len(batch)} rows")

print(f"\nGenerated {len(batches)} batch files")

# Cũng sinh file seed ke_toan - danh sách unique 
kt_names = sorted(set(r[2] for r in rows if r[2]))
print(f"\nUnique ke_toan: {kt_names}")

# Sinh SQL insert employees + project_members
kt_insert = []
for name in kt_names:
    emp_id = 'NV_KT_' + name.upper().replace(' ', '_').replace('Ũ','U').replace('Ẻ','E')[:8]
    kt_insert.append(f"  ('{emp_id}', {esc(name)}, 'Phòng Tài chính - Kế toán', 'Kế toán viên', 1)")

kt_sql = f"""-- Tạo employee records cho kế toán chưa có
INSERT INTO employees (employee_id, full_name, department, position, status)
VALUES
{','.join(kt_insert)}
ON CONFLICT (employee_id) DO NOTHING;
"""
with open('ks/seed_ke_toan_employees.sql', 'w', encoding='utf-8') as f:
    f.write(kt_sql)
print("Generated ks/seed_ke_toan_employees.sql")

# Sinh SQL link project_members
members_sql = """-- Link kế toán vào project_members
DELETE FROM project_members WHERE role = 'Kế toán';

INSERT INTO project_members (project_id, employee_id, role)
SELECT 
  p.project_id,
  e.employee_id,
  'Kế toán'
FROM (VALUES
"""
# Chỉ lấy rows có ke_toan
pair_vals = []
for (ma, name, kt, ph, cap, cdt, qd, tt) in rows:
    if kt:
        pair_vals.append(f"  ({esc(name)}, {esc(kt)})")

members_sql += ',\n'.join(pair_vals)
members_sql += """
) AS dm(project_name, ke_toan_name)
JOIN projects p ON TRIM(p.project_name) = TRIM(dm.project_name)
JOIN employees e ON TRIM(e.full_name) = TRIM(dm.ke_toan_name)
ON CONFLICT DO NOTHING;
"""
with open('ks/seed_project_members_ketoán.sql', 'w', encoding='utf-8') as f:
    f.write(members_sql)
print("Generated ks/seed_project_members_ketoán.sql")
