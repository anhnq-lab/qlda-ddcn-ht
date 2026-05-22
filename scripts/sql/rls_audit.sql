-- ============================================================
-- RLS AUDIT — Báo cáo trạng thái bảo mật hàng (Row Level Security)
-- Cập nhật: 2026-05-22 (P0-5 trong OPTIMIZATION_PLAN.md)
--
-- Cách dùng:
--   1. Mở Supabase Dashboard → SQL Editor
--   2. Paste toàn bộ file này, bấm Run
--   3. Đọc 5 báo cáo dưới đây
--
-- Mục đích: phát hiện các bảng/policy còn lỗ hổng trước khi go-prod.
-- Quy ước "an toàn":
--   • Mọi bảng nghiệp vụ phải ENABLE ROW LEVEL SECURITY
--   • Mọi bảng RLS phải có ít nhất 1 policy SELECT + 1 policy write
--   • Write policy (INSERT/UPDATE/DELETE) KHÔNG được dùng qual = 'true'
--   • SELECT policy 'true' chấp nhận được CHO BẢNG PUBLIC LOOKUP
--     (departments, regulations, ...) — phải explicit trong allowlist
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- BÁO CÁO 1: Bảng PUBLIC chưa enable RLS
-- ⚠  Nguy hiểm — anon key có thể SELECT/INSERT trực tiếp.
-- ──────────────────────────────────────────────────────────────
SELECT
  '01_NO_RLS' AS report,
  schemaname,
  tablename,
  '⚠  ALTER TABLE ' || quote_ident(schemaname) || '.' || quote_ident(tablename)
    || ' ENABLE ROW LEVEL SECURITY;' AS fix_sql
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = pg_tables.schemaname
      AND c.relname = pg_tables.tablename
      AND c.relrowsecurity = TRUE
  )
ORDER BY tablename;

-- ──────────────────────────────────────────────────────────────
-- BÁO CÁO 2: Bảng đã enable RLS nhưng KHÔNG có policy nào
-- ⚠  Mặc định Postgres DENY — bảng không truy cập được từ
--    authenticated/anon, kể cả qua SDK. Có thể là quên hoặc đúng ý.
-- ──────────────────────────────────────────────────────────────
SELECT
  '02_RLS_NO_POLICY' AS report,
  c.relname AS tablename,
  '⚠  Cân nhắc: CREATE POLICY "' || c.relname
    || '_select" ON ' || c.relname || ' FOR SELECT TO authenticated USING (...);' AS hint
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname
  )
ORDER BY c.relname;

-- ──────────────────────────────────────────────────────────────
-- BÁO CÁO 3: WRITE POLICY có qual = 'true' (USING TRUE)
-- 🔴 LỖ HỔNG CRITICAL — bất kỳ user authenticated nào cũng có
--    thể INSERT/UPDATE/DELETE tuỳ ý.
-- ──────────────────────────────────────────────────────────────
SELECT
  '03_WRITE_USING_TRUE' AS report,
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  AND (qual = 'true' OR with_check = 'true' OR qual IS NULL)
ORDER BY tablename, cmd, policyname;

-- ──────────────────────────────────────────────────────────────
-- BÁO CÁO 4: SELECT POLICY có qual = 'true' (đọc toàn bộ bảng)
-- 🟡 CẢNH BÁO — bất kỳ user authenticated nào cũng đọc được hết.
--    OK cho bảng lookup public, KHÔNG OK cho bảng nghiệp vụ
--    chứa dữ liệu nhạy cảm (lương, hợp đồng, thanh toán, ...).
--
-- Chỉnh ALLOWLIST dưới đây nếu bảng được phép public-read.
-- ──────────────────────────────────────────────────────────────
WITH allowlist(tablename) AS (
  VALUES
    ('departments'),
    ('regulations'),
    ('legal_documents'),
    ('workflow_templates'),
    ('role_permission_defaults'),
    ('material_mines'),
    ('agency_calendar')
)
SELECT
  '04_SELECT_USING_TRUE' AS report,
  p.schemaname,
  p.tablename,
  p.policyname,
  p.roles,
  CASE WHEN a.tablename IS NOT NULL THEN '✓ in allowlist'
       ELSE '🟡 review needed' END AS verdict
FROM pg_policies p
LEFT JOIN allowlist a ON a.tablename = p.tablename
WHERE p.schemaname = 'public'
  AND p.cmd = 'SELECT'
  AND p.qual = 'true'
ORDER BY (a.tablename IS NULL) DESC, p.tablename, p.policyname;

-- ──────────────────────────────────────────────────────────────
-- BÁO CÁO 5: Bảng chỉ có policy "Enable * for *" / "allow_all_*"
-- 🟡 Pattern legacy từ MVP — nên thay bằng policy có rule.
-- ──────────────────────────────────────────────────────────────
SELECT
  '05_LEGACY_PERMISSIVE_NAMES' AS report,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (
       policyname ILIKE 'allow_all_%'
    OR policyname ILIKE 'enable %'
    OR policyname ILIKE '% for all%'
  )
ORDER BY tablename, policyname;

-- ──────────────────────────────────────────────────────────────
-- BÁO CÁO 6 (tóm tắt): đếm số policy theo loại cho từng bảng RLS
-- Dùng để so sánh chéo: bảng có read nhưng không có write, v.v.
-- ──────────────────────────────────────────────────────────────
SELECT
  '06_POLICY_MATRIX' AS report,
  c.relname AS tablename,
  COUNT(*) FILTER (WHERE p.cmd = 'SELECT')           AS selects,
  COUNT(*) FILTER (WHERE p.cmd = 'INSERT')           AS inserts,
  COUNT(*) FILTER (WHERE p.cmd = 'UPDATE')           AS updates,
  COUNT(*) FILTER (WHERE p.cmd = 'DELETE')           AS deletes,
  COUNT(*) FILTER (WHERE p.cmd = 'ALL')              AS all_cmd,
  COUNT(*)                                            AS total
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p
  ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = TRUE
GROUP BY c.relname
ORDER BY c.relname;
