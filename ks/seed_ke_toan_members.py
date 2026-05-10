"""
seed_ke_toan_members.py
1. Tạo employee records cho các kế toán chưa có trong DB
2. Link vào project_members với role = 'Kế toán'
"""
import os, json, urllib.request, urllib.error, urllib.parse, sys
sys.stdout.reconfigure(encoding='utf-8')

# ── Đọc .env ──
env = {}
for line in open(r"d:\01_Projects\qlda-ddcn-ht\.env"):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"\'')

URL = env['VITE_SUPABASE_URL']
KEY = env['VITE_SUPABASE_ANON_KEY']

def req_json(method, path, body=None, params=None):
    url = f"{URL}{path}"
    if params:
        url += '?' + urllib.parse.urlencode(params)
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(url, data=data, method=method, headers={
        'apikey': KEY,
        'Authorization': f'Bearer {KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation' if method in ('POST','PATCH') else 'count=exact'
    })
    try:
        with urllib.request.urlopen(r) as resp:
            content = resp.read()
            if not content:
                return {}
            return json.loads(content)
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  HTTP {e.code}: {err[:200]}")
        return None

# ── Parse DM dự án lấy danh sách kế toán ──
KE_TOAN_NAMES = set()
rows = []
with open(r"d:\01_Projects\qlda-ddcn-ht\ks\DM dự án.txt", encoding='utf-8-sig') as f:
    for line in f:
        parts = line.rstrip('\r\n').split('\t')
        if len(parts) < 9 or not parts[0].strip().isdigit():
            continue
        name = parts[2].strip()
        kt = parts[3].strip()
        if kt:
            KE_TOAN_NAMES.add(kt)
            rows.append((name, kt))

print(f"Unique kế toán names: {sorted(KE_TOAN_NAMES)}")
print(f"Total project-ketoán pairs: {len(rows)}")

# ── Lấy danh sách employees hiện tại ──
emps = req_json('GET', '/rest/v1/employees', params={'select': 'employee_id,full_name'})
emp_by_name = {e['full_name']: e['employee_id'] for e in (emps or [])}
print(f"\nEmployees hiện có: {len(emp_by_name)}")

# ── Tạo employee records cho kế toán chưa có ──
new_emps = {}
for kt_name in sorted(KE_TOAN_NAMES):
    if kt_name in emp_by_name:
        new_emps[kt_name] = emp_by_name[kt_name]
        print(f"  ✓ {kt_name} → {emp_by_name[kt_name]} (đã có)")
    else:
        # Tạo mới
        emp_id = f"NV_KT_{kt_name.upper().replace(' ', '_')[:10]}"
        result = req_json('POST', '/rest/v1/employees', {
            'employee_id': emp_id,
            'full_name': kt_name,
            'department': 'Phòng Tài chính - Kế toán',
            'position': 'Kế toán viên',
            'status': 1,
        })
        if result:
            new_emps[kt_name] = emp_id
            print(f"  + {kt_name} → {emp_id} (tạo mới)")
        else:
            print(f"  ✗ {kt_name} — tạo thất bại")

# ── Lấy project_id theo project_name ──
print("\nLấy project_id từ DB...")
projects = req_json('GET', '/rest/v1/projects', params={'select': 'project_id,project_name'})
proj_by_name = {p['project_name'].strip(): p['project_id'] for p in (projects or [])}
print(f"Tổng số projects trong DB: {len(proj_by_name)}")

# ── Xóa project_members cũ với role Kế toán (để tránh duplicate) ──
print("\nXóa project_members cũ với role Kế toán...")
req_json('DELETE', '/rest/v1/project_members', params={'role': 'eq.Kế toán'})

# ── Insert project_members ──
print("Insert project_members...")
ok = 0
skip = 0
for proj_name, kt_name in rows:
    proj_id = proj_by_name.get(proj_name.strip())
    emp_id = new_emps.get(kt_name)
    if not proj_id:
        skip += 1
        continue
    if not emp_id:
        skip += 1
        continue
    result = req_json('POST', '/rest/v1/project_members', {
        'project_id': proj_id,
        'employee_id': emp_id,
        'role': 'Kế toán',
    })
    if result:
        ok += 1
    else:
        skip += 1

print(f"\nDone! project_members: OK={ok} | SKIP={skip}")

# ── Kiểm tra ──
check = req_json('GET', '/rest/v1/project_members',
                 params={'role': 'eq.Kế toán', 'select': 'count', 'limit': '0'})
print(f"project_members với role Kế toán: {check}")
