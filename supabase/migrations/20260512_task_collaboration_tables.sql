-- ============================================================
-- MIGRATION: Task Collaboration Tables
-- Bảng: task_comments, task_activities
-- RPC:  get_task_comments_v2, get_task_activities_v2
-- Trigger: log_task_activity
-- ============================================================

-- 1. Tạo bảng task_comments
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS cho task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_comments_select" ON public.task_comments;
CREATE POLICY "task_comments_select" ON public.task_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "task_comments_insert" ON public.task_comments;
CREATE POLICY "task_comments_insert" ON public.task_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "task_comments_update" ON public.task_comments;
CREATE POLICY "task_comments_update" ON public.task_comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "task_comments_delete" ON public.task_comments;
CREATE POLICY "task_comments_delete" ON public.task_comments FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(created_at DESC);

-- ============================================================

-- 2. Tạo bảng task_activities
CREATE TABLE IF NOT EXISTS public.task_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS cho task_activities
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_activities_select" ON public.task_activities;
CREATE POLICY "task_activities_select" ON public.task_activities FOR SELECT USING (true);

DROP POLICY IF EXISTS "task_activities_insert" ON public.task_activities;
CREATE POLICY "task_activities_insert" ON public.task_activities FOR INSERT WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_task_activities_task_id ON public.task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_created_at ON public.task_activities(created_at DESC);

-- ============================================================

-- 3. Trigger: tự động ghi log hoạt động khi task thay đổi
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.task_activities (task_id, user_id, action_type, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status);
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
        INSERT INTO public.task_activities (task_id, user_id, action_type, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'assignee_changed', OLD.assignee_id::text, NEW.assignee_id::text);
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.task_activities (task_id, user_id, action_type, new_value)
        VALUES (NEW.id, auth.uid(), 'task_created', NEW.title);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_task_activity ON public.tasks;
CREATE TRIGGER trigger_log_task_activity
    AFTER INSERT OR UPDATE OF status, assignee_id ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.log_task_activity();

-- ============================================================

-- 4. RPC: get_task_comments_v2
CREATE OR REPLACE FUNCTION public.get_task_comments_v2(p_task_id UUID)
RETURNS TABLE (
    id UUID,
    task_id UUID,
    user_id UUID,
    content TEXT,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_full_name TEXT,
    user_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id, c.task_id, c.user_id, c.content, c.attachments,
        c.created_at, c.updated_at,
        COALESCE(u.raw_user_meta_data->>'full_name', 'Người dùng')::TEXT AS user_full_name,
        (u.raw_user_meta_data->>'avatar_url')::TEXT AS user_avatar_url
    FROM public.task_comments c
    LEFT JOIN auth.users u ON c.user_id = u.id
    WHERE c.task_id = p_task_id
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: get_task_activities_v2
CREATE OR REPLACE FUNCTION public.get_task_activities_v2(p_task_id UUID)
RETURNS TABLE (
    id UUID,
    task_id UUID,
    user_id UUID,
    action_type VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    user_full_name TEXT,
    user_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id, a.task_id, a.user_id, a.action_type, a.old_value, a.new_value,
        a.created_at,
        COALESCE(u.raw_user_meta_data->>'full_name', 'Hệ thống')::TEXT AS user_full_name,
        (u.raw_user_meta_data->>'avatar_url')::TEXT AS user_avatar_url
    FROM public.task_activities a
    LEFT JOIN auth.users u ON a.user_id = u.id
    WHERE a.task_id = p_task_id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.get_task_comments_v2(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_task_activities_v2(UUID) TO authenticated, anon;
