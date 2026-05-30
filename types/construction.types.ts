// types/construction.types.ts

export interface ConstructionLog {
  log_id: string;
  project_id: string;
  log_date: string; // YYYY-MM-DD
  weather_temp?: number;
  weather_desc?: string;
  weather_wind?: string;
  construction_status: 'normal' | 'suspended' | 'delayed';
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConstructionLogDetail {
  detail_id: string;
  log_id: string;
  contract_id?: string;
  work_item: string;
  location?: string;
  work_volume?: string;
  status: 'completed' | 'in_progress' | 'delayed';
  safety_status: 'safe' | 'warning' | 'incident';
  safety_notes?: string;
  issues?: string;
  created_at?: string;
}

export interface ConstructionManpower {
  manpower_id: string;
  log_id: string;
  contractor_id?: string;
  role_title: string;
  quantity: number;
  notes?: string;
}

export interface ConstructionEquipment {
  equipment_id: string;
  log_id: string;
  equipment_name: string;
  quantity: number;
  operating_hours?: number;
  status: 'active' | 'broken' | 'idle';
  notes?: string;
}

export interface ConstructionSitePhoto {
  photo_id: string;
  project_id: string;
  log_id?: string;
  image_path: string;
  caption?: string;
  uploaded_by?: string;
  created_at?: string;
  publicUrl?: string;
}

export interface ConstructionProgress {
  progress_id: string;
  project_id: string;
  contract_id?: string;
  task_name: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  weight_percent: number; // 0 - 100
  planned_percent: number; // 0 - 100
  actual_percent: number; // 0 - 100
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  notes?: string;
  sort_order: number;
  updated_at?: string;
}

export interface DailyLogCombinedData {
  log: ConstructionLog;
  details: ConstructionLogDetail[];
  manpower: ConstructionManpower[];
  equipment: ConstructionEquipment[];
}
