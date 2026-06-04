-- =============================================
-- CRUD tables cho module Quy chế
-- Thay thế dữ liệu hardcoded trong file TSX
-- =============================================

-- 1. Bảng quy chế (document)
CREATE TABLE IF NOT EXISTS public.regulation_documents (
    id text PRIMARY KEY,
    code text NOT NULL,
    title text NOT NULL,
    description text DEFAULT '',
    date text DEFAULT '',
    effective_date text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
    pdf_url text,
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Bảng chương
CREATE TABLE IF NOT EXISTS public.regulation_chapters (
    id text PRIMARY KEY,
    document_id text NOT NULL REFERENCES public.regulation_documents(id) ON DELETE CASCADE,
    code text NOT NULL,
    title text NOT NULL,
    icon text,
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_reg_chapters_doc ON public.regulation_chapters(document_id);

-- 3. Bảng điều khoản
CREATE TABLE IF NOT EXISTS public.regulation_articles (
    id text PRIMARY KEY,
    chapter_id text NOT NULL REFERENCES public.regulation_chapters(id) ON DELETE CASCADE,
    code text NOT NULL,
    title text NOT NULL,
    content text DEFAULT '',
    content_type text DEFAULT 'text' CHECK (content_type IN ('text', 'markdown', 'component')),
    component_key text,
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_reg_articles_chapter ON public.regulation_articles(chapter_id);

-- RLS
ALTER TABLE public.regulation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulation_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulation_articles ENABLE ROW LEVEL SECURITY;

-- Mọi authenticated user được đọc
CREATE POLICY "Authenticated read regulation_documents"
    ON public.regulation_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read regulation_chapters"
    ON public.regulation_chapters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read regulation_articles"
    ON public.regulation_articles FOR SELECT TO authenticated USING (true);

-- Chỉ admin được sửa
CREATE POLICY "Admin write regulation_documents"
    ON public.regulation_documents FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write regulation_chapters"
    ON public.regulation_chapters FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write regulation_articles"
    ON public.regulation_articles FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Triggers updated_at
CREATE TRIGGER set_updated_at_reg_docs BEFORE UPDATE ON public.regulation_documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_reg_chapters BEFORE UPDATE ON public.regulation_chapters
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_reg_articles BEFORE UPDATE ON public.regulation_articles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
