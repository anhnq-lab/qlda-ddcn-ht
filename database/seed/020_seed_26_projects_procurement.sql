-- ============================================================
-- 020_seed_26_projects_procurement.sql
-- Dữ liệu mẫu: Procurement Plans, Bidding Packages, Contracts
-- ============================================================

-- ── 3. PROCUREMENT PLANS (Kế hoạch lựa chọn nhà thầu) ──────
DELETE FROM procurement_plans WHERE project_id LIKE 'SEED-%';

INSERT INTO procurement_plans (plan_id, project_id, plan_name, decision_number, decision_date, total_value, status, plan_type)
SELECT 
  'KHLCNT-' || project_id, 
  project_id, 
  'Kế hoạch LCNT - ' || project_name, 
  'QĐ-' || floor(random() * 1000 + 100)::text || '/QĐ-UBND', 
  COALESCE(start_date, '2024-01-01')::date - interval '30 days', 
  total_investment * 0.85, -- Chi phí xây lắp & thiết bị thường chiếm ~85% TMĐT
  'Approved',
  'Tổng thể'
FROM projects 
WHERE project_id LIKE 'SEED-%';


-- ── 4. BIDDING PACKAGES (Các gói thầu) ─────────────────────
DELETE FROM bidding_packages WHERE project_id LIKE 'SEED-%';

DO $$
DECLARE
  v_proj RECORD;
  v_pkg_id TEXT;
  v_plan_id TEXT;
  v_price NUMERIC;
BEGIN
  FOR v_proj IN SELECT project_id, total_investment, stage FROM projects WHERE project_id LIKE 'SEED-%' LOOP
    v_plan_id := 'KHLCNT-' || v_proj.project_id;
    
    -- Gói 1: Tư vấn khảo sát, lập thiết kế BVTC - Dự toán
    v_pkg_id := 'PKG-TV-' || v_proj.project_id;
    v_price := v_proj.total_investment * 0.03; -- 3%
    INSERT INTO bidding_packages (package_id, project_id, plan_id, name, field, price, estimate_price, selection_method, status)
    VALUES (v_pkg_id, v_proj.project_id, v_plan_id, 'Tư vấn khảo sát và thiết kế BVTC', 'Tư vấn', v_price, v_price * 0.98, 'Đấu thầu rộng rãi qua mạng', 
      CASE WHEN v_proj.stage = 'preparation' THEN 'Executing' ELSE 'Completed' END);

    -- Gói 2: Tư vấn giám sát
    v_pkg_id := 'PKG-TVGS-' || v_proj.project_id;
    v_price := v_proj.total_investment * 0.015; -- 1.5%
    INSERT INTO bidding_packages (package_id, project_id, plan_id, name, field, price, estimate_price, selection_method, status)
    VALUES (v_pkg_id, v_proj.project_id, v_plan_id, 'Tư vấn giám sát thi công', 'Tư vấn', v_price, v_price * 0.98, 'Đấu thầu rộng rãi qua mạng', 
      CASE WHEN v_proj.stage = 'preparation' THEN 'NotStarted' WHEN v_proj.stage = 'execution' THEN 'ContractSigned' ELSE 'Completed' END);

    -- Gói 3: Thi công xây lắp (Gói chính)
    v_pkg_id := 'PKG-XL-' || v_proj.project_id;
    v_price := v_proj.total_investment * 0.65; -- 65%
    INSERT INTO bidding_packages (package_id, project_id, plan_id, name, field, price, estimate_price, selection_method, status)
    VALUES (v_pkg_id, v_proj.project_id, v_plan_id, 'Thi công xây dựng công trình', 'Xây lắp', v_price, v_price * 0.99, 'Đấu thầu rộng rãi qua mạng', 
      CASE WHEN v_proj.stage = 'preparation' THEN 'NotStarted' WHEN v_proj.stage = 'execution' THEN 'ContractSigned' ELSE 'Completed' END);

    -- Gói 4: Rà phá bom mìn (Gói phụ, chỉ định thầu)
    v_pkg_id := 'PKG-RPBM-' || v_proj.project_id;
    v_price := v_proj.total_investment * 0.005; -- 0.5% (tối đa vài tỷ)
    IF v_price > 5000000000 THEN v_price := 5000000000; END IF;
    
    INSERT INTO bidding_packages (package_id, project_id, plan_id, name, field, price, estimate_price, selection_method, status)
    VALUES (v_pkg_id, v_proj.project_id, v_plan_id, 'Rà phá bom mìn vật nổ', 'Tư vấn', v_price, v_price, 'Chỉ định thầu', 
      CASE WHEN v_proj.stage = 'preparation' THEN 'ContractSigned' ELSE 'Completed' END);

  END LOOP;
END $$;


-- ── 5. CONTRACTS (Hợp đồng cho các gói đang thực hiện/hoàn thành) 
DELETE FROM contracts WHERE project_id LIKE 'SEED-%';

DO $$
DECLARE
  v_pkg RECORD;
  v_contract_id TEXT;
  v_contractor TEXT;
  v_xl_contractors TEXT[] := ARRAY['NT-XL-001','NT-XL-002','NT-XL-003','NT-XL-004','NT-XL-005'];
  v_tv_contractors TEXT[] := ARRAY['NT-TV-001','NT-TV-002','NT-TV-003','NT-TV-004','NT-TV-005'];
  v_idx INT := 0;
BEGIN
  FOR v_pkg IN 
    SELECT p.package_id, p.project_id, p.name, p.field, p.estimate_price, p.status, pr.start_date
    FROM bidding_packages p
    JOIN projects pr ON p.project_id = pr.project_id
    WHERE p.status IN ('ContractSigned', 'Executing', 'Completed') 
      AND p.project_id LIKE 'SEED-%'
  LOOP
    v_idx := v_idx + 1;
    v_contract_id := 'HD-' || v_pkg.package_id;
    
    -- Pick contractor based on field
    IF v_pkg.field = 'Xây lắp' THEN
      v_contractor := v_xl_contractors[(v_idx % 5) + 1];
    ELSE
      v_contractor := v_tv_contractors[(v_idx % 5) + 1];
    END IF;

    -- Update package_bidders for this winner to ensure referential integrity
    INSERT INTO package_bidders (package_id, contractor_id, bid_price, status, rank)
    VALUES (v_pkg.package_id, v_contractor, v_pkg.estimate_price * 0.95, 'winner', 1)
    ON CONFLICT (package_id, contractor_id) DO UPDATE SET status = 'winner';

    INSERT INTO contracts (
      contract_id, project_id, package_id, contract_number, contract_name, 
      value, signed_date, start_date, end_date, 
      contractor, type, status
    ) VALUES (
      v_contract_id, 
      v_pkg.project_id, 
      v_pkg.package_id, 
      floor(random() * 1000 + 100)::text || '/2024/HĐ-' || CASE WHEN v_pkg.field = 'Xây lắp' THEN 'TC' ELSE 'TV' END,
      'HĐ: ' || v_pkg.name,
      v_pkg.estimate_price * 0.95, -- Giá trúng thầu giảm 5%
      COALESCE(v_pkg.start_date, '2024-01-01')::date - interval '10 days',
      COALESCE(v_pkg.start_date, '2024-01-01'),
      COALESCE(v_pkg.start_date, '2024-01-01')::date + interval '365 days',
      v_contractor, -- Lưu trực tiếp ID nhà thầu vào cột contractor (tùy schema hiện tại)
      CASE WHEN v_pkg.field = 'Xây lắp' THEN 'Thi công' ELSE 'Tư vấn' END,
      CASE WHEN v_pkg.status = 'Completed' THEN 'Thanh lý' ELSE 'Đang thực hiện' END
    );
  END LOOP;
END $$;
