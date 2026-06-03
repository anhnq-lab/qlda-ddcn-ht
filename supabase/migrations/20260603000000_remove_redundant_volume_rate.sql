-- Migration: Bỏ trường volumeRate thừa khỏi implementation_tracking
-- Lý do: volumeRate luôn được gán = progress (sao chép thừa). Nơi đọc duy nhất
--        (ProjectCard) đã có fallback `volumeRate || Progress` nên việc bỏ
--        volumeRate là an toàn — giá trị hiển thị không đổi.
-- Tham chiếu: docs/KHAO_SAT_NHAP_LIEU_DU_AN.md — mục VI.3
-- Path: supabase/migrations/20260603000000_remove_redundant_volume_rate.sql

-- 1. Cập nhật lại hàm trigger: không ghi volumeRate nữa
CREATE OR REPLACE FUNCTION public.fn_sync_project_capital_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id TEXT;
  v_total_khv NUMERIC;
  v_total_disbursed NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
  ELSE
    v_project_id := NEW.project_id;
  END IF;

  IF v_project_id IS NOT NULL THEN
    -- Tổng kế hoạch vốn từ capital_plans
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_khv
    FROM public.capital_plans
    WHERE project_id = v_project_id;

    -- Tổng giải ngân từ disbursements (chỉ giao dịch đã duyệt/hoàn tất)
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_disbursed
    FROM public.disbursements
    WHERE project_id = v_project_id
      AND (LOWER(status) = 'approved' OR LOWER(status) = 'completed' OR LOWER(status) = 'success');

    -- Nếu chưa có giải ngân chi tiết, lấy tạm từ capital_plans.disbursed_amount
    IF v_total_disbursed = 0 THEN
      SELECT COALESCE(SUM(disbursed_amount), 0)
      INTO v_total_disbursed
      FROM public.capital_plans
      WHERE project_id = v_project_id;
    END IF;

    -- Cập nhật projects — KHÔNG còn ghi volumeRate (dùng progress trực tiếp khi cần)
    UPDATE public.projects
    SET
      khv_info = jsonb_build_object('total', v_total_khv),
      implementation_tracking = jsonb_build_object(
        'totalDisbursed', v_total_disbursed,
        'totalVolume', 0
      )
    WHERE project_id = v_project_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Gỡ key 'volumeRate' khỏi dữ liệu hiện có (giữ nguyên các key khác)
UPDATE public.projects
SET implementation_tracking = implementation_tracking - 'volumeRate'
WHERE implementation_tracking ? 'volumeRate';
