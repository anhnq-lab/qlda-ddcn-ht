-- MIGRATION SCRIPT: Cập nhật hệ thống quản lý công việc chuyên nghiệp (Professional Task Management)
-- Hỗ trợ: Bình luận công việc (Comments) & Nhật ký hoạt động (Activity Logs)

-- 1. Tạo bảng task_comments
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- Nội dung bình luận (Rich Text)
    attachments JSONB DEFAULT '[]'::jsonb, -- Tài liệu đính kèm bình luận
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS cho bảng task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Ai cũng có thể xem bình luận (phù hợp với hệ thống ERP nội bộ)
CREATE POLICY "Cho phép xem bình luận" ON public.task_comments
    FOR SELECT USING (true);

-- Policy: Chỉ user đăng nhập mới được tạo bình luận
CREATE POLICY "Cho phép user tạo bình luận" ON public.task_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Chỉ người tạo bình luận mới được sửa/xóa
CREATE POLICY "Cho phép user sửa bình luận của mình" ON public.task_comments
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Cho phép user xóa bình luận của mình" ON public.task_comments
    FOR DELETE USING (auth.uid() = user_id);


-- 2. Tạo bảng task_activities
CREATE TABLE IF NOT EXISTS public.task_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Có thể là system action (NULL)
    action_type VARCHAR(50) NOT NULL, -- status_changed, assigned, comment_added, created, etc.
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS cho bảng task_activities
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Ai cũng có thể xem log hoạt động
CREATE POLICY "Cho phép xem nhật ký hoạt động" ON public.task_activities
    FOR SELECT USING (true);

-- Policy: Có thể insert log (thường do trigger hoặc API gọi)
CREATE POLICY "Cho phép hệ thống/user tạo log" ON public.task_activities
    FOR INSERT WITH CHECK (true);


-- 3. Tạo Database Trigger để tự động lưu Activity Log khi Task thay đổi (Đặc biệt là Trạng thái và Người thực hiện)
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Kiểm tra nếu chuyển Status
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.task_activities (task_id, user_id, action_type, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status);
    END IF;

    -- Kiểm tra nếu chuyển Assignee
    IF TG_OP = 'UPDATE' AND OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
        INSERT INTO public.task_activities (task_id, user_id, action_type, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'assignee_changed', OLD.assignee_id::text, NEW.assignee_id::text);
    END IF;

    -- Kiểm tra nếu tạo Task mới
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.task_activities (task_id, user_id, action_type, new_value)
        VALUES (NEW.id, auth.uid(), 'task_created', NEW.title);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn Trigger vào bảng tasks
DROP TRIGGER IF EXISTS trigger_log_task_activity ON public.tasks;
CREATE TRIGGER trigger_log_task_activity
    AFTER INSERT OR UPDATE OF status, assignee_id ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.log_task_activity();

-- =======================================================================================
-- Bạn copy toàn bộ nội dung này và chạy trong SQL Editor của Supabase nhé!
-- =======================================================================================

-- 4. RPC Functions for Task Comments and Activities
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
        c.id, c.task_id, c.user_id, c.content, c.attachments, c.created_at, c.updated_at,
        (u.raw_user_meta_data->>'full_name')::TEXT as user_full_name,
        (u.raw_user_meta_data->>'avatar_url')::TEXT as user_avatar_url
    FROM public.task_comments c
    LEFT JOIN auth.users u ON c.user_id = u.id
    WHERE c.task_id = p_task_id
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
        a.id, a.task_id, a.user_id, a.action_type, a.old_value, a.new_value, a.created_at,
        (u.raw_user_meta_data->>'full_name')::TEXT as user_full_name,
        (u.raw_user_meta_data->>'avatar_url')::TEXT as user_avatar_url
    FROM public.task_activities a
    LEFT JOIN auth.users u ON a.user_id = u.id
    WHERE a.task_id = p_task_id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
