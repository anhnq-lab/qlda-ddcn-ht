// Types for Public Asset Management Module (Quản lý Tài sản công)
// Based on Circular 23/2023/TT-BTC

export interface PublicAssetCategory {
  id: string;
  code: string;
  name: string;
  parent_id?: string | null;
  asset_type: 'tangible' | 'intangible' | string;
  depreciation_rate?: number | null; // in percent per year, e.g. 20.00 for 20%
  useful_life_years?: number | null;
  created_at?: string | null;
}

export interface PublicAsset {
  id: string;
  asset_code: string;
  asset_name: string;
  category_id: string;
  category?: PublicAssetCategory | null;
  description?: string | null;
  unit: string;
  quantity: number;
  location?: string | null;
  branch?: string | null;      // Chi nhánh / Văn phòng (Trụ sở chính, Can Lộc, Thạch Hà...)
  department?: string | null;  // Phòng ban nội bộ (Phòng Kỹ thuật, Phòng Tài chính...)
  custodian_id?: string | null;
  custodian?: { name: string; position?: string | null; email?: string | null } | null; // joined from employees
  project_id?: string | null;
  project?: { project_name: string } | null; // joined from projects
  
  purchase_date: string; // ISO date string (YYYY-MM-DD)
  use_date: string; // ISO date string (YYYY-MM-DD)
  
  original_cost: number; // in VND
  funding_budget_cost?: number | null; // in VND
  funding_other_cost?: number | null; // in VND
  
  depreciation_rate: number; // in percent, copy from category or override
  accumulated_depreciation: number; // in VND
  remaining_value: number; // in VND (original_cost - accumulated_depreciation)
  
  status: 'active' | 'liquidated' | 'pending_liquidation' | 'transferred' | string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PublicAssetTransaction {
  id: string;
  asset_id: string;
  asset?: PublicAsset | null;
  transaction_date: string; // YYYY-MM-DD
  transaction_type: 'increase' | 'decrease' | 'revalue' | 'repair' | string;
  reason: string; // e.g. 'purchase', 'project_handover', 'liquidation', 'transfer_out', 'upgrade'
  description?: string | null;
  decision_number?: string | null;
  decision_date?: string | null; // YYYY-MM-DD
  cost_change: number | null; // +/- original cost change
  depreciation_change: number | null; // +/- accumulated depreciation change
  created_by?: string | null;
  created_at?: string | null;
}

export interface PublicAssetInventory {
  id: string;
  title: string;
  inventory_date: string;
  status: 'draft' | 'completed' | string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string | null;
}

export interface PublicAssetInventoryDetail {
  id: string;
  inventory_id: string;
  asset_id: string;
  asset?: PublicAsset | null;
  book_quantity: number | null;
  actual_quantity: number | null;
  difference_quantity: number | null;
  condition?: string | null; // e.g. 'good', 'damaged', 'need_repair'
  notes?: string | null;
}
