-- Migration: Add legal_status column to documents table
-- Date: 2026-05-28

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS legal_status TEXT DEFAULT 'active';
