"""
exec_upsert.py - Upsert 729 dự án vào Supabase qua REST API
Lưu ý: ke_toan sẽ xử lý riêng qua project_members
"""
import os, json, urllib.request, urllib.error

# ── Đọc .env ──────────────────────────────────────────────────────────────
env = {}
for line in open(r"d:\01_Projects\qlda-ddcn-ht\.env"):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"\'')

URL = env.get('VITE_SUPABASE_URL', '')
KEY = env.get('VITE_SUPABASE_ANON_KEY', '')
if not URL or not KEY:
    raise SystemExit("Không tìm thấy SUPABASE_URL hoặc ANON_KEY trong .env")
print(f"URL: {URL[:40]}...")

# ── Parse file DM dự án ───────────────────────────────────────────────────
def parse_ma(s):
    s = s.strip()
    return s if s and s not in ('', 'chưa mở mã', '#N/A') else None

rows = []
with open(r"d:\01_Projects\qlda-ddcn-ht\ks\DM dự án.txt", encoding='utf-8-sig') as f:
    for line in f:
        parts = line.rstrip('\r\n').split('\t')
        if len(parts) < 9 or not parts[0].strip().isdigit():
            continue
        ma, name, kt, ph, cap, cdt, qd, tt = [p.strip() for p in parts[1:9]]
        rows.append({
            'ma': parse_ma(ma),
            'name': name,
            'ke_toan': kt or None,
            'phong': int(ph) if ph.isdigit() else None,
            'cap': cap if cap and cap not in ('#N/A',) else None,
            'cdt': cdt or None,
            'qd': qd or None,
            'tt': int(tt) if tt.isdigit() else None,
        })
print(f"Parsed {len(rows)} rows")

# ── Gọi Supabase RPC (execute SQL) ───────────────────────────────────────
def run_sql(sql: str) -> dict:
    body = json.dumps({"query": sql}).encode('utf-8')
    req = urllib.request.Request(
        f"{URL}/rest/v1/rpc/exec_sql",
        data=body,
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
        }
    )
    try:
        with urllib.request.urlopen(req) as r:
            return {"ok": True, "data": r.read().decode()}
    except urllib.error.HTTPError as e:
        return {"ok": False, "err": e.read().decode()}

# ── Thử dùng endpoint trực tiếp qua update bulk ─────────────────────────
# Supabase hỗ trợ upsert qua /rest/v1/projects với header Prefer: resolution=merge-duplicates
# Nhưng không match by name được → dùng approach UPDATE từng record

def update_project(row: dict) -> bool:
    """Update project record by name match"""
    name_enc = urllib.parse.quote(row['name'].replace("'", "''"))
    
    payload = {}
    if row['ma']:
        payload['national_project_code'] = row['ma']
    if row['phong'] is not None:
        payload['management_board'] = row['phong']
    if row['cap']:
        payload['decision_level_before_handover'] = row['cap']
    if row['cdt']:
        payload['old_investor'] = row['cdt']
    if row['qd']:
        payload['transfer_decision'] = row['qd']
    if row['tt'] is not None:
        payload['current_status_code'] = row['tt']
    
    body = json.dumps(payload).encode('utf-8')
    name_param = urllib.parse.quote(f"eq.{row['name']}")
    req = urllib.request.Request(
        f"{URL}/rest/v1/projects?project_name={name_param}",
        data=body,
        method='PATCH',
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
    )
    try:
        with urllib.request.urlopen(req) as r:
            return True
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        if e.code != 404:
            print(f"  ERR [{row['name'][:40]}]: {err[:100]}")
        return False

import urllib.parse
ok_count = 0
fail_count = 0
for i, row in enumerate(rows):
    if update_project(row):
        ok_count += 1
    else:
        fail_count += 1
    if (i+1) % 50 == 0:
        print(f"  Progress: {i+1}/{len(rows)} | OK={ok_count} FAIL={fail_count}")

print(f"\nDone! OK={ok_count} | FAIL={fail_count} | Total={len(rows)}")

# ── Kiểm tra kết quả ────────────────────────────────────────────────────
req = urllib.request.Request(
    f"{URL}/rest/v1/projects?select=count&management_board=not.is.null",
    headers={"apikey": KEY, "Authorization": f"Bearer {KEY}", "Prefer": "count=exact"}
)
with urllib.request.urlopen(req) as r:
    count_header = r.headers.get('Content-Range', 'unknown')
    print(f"Projects with management_board: {count_header}")
