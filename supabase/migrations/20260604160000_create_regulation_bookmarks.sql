-- Bảng lưu bookmark điều khoản quy chế theo từng user
CREATE TABLE IF NOT EXISTS public.regulation_bookmarks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id text NOT NULL,
    article_id text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, article_id)
);

CREATE INDEX idx_regulation_bookmarks_user ON public.regulation_bookmarks(user_id);

ALTER TABLE public.regulation_bookmarks ENABLE ROW LEVEL SECURITY;

-- User chỉ đọc/ghi bookmark của chính mình
CREATE POLICY "Users manage own regulation bookmarks"
    ON public.regulation_bookmarks
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
