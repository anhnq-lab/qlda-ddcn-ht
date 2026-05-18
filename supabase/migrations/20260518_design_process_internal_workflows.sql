-- Migration: Thêm 3 quy trình thiết kế nội bộ vào bảng workflows
-- Mã quy trình: QT-TK1B, QT-TK2B, QT-TK3B
-- Căn cứ: QT-DAXD-TK-QLDA2-2026; Luật Xây dựng 135/2025/QH15
-- Áp dụng từ: 01/7/2026
-- Ghi chú: Workflow nodes được seed qua JS (WorkflowTemplateService.seedTemplate)

DO $$
BEGIN
    -- QT-TK1B: Lập, thẩm định, phê duyệt BCKTKT (Thiết kế 1 bước)
    IF NOT EXISTS (SELECT 1 FROM workflows WHERE code = 'QT-TK1B' AND category = 'project') THEN
        INSERT INTO workflows (code, name, category, description, is_active, created_at, updated_at)
        VALUES (
            'QT-TK1B',
            'Lập, thẩm định, phê duyệt Báo cáo kinh tế - kỹ thuật (Thiết kế 1 bước)',
            'other',
            'Quy trình nội bộ QLDA2 — áp dụng cho dự án chỉ lập BCKTKT (thiết kế 1 bước). BCKTKT đã bao gồm TKBVTC và dự toán. Áp dụng từ 01/7/2026 theo Luật Xây dựng số 135/2025/QH15.',
            true,
            now(),
            now()
        );
    END IF;

    -- QT-TK2B: Lập, thẩm định, phê duyệt TKBVTC&DT (Thiết kế 2 bước)
    IF NOT EXISTS (SELECT 1 FROM workflows WHERE code = 'QT-TK2B' AND category = 'project') THEN
        INSERT INTO workflows (code, name, category, description, is_active, created_at, updated_at)
        VALUES (
            'QT-TK2B',
            'Lập, thẩm định, phê duyệt TKBVTC và dự toán sau khi dự án được phê duyệt (Thiết kế 2 bước)',
            'other',
            'Quy trình nội bộ QLDA2 — áp dụng cho dự án đã phê duyệt BCNCKT có TKCS; tổ chức lập TKBVTC&DT theo Điều 29 Luật Xây dựng 2025. Áp dụng từ 01/7/2026.',
            true,
            now(),
            now()
        );
    END IF;

    -- QT-TK3B: Lập, thẩm định, phê duyệt TKKT&DT và TKBVTC (Thiết kế 3 bước)
    IF NOT EXISTS (SELECT 1 FROM workflows WHERE code = 'QT-TK3B' AND category = 'project') THEN
        INSERT INTO workflows (code, name, category, description, is_active, created_at, updated_at)
        VALUES (
            'QT-TK3B',
            'Lập, thẩm định, phê duyệt TKKT và TKBVTC (Thiết kế 3 bước)',
            'other',
            'Quy trình nội bộ QLDA2 — áp dụng cho dự án quy mô lớn/phức tạp; lập TKKT&DT rồi TKBVTC theo TKKT được duyệt. Áp dụng từ 01/7/2026 theo Luật Xây dựng 135/2025/QH15.',
            true,
            now(),
            now()
        );
    END IF;
END $$;
