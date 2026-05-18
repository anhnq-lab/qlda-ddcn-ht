-- Add personnel JSONB column to bidding_packages
-- Stores list of contractor personnel assigned to the package
-- Format: [{"name": string, "title": string, "role": string, "certNo": string}]

ALTER TABLE bidding_packages
  ADD COLUMN IF NOT EXISTS personnel JSONB DEFAULT '[]'::jsonb;
