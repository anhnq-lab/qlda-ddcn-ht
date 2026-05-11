-- ============================================================
-- 021_seed_26_projects_disbursement.sql
-- Dữ liệu mẫu: Disbursements
-- ============================================================

DELETE FROM disbursements WHERE project_id LIKE 'SEED-%';

DO $$
DECLARE
  v_plan RECORD;
  v_disb_amount NUMERIC;
  v_contract_id TEXT;
BEGIN
  FOR v_plan IN 
    SELECT cp.plan_id, cp.project_id, cp.plan_year, cp.disbursed_amount
    FROM capital_plans cp
    WHERE cp.project_id LIKE 'SEED-%' AND cp.disbursed_amount > 0
  LOOP
    -- Tìm hợp đồng thi công của dự án này (nếu có)
    SELECT contract_id INTO v_contract_id 
    FROM contracts 
    WHERE project_id = v_plan.project_id AND type = 'Thi công' 
    LIMIT 1;

    -- Chia số tiền giải ngân thành 2 đợt
    v_disb_amount := ROUND(v_plan.disbursed_amount / 2);
    
    -- Đợt 1
    INSERT INTO disbursements (
      project_id, capital_plan_id, contract_id, amount, request_date, 
      approved_date, type, status, description, notes
    ) VALUES (
      v_plan.project_id, v_plan.plan_id, v_contract_id, v_disb_amount,
      (v_plan.plan_year::text || '-06-15')::date,
      (v_plan.plan_year::text || '-06-25')::date,
      'Thanh toán khối lượng', 'Approved',
      'Thanh toán khối lượng đợt 1 năm ' || v_plan.plan_year,
      'Giải ngân đợt 1'
    );

    -- Đợt 2
    INSERT INTO disbursements (
      project_id, capital_plan_id, contract_id, amount, request_date, 
      approved_date, type, status, description, notes
    ) VALUES (
      v_plan.project_id, v_plan.plan_id, v_contract_id, v_plan.disbursed_amount - v_disb_amount,
      (v_plan.plan_year::text || '-11-15')::date,
      (v_plan.plan_year::text || '-11-25')::date,
      'Thanh toán khối lượng', 'Approved',
      'Thanh toán khối lượng đợt 2 năm ' || v_plan.plan_year,
      'Giải ngân đợt 2'
    );
  END LOOP;
END $$;

RAISE NOTICE '✅ Hoàn tất seed toàn bộ dữ liệu Giải ngân cho 26 dự án!';
