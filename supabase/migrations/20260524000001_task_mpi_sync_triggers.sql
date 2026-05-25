-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Sync triggers giữa tasks ↔ monthly_plan_items
-- ═══════════════════════════════════════════════════════════════
-- LOGIC:
--   tasks.status thay đổi  →  tính lại aggregate status cho MPI cha
--                              (completed/partial/planned)
--
--   tasks.progress thay đổi → tính lại progress trung bình cho MPI cha
--                              (lưu vào mpi.completion_result như "Tiến độ X%")
--                              (KHÔNG cập nhật mpi.status để tránh override
--                               báo cáo thủ công của phòng ban)
--
--   ⚠️ Không có chiều ngược (MPI → tasks) để tránh vòng lặp & override
--      trạng thái cá nhân của từng task.
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. Function tính aggregate status ─────────────────────────
CREATE OR REPLACE FUNCTION public.compute_mpi_status_from_tasks(p_mpi_id UUID)
RETURNS monthly_task_status AS $$
DECLARE
    v_total INT;
    v_done INT;
    v_in_progress INT;
    v_incomplete INT;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'done'),
        COUNT(*) FILTER (WHERE status = 'in_progress'),
        COUNT(*) FILTER (WHERE status = 'incomplete')
    INTO v_total, v_done, v_in_progress, v_incomplete
    FROM public.tasks
    WHERE monthly_plan_item_id = p_mpi_id;

    -- Không có task nào → giữ status hiện tại (return planned mặc định)
    IF v_total = 0 THEN
        RETURN 'planned'::monthly_task_status;
    END IF;

    -- Tất cả task done → completed
    IF v_done = v_total THEN
        RETURN 'completed'::monthly_task_status;
    END IF;

    -- Có task done nhưng chưa hết → partial
    IF v_done > 0 THEN
        RETURN 'partial'::monthly_task_status;
    END IF;

    -- Có task incomplete (đánh dấu chủ động không hoàn thành) → incomplete
    IF v_incomplete > 0 THEN
        RETURN 'incomplete'::monthly_task_status;
    END IF;

    -- Còn lại (todo/in_progress) → planned
    RETURN 'planned'::monthly_task_status;
END;
$$ LANGUAGE plpgsql STABLE;


-- ─── 2. Trigger function: sync MPI khi task thay đổi ─────────
CREATE OR REPLACE FUNCTION public.sync_mpi_from_task()
RETURNS TRIGGER AS $$
DECLARE
    v_mpi_old UUID;
    v_mpi_new UUID;
    v_avg_progress NUMERIC;
BEGIN
    -- Xác định MPI bị ảnh hưởng (cả OLD và NEW vì task có thể đổi mpi_id)
    v_mpi_old := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.monthly_plan_item_id END;
    v_mpi_new := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.monthly_plan_item_id END;

    -- Cập nhật MPI cũ nếu task chuyển đi
    IF v_mpi_old IS NOT NULL AND v_mpi_old IS DISTINCT FROM v_mpi_new THEN
        UPDATE public.monthly_plan_items
        SET status = public.compute_mpi_status_from_tasks(v_mpi_old)
        WHERE id = v_mpi_old;
    END IF;

    -- Cập nhật MPI mới
    IF v_mpi_new IS NOT NULL THEN
        UPDATE public.monthly_plan_items
        SET status = public.compute_mpi_status_from_tasks(v_mpi_new)
        WHERE id = v_mpi_new;

        -- Tính progress trung bình các task con để hiển thị
        SELECT ROUND(AVG(progress)::numeric, 0)
        INTO v_avg_progress
        FROM public.tasks
        WHERE monthly_plan_item_id = v_mpi_new;

        -- Lưu vào completion_result để UI hiển thị (chỉ khi user CHƯA tự nhập)
        UPDATE public.monthly_plan_items
        SET completion_result = COALESCE(NULLIF(completion_result, ''),
                                          'Tiến độ trung bình: ' || COALESCE(v_avg_progress, 0)::text || '%')
        WHERE id = v_mpi_new
          AND (completion_result IS NULL OR completion_result LIKE 'Tiến độ trung bình:%');
    END IF;

    RETURN NULL;  -- AFTER trigger
END;
$$ LANGUAGE plpgsql;


-- ─── 3. Triggers ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sync_mpi_from_task_iu ON public.tasks;
CREATE TRIGGER trg_sync_mpi_from_task_iu
    AFTER INSERT OR UPDATE OF status, progress, monthly_plan_item_id
    ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_mpi_from_task();

DROP TRIGGER IF EXISTS trg_sync_mpi_from_task_d ON public.tasks;
CREATE TRIGGER trg_sync_mpi_from_task_d
    AFTER DELETE
    ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_mpi_from_task();


-- ─── 4. Trigger: cascade delete tasks khi xóa MPI (project_step) ─
-- Khi xóa step trong tab KH dự án → xóa cả tasks con
-- (đã có ON DELETE SET NULL trên tasks.monthly_plan_item_id, ta thay bằng cascade thủ công
--  để chỉ cascade với step kiểu 'project_step' — KH tháng item không cascade)
CREATE OR REPLACE FUNCTION public.cascade_delete_tasks_with_step()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ cascade nếu là project_step (step trong KH dự án)
    -- KH tháng item bị xóa → giữ task lại
    IF OLD.schedule_state = 'project_step' THEN
        DELETE FROM public.tasks
        WHERE monthly_plan_item_id = OLD.id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cascade_delete_tasks_with_step ON public.monthly_plan_items;
CREATE TRIGGER trg_cascade_delete_tasks_with_step
    BEFORE DELETE
    ON public.monthly_plan_items
    FOR EACH ROW
    EXECUTE FUNCTION public.cascade_delete_tasks_with_step();


-- ─── 5. RPC: schedule_project_steps_to_month ──────────────────
-- Gán nhiều project_steps vào 1 KH tháng (atomic)
CREATE OR REPLACE FUNCTION public.schedule_project_steps_to_month(
    p_step_ids UUID[],
    p_monthly_plan_id UUID
)
RETURNS TABLE (scheduled_count INT, skipped_count INT) AS $$
DECLARE
    v_scheduled INT;
    v_skipped INT;
BEGIN
    -- Đếm số step hợp lệ (đang là project_step)
    SELECT COUNT(*) INTO v_scheduled
    FROM public.monthly_plan_items
    WHERE id = ANY(p_step_ids)
      AND schedule_state = 'project_step';

    -- Đếm số step bị skip (đã scheduled rồi)
    v_skipped := COALESCE(array_length(p_step_ids, 1), 0) - v_scheduled;

    -- Update
    UPDATE public.monthly_plan_items
    SET
        schedule_state = 'monthly_plan',
        monthly_plan_id = p_monthly_plan_id,
        scheduled_at = NOW()
    WHERE id = ANY(p_step_ids)
      AND schedule_state = 'project_step';

    RETURN QUERY SELECT v_scheduled, v_skipped;
END;
$$ LANGUAGE plpgsql;


-- ─── 6. RPC: unschedule_steps (đưa về project_step) ──────────
CREATE OR REPLACE FUNCTION public.unschedule_steps(
    p_step_ids UUID[]
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE public.monthly_plan_items
    SET
        schedule_state = 'project_step',
        monthly_plan_id = NULL,
        scheduled_at = NULL
    WHERE id = ANY(p_step_ids)
      AND schedule_state = 'monthly_plan';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;


COMMENT ON FUNCTION public.compute_mpi_status_from_tasks IS
    'Tính aggregate status cho monthly_plan_item dựa trên tasks con (completed/partial/incomplete/planned)';
COMMENT ON FUNCTION public.sync_mpi_from_task IS
    'Trigger function: tự động cập nhật mpi.status khi task con thay đổi (1 chiều: task → mpi)';
COMMENT ON FUNCTION public.cascade_delete_tasks_with_step IS
    'Xóa cascade tasks khi xóa step (chỉ áp dụng cho schedule_state=project_step)';
COMMENT ON FUNCTION public.schedule_project_steps_to_month IS
    'Gán nhiều project_steps vào 1 KH tháng — atomic, idempotent';
COMMENT ON FUNCTION public.unschedule_steps IS
    'Đưa steps về trạng thái project_step (gỡ khỏi KH tháng)';
