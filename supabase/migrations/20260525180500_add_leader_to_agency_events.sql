-- Add leader_id to agency_events table
ALTER TABLE public.agency_events
  ADD COLUMN IF NOT EXISTS leader_id text REFERENCES public.employees(employee_id) ON DELETE SET NULL;

COMMENT ON COLUMN public.agency_events.leader_id IS 'Mã nhân viên chủ trì cuộc họp / sự kiện';
