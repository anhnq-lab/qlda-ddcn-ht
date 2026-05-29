-- ═══════════════════════════════════════════════════════════════════════════
-- Issues hợp nhất 2D + 3D — GĐ2
-- Mở rộng bim_issues (vốn cho viewpoint 3D) để cũng phục vụ markup/pin trên
-- tài liệu 2D (PDF/ảnh) trong CDE. Một bảng issues dùng chung cho cả hai.
--
-- source = 'bim_3d' (dùng viewpoint) | 'doc_2d' (dùng doc_id + page + pin_x/pin_y + markup)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.bim_issues
    ADD COLUMN IF NOT EXISTS source  TEXT NOT NULL DEFAULT 'bim_3d',
    ADD COLUMN IF NOT EXISTS doc_id  INTEGER,
    ADD COLUMN IF NOT EXISTS page    INTEGER,
    ADD COLUMN IF NOT EXISTS pin_x   REAL,     -- toạ độ pin chuẩn hoá 0..1 theo chiều ngang trang
    ADD COLUMN IF NOT EXISTS pin_y   REAL,     -- toạ độ pin chuẩn hoá 0..1 theo chiều dọc trang
    ADD COLUMN IF NOT EXISTS markup  JSONB;    -- dữ liệu markup tự do (đường vẽ, hộp...) nếu có

COMMENT ON COLUMN public.bim_issues.source IS 'Nguồn issue: bim_3d (viewpoint 3D) | doc_2d (pin trên tài liệu 2D).';
COMMENT ON COLUMN public.bim_issues.doc_id IS 'Tài liệu 2D liên quan (documents.doc_id) khi source=doc_2d.';

CREATE INDEX IF NOT EXISTS bim_issues_doc_idx    ON public.bim_issues(doc_id) WHERE doc_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bim_issues_source_idx ON public.bim_issues(source);
