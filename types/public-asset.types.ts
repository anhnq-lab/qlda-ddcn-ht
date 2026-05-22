// Types for Public Asset Management Module (Quản lý Tài sản công)
// Based on Circular 23/2023/TT-BTC

export interface PublicAssetCategory {
  id: string;
  code: string;
  name: string;
  parent_id?: string;
  asset_type: 'tangible' | 'intangible';
  depreciation_rate: number; // in percent per year, e.g. 20.00 for 20%
  useful_life_years: number;
  created_at?: string;
}

export interface PublicAsset {
  id: string;
  asset_code: string;
  asset_name: string;
  category_id: string;
  category?: PublicAssetCategory;
  description?: string;
  unit: string;
  quantity: number;
  location?: string;
  branch?: string;      // Chi nhánh / Văn phòng (Trụ sở chính, Can Lộc, Thạch Hà...)
  department?: string;  // Phòng ban nội bộ (Phòng Kỹ thuật, Phòng Tài chính...)
  custodian_id?: string;
  custodian?: { name: string; position?: string; email?: string }; // joined from employees
  project_id?: string;
  project?: { project_name: string }; // joined from projects
  
  purchase_date: string; // ISO date string (YYYY-MM-DD)
  use_date: string; // ISO date string (YYYY-MM-DD)
  
  original_cost: number; // in VND
  funding_budget_cost?: number; // in VND
  funding_other_cost?: number; // in VND
  
  depreciation_rate: number; // in percent, copy from category or override
  accumulated_depreciation: number; // in VND
  remaining_value: number; // in VND (original_cost - accumulated_depreciation)
  
  status: 'active' | 'liquidated' | 'pending_liquidation' | 'transferred';
  created_at?: string;
  updated_at?: string;
}

export interface PublicAssetTransaction {
  id: string;
  asset_id: string;
  asset?: PublicAsset;
  transaction_date: string; // YYYY-MM-DD
  transaction_type: 'increase' | 'decrease' | 'revalue' | 'repair';
  reason: string; // e.g. 'purchase', 'project_handover', 'liquidation', 'transfer_out', 'upgrade'
  description?: string;
  decision_number?: string;
  decision_date?: string; // YYYY-MM-DD
  cost_change: number; // +/- original cost change
  depreciation_change: number; // +/- accumulated depreciation change
  created_by?: string;
  created_at?: string;
}

export interface PublicAssetInventory {
  id: string;
  title: string;
  inventory_date: string;
  status: 'draft' | 'completed';
  notes?: string;
  created_by?: string;
  created_at?: string;
}

export interface PublicAssetInventoryDetail {
  id: string;
  inventory_id: string;
  asset_id: string;
  asset?: PublicAsset;
  book_quantity: number;
  actual_quantity: number;
  difference_quantity: number;
  condition?: string; // e.g. 'good', 'damaged', 'need_repair'
  notes?: string;
}
