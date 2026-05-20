-- Migration: Add foreign key constraint between bidding_packages and contractors
-- Allows PostgREST (Supabase) to resolve the relation for nested queries like contractors(full_name).

-- First, clean up any orphaned/invalid winning_contractor_id in bidding_packages
UPDATE public.bidding_packages 
SET winning_contractor_id = NULL 
WHERE winning_contractor_id IS NOT NULL 
  AND winning_contractor_id != '' 
  AND winning_contractor_id NOT IN (SELECT contractor_id FROM public.contractors);

-- Then, add the foreign key constraint
ALTER TABLE public.bidding_packages 
  DROP CONSTRAINT IF EXISTS fk_bidding_packages_winning_contractor_id,
  ADD CONSTRAINT fk_bidding_packages_winning_contractor_id 
  FOREIGN KEY (winning_contractor_id) 
  REFERENCES public.contractors(contractor_id) 
  ON DELETE SET NULL;
