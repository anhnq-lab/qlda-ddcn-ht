// Public Asset Service - Supabase Operations for Asset Management
import { supabaseExt as supabase } from '../lib/supabase';
import type { 
  PublicAsset, 
  PublicAssetCategory, 
  PublicAssetTransaction, 
  PublicAssetInventory, 
  PublicAssetInventoryDetail 
} from '../types/public-asset.types';

export class PublicAssetService {
  // ==========================================
  // Categories
  // ==========================================
  static async getCategories(): Promise<PublicAssetCategory[]> {
    const { data, error } = await supabase
      .from('public_asset_categories')
      .select('*')
      .order('code');
    if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
    return data || [];
  }

  // ==========================================
  // Assets
  // ==========================================
  static async getAll(params?: {
    search?: string;
    category_id?: string;
    status?: string;
    branch?: string;
    department?: string;
  }): Promise<PublicAsset[]> {
    let query = supabase
      .from('public_assets')
      .select(`
        *,
        category:public_asset_categories(*),
        custodian:employees(employee_id, full_name, position),
        project:projects(project_id, project_name)
      `);

    if (params?.search) {
      const s = params.search;
      query = query.or(`asset_code.ilike.%${s}%,asset_name.ilike.%${s}%,location.ilike.%${s}%`);
    }

    if (params?.category_id) {
      query = query.eq('category_id', params.category_id);
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.branch) {
      query = query.eq('branch', params.branch);
    }

    if (params?.department) {
      query = query.eq('department', params.department);
    }

    const { data, error } = await query.order('asset_code', { ascending: true });
    if (error) throw new Error(`Failed to fetch assets: ${error.message}`);
    
    // Map custodian db model fields to camelCase structure expected in frontend types
    return (data || []).map((row: any) => ({
      ...row,
      custodian: row.custodian ? {
        name: row.custodian.full_name,
        position: row.custodian.position,
        email: row.custodian.email
      } : undefined
    }));
  }

  static async getById(id: string): Promise<PublicAsset | undefined> {
    const { data, error } = await supabase
      .from('public_assets')
      .select(`
        *,
        category:public_asset_categories(*),
        custodian:employees(employee_id, full_name, position),
        project:projects(project_id, project_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to fetch asset: ${error.message}`);
    }

    if (!data) return undefined;

    return {
      ...data,
      custodian: data.custodian ? {
        name: data.custodian.full_name,
        position: data.custodian.position,
        email: data.custodian.email
      } : undefined
    };
  }

  static async create(assetData: Omit<PublicAsset, 'id' | 'created_at' | 'updated_at'>): Promise<PublicAsset> {
    const remainingValue = assetData.original_cost - (assetData.accumulated_depreciation || 0);
    
    const { data, error } = await supabase
      .from('public_assets')
      .insert({
        ...assetData,
        remaining_value: remainingValue
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create asset: ${error.message}`);
    
    // Insert initial 'increase' transaction for history tracking
    await this.createTransaction({
      asset_id: data.id,
      transaction_date: assetData.use_date,
      transaction_type: 'increase',
      reason: 'purchase',
      description: 'Ghi tăng tài sản (Nhập mới vào hệ thống)',
      cost_change: assetData.original_cost,
      depreciation_change: assetData.accumulated_depreciation || 0
    });

    return data;
  }

  static async update(id: string, assetData: Partial<PublicAsset>): Promise<PublicAsset> {
    // If original_cost or accumulated_depreciation changes, recompute remaining_value
    const current = await this.getById(id);
    if (!current) throw new Error('Asset not found');

    const cost = assetData.original_cost !== undefined ? assetData.original_cost : current.original_cost;
    const dep = assetData.accumulated_depreciation !== undefined ? assetData.accumulated_depreciation : current.accumulated_depreciation;
    const remainingValue = cost - dep;

    const { data, error } = await supabase
      .from('public_assets')
      .update({
        ...assetData,
        remaining_value: remainingValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update asset: ${error.message}`);
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('public_assets')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Failed to delete asset: ${error.message}`);
  }

  // ==========================================
  // Transactions (Variations)
  // ==========================================
  static async getTransactionsByAsset(assetId: string): Promise<PublicAssetTransaction[]> {
    const { data, error } = await supabase
      .from('public_asset_transactions')
      .select('*')
      .eq('asset_id', assetId)
      .order('transaction_date', { ascending: false });
    if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
    return data || [];
  }

  static async createTransaction(txData: Omit<PublicAssetTransaction, 'id' | 'created_at'>): Promise<PublicAssetTransaction> {
    const { data, error } = await supabase
      .from('public_asset_transactions')
      .insert(txData)
      .select()
      .single();
    if (error) throw new Error(`Failed to record transaction: ${error.message}`);

    // Update asset values based on transaction
    const asset = await this.getById(txData.asset_id);
    if (asset) {
      const newCost = Number(asset.original_cost) + Number(txData.cost_change || 0);
      const newDep = Number(asset.accumulated_depreciation) + Number(txData.depreciation_change || 0);
      
      let statusUpdate: any = {};
      if (txData.transaction_type === 'decrease') {
        if (txData.reason === 'liquidation') {
          statusUpdate.status = 'liquidated';
        } else if (txData.reason === 'transfer_out') {
          statusUpdate.status = 'transferred';
        }
      }

      await supabase
        .from('public_assets')
        .update({
          original_cost: newCost,
          accumulated_depreciation: newDep,
          remaining_value: newCost - newDep,
          ...statusUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('id', txData.asset_id);
    }

    return data;
  }

  // ==========================================
  // Depreciation calculation trigger
  // Computes annual depreciation for all active assets
  // ==========================================
  static async calculateAnnualDepreciation(year: number): Promise<number> {
    const assets = await this.getAll({ status: 'active' });
    let count = 0;

    for (const asset of assets) {
      // Calculate annual depreciation amount
      // Circular 23/2023/TT-BTC: annual dep = original_cost * depreciation_rate / 100
      const annualDepAmount = Math.round(asset.original_cost * (asset.depreciation_rate / 100));
      
      // Do not exceed original cost
      const maxRemainingDep = asset.original_cost - asset.accumulated_depreciation;
      const actualDepAmount = Math.min(annualDepAmount, maxRemainingDep);

      if (actualDepAmount > 0) {
        await this.createTransaction({
          asset_id: asset.id,
          transaction_date: `${year}-12-31`,
          transaction_type: 'revalue',
          reason: 'depreciation',
          description: `Tính hao mòn tự động năm ${year} (Tỷ lệ: ${asset.depreciation_rate}%)`,
          cost_change: 0,
          depreciation_change: actualDepAmount
        });
        count++;
      }
    }

    return count;
  }

  // ==========================================
  // Inventories
  // ==========================================
  static async getInventories(): Promise<PublicAssetInventory[]> {
    const { data, error } = await supabase
      .from('public_asset_inventories')
      .select('*')
      .order('inventory_date', { ascending: false });
    if (error) throw new Error(`Failed to fetch inventories: ${error.message}`);
    return data || [];
  }

  static async createInventory(title: string, date: string, notes?: string): Promise<PublicAssetInventory> {
    // 1. Create inventory header
    const { data: inv, error } = await supabase
      .from('public_asset_inventories')
      .insert({ title, inventory_date: date, notes, status: 'draft' })
      .select()
      .single();
    if (error) throw new Error(`Failed to create inventory: ${error.message}`);

    // 2. Fetch all active assets to prepopulate details
    const assets = await this.getAll({ status: 'active' });
    const details = assets.map(a => ({
      inventory_id: inv.id,
      asset_id: a.id,
      book_quantity: a.quantity,
      actual_quantity: a.quantity, // default to match book quantity
      condition: 'good',
      notes: ''
    }));

    if (details.length > 0) {
      const { error: detError } = await supabase
        .from('public_asset_inventory_details')
        .insert(details);
      if (detError) throw new Error(`Failed to create inventory details: ${detError.message}`);
    }

    return inv;
  }

  static async getInventoryDetails(inventoryId: string): Promise<PublicAssetInventoryDetail[]> {
    const { data, error } = await supabase
      .from('public_asset_inventory_details')
      .select(`
        *,
        asset:public_assets(*, category:public_asset_categories(*))
      `)
      .eq('inventory_id', inventoryId);
    if (error) throw new Error(`Failed to fetch inventory details: ${error.message}`);
    return data || [];
  }

  static async updateInventoryDetail(id: string, detail: Partial<PublicAssetInventoryDetail>): Promise<void> {
    const { error } = await supabase
      .from('public_asset_inventory_details')
      .update(detail)
      .eq('id', id);
    if (error) throw new Error(`Failed to update inventory detail: ${error.message}`);
  }

  static async completeInventory(inventoryId: string): Promise<void> {
    // Mark inventory as completed
    const { error } = await supabase
      .from('public_asset_inventories')
      .update({ status: 'completed' })
      .eq('id', inventoryId);
    if (error) throw new Error(`Failed to complete inventory: ${error.message}`);

    // Adjust asset quantities if there are discrepancies
    const details = await this.getInventoryDetails(inventoryId);
    for (const d of details) {
      if (d.difference_quantity !== 0) {
        // Log transaction for quantity changes
        await this.createTransaction({
          asset_id: d.asset_id,
          transaction_date: new Date().toISOString().split('T')[0],
          transaction_type: d.difference_quantity > 0 ? 'increase' : 'decrease',
          reason: 'inventory_adjustment',
          description: `Điều chỉnh số lượng qua kiểm kê (Lượt kiểm kê: ID ${inventoryId}). Thay đổi: ${d.difference_quantity}`,
          cost_change: 0, // usually inventory doesn't change cost automatically unless cost evaluation is done
          depreciation_change: 0
        });

        // Update the asset quantity
        await supabase
          .from('public_assets')
          .update({ quantity: d.actual_quantity })
          .eq('id', d.asset_id);
      }
    }
  }
}

export default PublicAssetService;
