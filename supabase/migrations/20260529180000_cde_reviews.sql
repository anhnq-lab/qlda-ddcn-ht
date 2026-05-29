-- ═══════════════════════════════════════════════════════════════════════════
-- CDE Reviews — GĐ4: gói duyệt nhiều tài liệu (kiểu Autodesk Docs Reviews)
-- cde_reviews         : gói duyệt (tiêu đề, hạn, trạng thái rollup)
-- cde_review_items    : tài liệu thuộc gói (documents.doc_id)
-- cde_review_approvers: người duyệt + quyết định (pending/approved/rejected)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cde_reviews (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   text NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    title        text NOT NULL,
    description  text,
    due_date     date,
    status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','approved','rejected','closed')),
    created_by   text,
    created_by_name text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cde_reviews_project_idx ON public.cde_reviews(project_id);

CREATE TABLE IF NOT EXISTS public.cde_review_items (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id   uuid NOT NULL REFERENCES public.cde_reviews(id) ON DELETE CASCADE,
    doc_id      integer NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(review_id, doc_id)
);
CREATE INDEX IF NOT EXISTS cde_review_items_review_idx ON public.cde_review_items(review_id);

CREATE TABLE IF NOT EXISTS public.cde_review_approvers (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id     uuid NOT NULL REFERENCES public.cde_reviews(id) ON DELETE CASCADE,
    approver_id   text,
    approver_name text NOT NULL,
    decision      text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending','approved','rejected')),
    comment       text,
    signed        boolean NOT NULL DEFAULT false,
    decided_at    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cde_review_approvers_review_idx ON public.cde_review_approvers(review_id);

-- touch updated_at
CREATE OR REPLACE FUNCTION public.cde_reviews_touch_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cde_reviews_touch ON public.cde_reviews;
CREATE TRIGGER cde_reviews_touch BEFORE UPDATE ON public.cde_reviews
FOR EACH ROW EXECUTE FUNCTION public.cde_reviews_touch_updated_at();

-- RLS (baseline: authenticated; hardening theo project ở workstream bảo mật riêng)
ALTER TABLE public.cde_reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cde_review_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cde_review_approvers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth all cde_reviews" ON public.cde_reviews;
CREATE POLICY "auth all cde_reviews" ON public.cde_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all cde_review_items" ON public.cde_review_items;
CREATE POLICY "auth all cde_review_items" ON public.cde_review_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all cde_review_approvers" ON public.cde_review_approvers;
CREATE POLICY "auth all cde_review_approvers" ON public.cde_review_approvers FOR ALL TO authenticated USING (true) WITH CHECK (true);
