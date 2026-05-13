-- Migration: Thêm sort_order vào workflow_nodes
-- Run this on Supabase SQL Editor hoặc qua CLI

ALTER TABLE public.workflow_nodes
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing nodes: set sort_order theo created_at order per workflow
WITH ranked AS (
  SELECT id, workflow_id,
    ROW_NUMBER() OVER (PARTITION BY workflow_id ORDER BY created_at ASC) - 1 AS rn
  FROM public.workflow_nodes
  WHERE is_deleted = false OR is_deleted IS NULL
)
UPDATE public.workflow_nodes wn
SET sort_order = ranked.rn
FROM ranked
WHERE wn.id = ranked.id;

-- Index for fast ordering
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_sort_order
  ON public.workflow_nodes(workflow_id, sort_order);

COMMENT ON COLUMN public.workflow_nodes.sort_order IS 'Thứ tự hiển thị node trong workflow (0-indexed)';
