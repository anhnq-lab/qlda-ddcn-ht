-- Migration: Đổi tên mã quy trình macro từ QT-TKxB sang QT-DAxB
-- Lý do: Giải phóng mã QT-TK1B/2B/3B cho các quy trình nội bộ thiết kế chi tiết (QLDA2)
-- Áp dụng: 18/05/2026

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM workflows WHERE code = 'QT-TK1B' AND category = 'project') THEN
        UPDATE workflows
        SET code = 'QT-DA1B',
            name = 'Quy trình DAXD - Dự án 1 bước'
        WHERE code = 'QT-TK1B' AND category = 'project';
    END IF;

    IF EXISTS (SELECT 1 FROM workflows WHERE code = 'QT-TK2B' AND category = 'project') THEN
        UPDATE workflows
        SET code = 'QT-DA2B',
            name = 'Quy trình DAXD - Dự án 2 bước'
        WHERE code = 'QT-TK2B' AND category = 'project';
    END IF;

    IF EXISTS (SELECT 1 FROM workflows WHERE code = 'QT-TK3B' AND category = 'project') THEN
        UPDATE workflows
        SET code = 'QT-DA3B',
            name = 'Quy trình DAXD - Dự án 3 bước'
        WHERE code = 'QT-TK3B' AND category = 'project';
    END IF;
END $$;
