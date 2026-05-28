-- Remove estimated_cost and actual_cost from public.tasks table
ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS estimated_cost,
  DROP COLUMN IF EXISTS actual_cost;
