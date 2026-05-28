-- Add luy_ke_nghiem_thu column to capital_plans
ALTER TABLE public.capital_plans
  ADD COLUMN IF NOT EXISTS luy_ke_nghiem_thu numeric DEFAULT 0;
