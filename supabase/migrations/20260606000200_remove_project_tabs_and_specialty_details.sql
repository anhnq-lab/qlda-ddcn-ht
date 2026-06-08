-- Migration: Xóa các cột Quy mô, Trạng thái điều chỉnh, Chi tiết chuyên ngành
-- Date: 2026-06-06

-- 1. Xóa các quyền liên quan đến trường dữ liệu bị xóa
DELETE FROM public.project_field_permissions
WHERE field_key IN (
  'total_estimate',
  'site_area',
  'construction_area',
  'floor_area',
  'building_height',
  'building_density',
  'land_use_coefficient',
  'above_ground_floors',
  'basement_floors',
  'adjusted_approval',
  'project_status_info',
  'specialty_details'
);

-- 2. Xóa các cột trên bảng projects
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS total_estimate,
  DROP COLUMN IF EXISTS site_area,
  DROP COLUMN IF EXISTS construction_area,
  DROP COLUMN IF EXISTS floor_area,
  DROP COLUMN IF EXISTS building_height,
  DROP COLUMN IF EXISTS building_density,
  DROP COLUMN IF EXISTS land_use_coefficient,
  DROP COLUMN IF EXISTS above_ground_floors,
  DROP COLUMN IF EXISTS basement_floors,
  DROP COLUMN IF EXISTS adjusted_approval,
  DROP COLUMN IF EXISTS project_status_info,
  DROP COLUMN IF EXISTS specialty_details;
