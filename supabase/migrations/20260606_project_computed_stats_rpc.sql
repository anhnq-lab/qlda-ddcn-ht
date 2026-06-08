-- ============================================================
-- RPC: get_project_computed_stats
-- Trả về thống kê tổng hợp dự án (tiến độ, giải ngân, KHV)
-- thay vì tính toán phía client từ nhiều query riêng lẻ.
-- ============================================================

CREATE OR REPLACE FUNCTION get_project_computed_stats(p_project_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'project_id', p.project_id,
        'khv_total', COALESCE((
            SELECT SUM(cp.amount)
            FROM capital_plans cp
            WHERE cp.project_id = p.project_id
              AND cp.plan_type = 'annual'
        ), 0),
        'total_disbursed', COALESCE((
            SELECT SUM(d.amount)
            FROM disbursements d
            WHERE d.project_id = p.project_id
              AND d.status = 'completed'
        ), 0),
        'disbursement_rate', CASE
            WHEN p.total_investment > 0 THEN ROUND(
                COALESCE((
                    SELECT SUM(d.amount)
                    FROM disbursements d
                    WHERE d.project_id = p.project_id
                      AND d.status = 'completed'
                ), 0) / p.total_investment * 100, 2
            )
            ELSE 0
        END,
        'physical_progress', COALESCE((
            SELECT ROUND(AVG(cp2.actual_percent)::numeric, 2)
            FROM construction_progress cp2
            WHERE cp2.project_id = p.project_id
        ), 0),
        'payment_progress', COALESCE((
            SELECT ROUND(
                SUM(CASE WHEN c.status = 'completed' THEN c.contract_value ELSE 0 END)
                / NULLIF(SUM(c.contract_value), 0) * 100, 2
            )
            FROM contracts c
            WHERE c.project_id = p.project_id
        ), 0)
    ) INTO result
    FROM projects p
    WHERE p.project_id = p_project_id;

    RETURN result;
END;
$$;

-- ============================================================
-- Performance indexes cho module QLDA
-- ============================================================

-- Composite index cho ProjectService._applyFilters
CREATE INDEX IF NOT EXISTS idx_projects_filters
    ON projects(status, management_board, group_code, specialty_type);

-- Capital & disbursement — queried per project rất thường xuyên
CREATE INDEX IF NOT EXISTS idx_capital_plans_project
    ON capital_plans(project_id);

CREATE INDEX IF NOT EXISTS idx_disbursements_project_status
    ON disbursements(project_id, status);

-- Construction progress — dùng cho RPC ở trên
CREATE INDEX IF NOT EXISTS idx_construction_progress_project
    ON construction_progress(project_id);
