-- ═══════════════════════════════════════════════════════════════════════════
-- Hợp nhất BIM vào CDE (Federation) — GĐ1
-- Mục tiêu: model BIM "sống" trong cây thư mục CDE giống tài liệu thường,
-- dùng chung phân quyền / version / nhãn nhạy cảm, qua một view hợp nhất.
--
-- Cách tiếp cận: KHÔNG gộp vật lý hai bảng. Thêm các cột CDE vào bim_models,
-- rồi tạo view cde_items_view UNION documents + bim_models.
--
-- An ninh (TT47/QCVN 12:2026/BCA, cấp độ 1–2):
--   • file_hash    — toàn vẹn tài liệu (2.2.5.4)
--   • is_encrypted — mã hóa tài liệu nhạy cảm (2.2.5.5)
--   • sensitivity_level — gán nhãn mức nhạy cảm (2.2.5.3)
-- Ghi chú: RLS hardening theo project (2.2.7) tách thành workstream riêng —
-- hiện toàn DB đang ở baseline allow_all, không siết lẻ ở đây để tránh regress.
-- View tạo với security_invoker = on để TỰ ĐỘNG tôn trọng RLS bảng gốc khi
-- hardening sau này.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Cột CDE + an ninh cho bim_models ────────────────────────────────────
ALTER TABLE public.bim_models
    ADD COLUMN IF NOT EXISTS cde_folder_id    uuid REFERENCES public.cde_folders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS cde_status       text,
    ADD COLUMN IF NOT EXISTS version_group_id uuid DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS is_latest        boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS sensitivity_level integer DEFAULT 1,
    ADD COLUMN IF NOT EXISTS submitted_by_org text,
    ADD COLUMN IF NOT EXISTS contractor_id    text,
    ADD COLUMN IF NOT EXISTS file_hash        text,
    ADD COLUMN IF NOT EXISTS is_encrypted     boolean DEFAULT false;

COMMENT ON COLUMN public.bim_models.cde_folder_id IS 'Thư mục CDE chứa model (federation BIM↔CDE).';
COMMENT ON COLUMN public.bim_models.file_hash IS 'SHA-256 nội dung IFC — toàn vẹn (QCVN 12:2026/BCA 2.2.5.4).';
COMMENT ON COLUMN public.bim_models.sensitivity_level IS 'Mức nhạy cảm 1..4 (QCVN 12:2026/BCA 2.2.5.3).';

CREATE INDEX IF NOT EXISTS idx_bim_models_cde_folder    ON public.bim_models(cde_folder_id);
CREATE INDEX IF NOT EXISTS idx_bim_models_version_group ON public.bim_models(version_group_id);

-- ── 2. Nhãn nhạy cảm cho documents ─────────────────────────────────────────
ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS sensitivity_level integer DEFAULT 1;

COMMENT ON COLUMN public.documents.sensitivity_level IS 'Mức nhạy cảm 1..4 (QCVN 12:2026/BCA 2.2.5.3).';

-- ── 3. View hợp nhất: cde_items_view ───────────────────────────────────────
-- Chuẩn hóa documents (kind='doc') + bim_models (kind='bim') thành "CDE item".
-- Chỉ hiện các mục đã được đặt vào cây thư mục CDE (cde_folder_id IS NOT NULL).
DROP VIEW IF EXISTS public.cde_items_view;
CREATE VIEW public.cde_items_view
WITH (security_invoker = on) AS
    -- Tài liệu thường
    SELECT
        'doc:' || d.doc_id::text         AS item_id,
        'doc'::text                      AS kind,
        d.doc_id::text                   AS ref_id,
        d.project_id                     AS project_id,
        d.cde_folder_id                  AS cde_folder_id,
        d.doc_name                       AS name,
        d.discipline                     AS discipline,
        COALESCE(d.doc_type, 'document') AS doc_type,
        d.cde_status                     AS status,
        d.iso_status                     AS iso_status,
        d.version                        AS version,
        d.revision                       AS revision,
        COALESCE(d.is_latest, true)      AS is_latest,
        d.version_group_id               AS version_group_id,
        d.file_hash::text                AS file_hash,
        COALESCE(d.sensitivity_level, 1) AS sensitivity_level,
        COALESCE(d.is_encrypted, false)  AS is_encrypted,
        d.size                           AS size,
        NULL::bigint                     AS file_size,
        d.storage_path                   AS storage_path,
        NULL::text                       AS frag_path,
        NULL::text                       AS properties_path,
        NULL::integer                    AS element_count,
        d.uploaded_by                    AS uploaded_by,
        d.submitted_by                   AS submitted_by,
        d.submitted_by_org               AS submitted_by_org,
        d.contractor_id                  AS contractor_id,
        d.created_at                     AS created_at,
        d.created_at                     AS updated_at
    FROM public.documents d
    WHERE d.cde_folder_id IS NOT NULL

    UNION ALL

    -- Model BIM
    SELECT
        'bim:' || b.id                   AS item_id,
        'bim'::text                      AS kind,
        b.id                             AS ref_id,
        b.project_id                     AS project_id,
        b.cde_folder_id                  AS cde_folder_id,
        b.file_name                      AS name,
        b.discipline                     AS discipline,
        'BIM'::text                      AS doc_type,
        b.cde_status                     AS status,
        NULL::text                       AS iso_status,
        NULL::text                       AS version,
        NULL::text                       AS revision,
        COALESCE(b.is_latest, true)      AS is_latest,
        b.version_group_id               AS version_group_id,
        b.file_hash::text                AS file_hash,
        COALESCE(b.sensitivity_level, 1) AS sensitivity_level,
        COALESCE(b.is_encrypted, false)  AS is_encrypted,
        CASE WHEN b.file_size IS NULL THEN NULL ELSE pg_size_pretty(b.file_size) END AS size,
        b.file_size                      AS file_size,
        b.ifc_path                       AS storage_path,
        b.frag_path                      AS frag_path,
        b.properties_path                AS properties_path,
        b.element_count                  AS element_count,
        b.uploaded_by                    AS uploaded_by,
        b.uploaded_by                    AS submitted_by,
        b.submitted_by_org               AS submitted_by_org,
        b.contractor_id                  AS contractor_id,
        b.created_at                     AS created_at,
        COALESCE(b.updated_at, b.created_at) AS updated_at
    FROM public.bim_models b
    WHERE b.cde_folder_id IS NOT NULL;

COMMENT ON VIEW public.cde_items_view IS
    'Hợp nhất tài liệu (documents) và model BIM (bim_models) thành CDE item dùng chung cây thư mục CDE. security_invoker=on để tôn trọng RLS bảng gốc.';
