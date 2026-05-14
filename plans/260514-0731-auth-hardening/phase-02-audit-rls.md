# Phase 02: Audit Log & RLS Hardening
Status: ⬜ Pending
Priority: 🔴 Critical
Estimated: 1 giờ
Dependencies: Không có (độc lập với Phase 01)

## Objective
Vá lỗ hổng RLS trên bảng `audit_logs` (policy cũ `USING(true)` cho phép mọi user đọc),
thêm logging cho sự kiện Impersonation, và verify các RLS helper functions
đang hoạt động đúng trên production DB.

---

## Requirements

### Functional
- [ ] Chỉ Admin đọc được `audit_logs`
- [ ] Mỗi lần Admin bắt đầu/kết thúc impersonation → ghi vào `audit_logs`
- [ ] Các bảng mới từ migrations sau `20260401` đã có RLS policies

### Non-Functional
- [ ] Không ảnh hưởng đến performance (tận dụng index đã có)
- [ ] Idempotent: migration có thể chạy lại an toàn

---

## Implementation Steps

### Bước 1: Tạo SQL migration fix audit_logs RLS

File: `supabase/migrations/20260514_fix_audit_logs_rls.sql`

```sql
-- Fix: Tighten audit_logs SELECT policy
-- Issue: Existing policy 'audit_logs_select' uses USING(true)
-- Migration '20260401120000' added 'audit_logs_select_admin' but old policy may still exist

-- Drop cả hai policy cũ để đảm bảo clean state
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;

-- Tạo lại policy đúng: chỉ Admin
CREATE POLICY "audit_logs_select_admin_only"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Verify bảng các tables mới (sau 20260401) có RLS
ALTER TABLE IF EXISTS agency_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS annual_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS monthly_plans ENABLE ROW LEVEL SECURITY;
```

### Bước 2: Thêm RLS policies cho tables mới

Trong cùng migration file, bổ sung:

```sql
-- agency_calendar: tất cả authenticated users đọc, employee insert/update
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_calendar') THEN
    DROP POLICY IF EXISTS "agency_calendar_select" ON agency_calendar;
    EXECUTE 'CREATE POLICY "agency_calendar_select" ON agency_calendar FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "agency_calendar_insert" ON agency_calendar FOR INSERT TO authenticated WITH CHECK (public.get_current_employee_id() IS NOT NULL)';
    EXECUTE 'CREATE POLICY "agency_calendar_update" ON agency_calendar FOR UPDATE TO authenticated USING (public.is_global_role()) WITH CHECK (public.is_global_role())';
    EXECUTE 'CREATE POLICY "agency_calendar_delete" ON agency_calendar FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- site_clearances: project-scoped
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_clearances') THEN
    DROP POLICY IF EXISTS "site_clearances_select" ON site_clearances;
    EXECUTE 'CREATE POLICY "site_clearances_select" ON site_clearances FOR SELECT TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "site_clearances_insert" ON site_clearances FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "site_clearances_update" ON site_clearances FOR UPDATE TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id)) WITH CHECK (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "site_clearances_delete" ON site_clearances FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;
```

### Bước 3: Log Impersonation events — `context/ImpersonationContext.tsx`

```tsx
// Thêm hàm logImpersonationEvent (gọi supabase insert audit_logs)
const logImpersonationEvent = async (
  action: 'impersonation_start' | 'impersonation_stop',
  targetUser: Employee
) => {
  await supabase.from('audit_logs').insert({
    action,
    target_entity: 'employees',
    target_id: targetUser.EmployeeID,
    changed_by: realAdminId, // từ AuthContext
    details: {
      target_name: targetUser.FullName,
      target_role: targetUser.Role,
    },
  });
};

// Gọi trong startImpersonation() và stopImpersonation()
```

### Bước 4: Verify RLS trên Supabase Dashboard

Checklist cần check thủ công trên **Supabase Dashboard → Table Editor → RLS**:

```
audit_logs:
  ✓ audit_logs_insert (authenticated, USING true)
  ✓ audit_logs_select_admin_only (authenticated, is_admin())
  ✗ audit_logs_select (USING true) → phải KHÔNG còn tồn tại

user_permissions:
  ✓ user_permissions_select_own_or_admin
  ✓ user_permissions_insert_admin_only
  ✓ user_permissions_update_admin_only
  ✓ user_permissions_delete_admin_only
```

---

## Files to Create/Modify

| File | Action | Mô tả |
|------|--------|-------|
| `supabase/migrations/20260514_fix_audit_logs_rls.sql` | CREATE | Fix RLS + thêm policies cho tables mới |
| `context/ImpersonationContext.tsx` | MODIFY | Log impersonation events vào audit_logs |

---

## Test Criteria
- [ ] User thường đăng nhập → try `SELECT * FROM audit_logs` trong Supabase SQL Editor → bị từ chối
- [ ] Admin đăng nhập → có thể đọc audit_logs
- [ ] Bắt đầu impersonation → có row mới trong audit_logs với action='impersonation_start'
- [ ] Kết thúc impersonation → có row mới với action='impersonation_stop'

---

## Notes
- `is_admin()` function dùng `e.role = 'Admin'` — cần verify tên role trong DB khớp với enum
- Migration phải idempotent (dùng `DROP POLICY IF EXISTS` trước khi `CREATE POLICY`)

---
Next Phase: [Phase 03 — Permission Cache](./phase-03-permission-cache.md)
