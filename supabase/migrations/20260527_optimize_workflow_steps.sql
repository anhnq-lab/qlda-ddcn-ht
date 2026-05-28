-- ============================================================
-- Tối ưu hóa quy trình thiết kế: TK1B (17→12), TK2B (15→10), TK3B (15→12)
-- Theo Luật Xây dựng số 135/2025/QH15 và các dự thảo nghị định hướng dẫn
-- 
-- QUAN TRỌNG: Chỉ chạy khi KHÔNG CÓ workflow instance đang active
-- ============================================================

-- 1. Xóa toàn bộ step records (vì không có instance active trên production)
DELETE FROM cde_workflow_step_records
WHERE instance_id IN (
    SELECT id FROM cde_workflow_instances
    WHERE workflow_code IN ('QT-TK1B', 'QT-TK2B', 'QT-TK3B')
);

-- 2. Xóa toàn bộ workflow instances cũ
DELETE FROM cde_workflow_instances
WHERE workflow_code IN ('QT-TK1B', 'QT-TK2B', 'QT-TK3B');

-- 3. Cập nhật metadata cho workflow templates (nếu có bảng riêng)
-- Lưu ý: Hệ thống hiện tại dùng seedInternalWorkflows.ts (client-side),
-- nên migration này chủ yếu dọn dẹp dữ liệu cũ.

-- 4. Log migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Cleaned up old workflow data for QT-TK1B, QT-TK2B, QT-TK3B';
    RAISE NOTICE 'New step counts: TK1B=12, TK2B=10, TK3B=12 (total: 34, was 47)';
END $$;
