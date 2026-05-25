-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Seed RACI template cho workflow nodes
-- ═══════════════════════════════════════════════════════════════
-- Gán RACI cho các bước quy trình dựa trên assignee_role hiện tại
-- + bổ sung A/C/I theo nghiệp vụ ĐTXD
-- ═══════════════════════════════════════════════════════════════

-- Mapping logic:
--   assignee_role legacy → stakeholder_code mới
--   'chu_dau_tu'          → BQL (R)
--   'tu_van_thiet_ke'     → TVTK (R), BQL (A)
--   'co_quan_chuyen_mon'  → SXD (R), BQL (C)
--   'hoi_dong_tham_dinh'  → SXD (R), UBND (A)
--   'nguoi_quyet_dinh_dt' → UBND (R), BQL (I)
--   'nha_thau_thi_cong'   → NTC (R), TVGS (C), BQL (A)
--   'so_tai_chinh'        → STC (R), BQL (C)
--   'co_quan_qlnn_xd'     → SXD (R), BQL (C)
--   'don_vi_de_xuat'      → BQL (R)
--   'hoi_dong_bt_ht_tdc'  → UBND (R), BQL (C)
--   'system'              → skip (start node)

-- ── R (Responsible) — từ assignee_role ───────────────────────
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'BQL', 'R'
FROM public.workflow_nodes wn
WHERE wn.assignee_role IN ('chu_dau_tu', 'don_vi_de_xuat')
  AND wn.type != 'start'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'TVTK', 'R'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'tu_van_thiet_ke'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'SXD', 'R'
FROM public.workflow_nodes wn
WHERE wn.assignee_role IN ('co_quan_chuyen_mon', 'co_quan_qlnn_xd')
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'UBND', 'R'
FROM public.workflow_nodes wn
WHERE wn.assignee_role IN ('nguoi_quyet_dinh_dt', 'hoi_dong_bt_ht_tdc', 'hoi_dong_tham_dinh')
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'NTC', 'R'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'nha_thau_thi_cong'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'STC', 'R'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'so_tai_chinh'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;


-- ── A (Accountable) ─────────────────────────────────────────
-- TVTK lập → BQL phê duyệt
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'BQL', 'A'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'tu_van_thiet_ke'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

-- SXD thẩm định → UBND phê duyệt
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'UBND', 'A'
FROM public.workflow_nodes wn
WHERE wn.assignee_role IN ('co_quan_chuyen_mon', 'hoi_dong_tham_dinh')
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

-- NTC thi công → BQL chịu trách nhiệm
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'BQL', 'A'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'nha_thau_thi_cong'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

-- STC thẩm tra QT → UBND phê duyệt
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'UBND', 'A'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'so_tai_chinh'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;


-- ── C (Consulted) ───────────────────────────────────────────
-- NTC thi công → TVGS tham vấn (giám sát)
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'TVGS', 'C'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'nha_thau_thi_cong'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

-- SXD thẩm định → BQL tham vấn
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'BQL', 'C'
FROM public.workflow_nodes wn
WHERE wn.assignee_role IN ('co_quan_chuyen_mon', 'co_quan_qlnn_xd', 'so_tai_chinh')
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

-- UBND GPMB → BQL tham vấn
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'BQL', 'C'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'hoi_dong_bt_ht_tdc'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;


-- ── I (Informed) ────────────────────────────────────────────
-- UBND phê duyệt → BQL thông báo
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'BQL', 'I'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'nguoi_quyet_dinh_dt'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

-- Thi công → KBNN thông báo (giải ngân)
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'KBNN', 'I'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'nha_thau_thi_cong'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;

-- Quyết toán → KBNN thông báo
INSERT INTO public.workflow_node_raci (workflow_node_id, stakeholder_code, raci_type)
SELECT wn.id, 'KBNN', 'I'
FROM public.workflow_nodes wn
WHERE wn.assignee_role = 'so_tai_chinh'
ON CONFLICT (workflow_node_id, stakeholder_code, raci_type) DO NOTHING;


-- ── Verify ──────────────────────────────────────────────────
DO $$
DECLARE
    v_total INT;
    v_r INT;
    v_a INT;
    v_c INT;
    v_i INT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM public.workflow_node_raci;
    SELECT COUNT(*) INTO v_r FROM public.workflow_node_raci WHERE raci_type = 'R';
    SELECT COUNT(*) INTO v_a FROM public.workflow_node_raci WHERE raci_type = 'A';
    SELECT COUNT(*) INTO v_c FROM public.workflow_node_raci WHERE raci_type = 'C';
    SELECT COUNT(*) INTO v_i FROM public.workflow_node_raci WHERE raci_type = 'I';

    RAISE NOTICE 'Workflow RACI seed: % total (R:%, A:%, C:%, I:%)',
        v_total, v_r, v_a, v_c, v_i;
END $$;
