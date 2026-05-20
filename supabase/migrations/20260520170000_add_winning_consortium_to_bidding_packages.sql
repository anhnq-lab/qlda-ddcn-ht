-- Migration: Add winning_consortium JSONB column to bidding_packages to support consortium contractors
ALTER TABLE public.bidding_packages ADD COLUMN IF NOT EXISTS winning_consortium jsonb;

-- Comment describing the structure of the JSONB column
COMMENT ON COLUMN public.bidding_packages.winning_consortium IS 'Danh sách nhà thầu liên danh trúng thầu: array of {contractor_id, role, share_percent}';
