-- Migration: Update position for appraisal officers (Thẩm kế viên -> Thành viên)
-- Date: 2026-06-02

UPDATE public.employees
SET position = 'Thành viên'
WHERE position = 'Thẩm kế viên';
