-- Add vehicle column to agency_events table
ALTER TABLE public.agency_events 
ADD COLUMN IF NOT EXISTS vehicle text NULL;

COMMENT ON COLUMN public.agency_events.vehicle IS 'Phương tiện di chuyển (xe cơ quan hoặc tự túc)';
