import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Landmark, Plus, Filter, History, Trash2, Edit2,
  AlertTriangle, RefreshCw, X, DollarSign, Activity, ShieldAlert, BarChart3
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import { PublicAssetForm } from './PublicAssetForm';
import { PublicAssetReports } from './PublicAssetReports';
import { PublicAssetInventory } from './PublicAssetInventory';
import { 
  PublicAsset, 
  PublicAssetCategory, 
  PublicAssetTransaction 
} from '../../types/public-asset.types';
import { formatCurrency } from '../../utils/format';
import { useToast } from '../../components/ui/Toast';
import { useTabSearchParam } from '../../hooks/useTabSearchParam';
import {
  usePublicAssets,
  usePublicAssetCategories,
  usePublicAssetTransactions,
  useCreatePublicAsset,
  useUpdatePublicAsset,
  useDeletePublicAsset,
  useLiquidatePublicAsset,
  useTriggerDepreciation
} from '../../hooks/usePublicAssets';
import { useEmployees } from '../../hooks/useEmployees';
import { useProjects } from '../../hooks/useProjects';

type ActiveTab = 'assets' | 'reports' | 'inventory';

export const PublicAssetList: React.FC = () => {
  const { addToast } = useToast();
  
  // Tabs & UI state
  const [activeTab, setActiveTab] = useTabSearchParam<ActiveTab>('assets', ['assets', 'reports', 'inventory'] as const, 'tab');
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  
  // React Query Fetch Data
  const { data: assets = [], isLoading: isAssetsLoading } = usePublicAssets();
  const { data: categories = [] } = usePublicAssetCategories();
  const { data: employees = [] } = useEmployees();
  const { projects = [], isLoading: isProjectsLoading } = useProjects();

  // Mutations
  const createMutation = useCreatePublicAsset();
  const updateMutation = useUpdatePublicAsset();
  const deleteMutation = useDeletePublicAsset();
  const liquidateMutation = useLiquidatePublicAsset();
  const triggerDepreciationMutation = useTriggerDepreciation();

  const isLoading = isAssetsLoading || isProjectsLoading;

  // Form Modals / Panels
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PublicAsset | null>(null);
  
  // Transaction/History log panel
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyAsset, setHistoryAsset] = useState<PublicAsset | null>(null);
  const { data: assetHistory = [] } = usePublicAssetTransactions(historyAsset?.id || '');

  // Deep linking logic for assetId
  const assetId = searchParams.get('assetId');
  useEffect(() => {
    if (assetId && assets.length > 0) {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        setEditingAsset(asset);
        setIsFormOpen(true);
      }
    }
  }, [assetId, assets]);

  // Filtered assets for DataTable
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesCategory = selectedCategory === '' || a.category_id === selectedCategory;
      const matchesStatus = selectedStatus === '' || a.status === selectedStatus;
      const matchesBranch = selectedBranch === '' || (a as any).branch === selectedBranch;
      const matchesDept = selectedDept === '' || a.department === selectedDept;

      return matchesCategory && matchesStatus && matchesBranch && matchesDept;
    });
  }, [assets, selectedCategory, selectedStatus, selectedBranch, selectedDept]);

  // Quick liquidation dialog
  const [isLiquidationDialogOpen, setIsLiquidationDialogOpen] = useState(false);
  const [liquidationAsset, setLiquidationAsset] = useState<PublicAsset | null>(null);
  const [liquidationReason, setLiquidationReason] = useState('Hết giá trị khấu hao');
  const [isLiquidating, setIsLiquidating] = useState(false);

  // Statistics
  const totalStats = useMemo(() => {
    const activeAssets = assets.filter(a => a.status === 'active');
    const pendingAssets = assets.filter(a => a.status === 'pending_liquidation');
    const totalOriginal = activeAssets.reduce((sum, a) => sum + a.original_cost, 0);
    const totalDep = activeAssets.reduce((sum, a) => sum + a.accumulated_depreciation, 0);
    const totalRemaining = activeAssets.reduce((sum, a) => sum + a.remaining_value, 0);
    return {
      count: activeAssets.length,
      pendingCount: pendingAssets.length,
      original: totalOriginal,
      dep: totalDep,
      remaining: totalRemaining
    };
  }, [assets]);

  // Branches list (chi nhánh) for filter
  const branches = useMemo(() => {
    const vals = assets.map(a => (a as any).branch).filter(Boolean) as string[];
    return Array.from(new Set(vals)).sort();
  }, [assets]);

  // Departments list (phòng ban nội bộ) for filter
  const departments = useMemo(() => {
    const vals = assets.map(a => a.department).filter(Boolean) as string[];
    return Array.from(new Set(vals)).sort();
  }, [assets]);

  // CRUD Actions
  const handleSaveAsset = async (payload: any) => {
    try {
      if (editingAsset) {
        await updateMutation.mutateAsync({ id: editingAsset.id, data: payload });
        addToast({
          title: 'Cập nhật thành công',
          message: `Đã cập nhật thông tin tài sản công ${payload.asset_name}.`,
          type: 'success'
        });
      } else {
        await createMutation.mutateAsync(payload);
        addToast({
          title: 'Ghi tăng thành công',
          message: `Đã ghi tăng tài sản công mới ${payload.asset_name}.`,
          type: 'success'
        });
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Lỗi thực thi',
        message: (err as Error).message || 'Không thể lưu thông tin tài sản.',
        type: 'error'
      });
      throw err;
    }
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài sản "${name}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      addToast({
        title: 'Đã xóa tài sản',
        message: `Đã xóa tài sản công "${name}" khỏi hệ thống.`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Lỗi',
        message: 'Không thể xóa tài sản này.',
        type: 'error'
      });
    }
  };

  // Quick liquidation: mark asset as pending_liquidation
  const handleQuickLiquidation = (asset: PublicAsset) => {
    setLiquidationAsset(asset);
    setLiquidationReason('Hết giá trị khấu hao');
    setIsLiquidationDialogOpen(true);
  };

  const handleConfirmLiquidation = async () => {
    if (!liquidationAsset) return;
    try {
      setIsLiquidating(true);
      await liquidateMutation.mutateAsync({ assetId: liquidationAsset.id, reason: liquidationReason });
      addToast({ title: 'Đã đề xuất thanh lý', message: `Tài sản "${liquidationAsset.asset_name}" đã chuyển sang trạng thái chờ thanh lý.`, type: 'success' });
    } catch (err) {
      addToast({ title: 'Lỗi', message: (err as Error).message, type: 'error' });
    } finally {
      setIsLiquidating(false);
      setIsLiquidationDialogOpen(false);
      setLiquidationAsset(null);
    }
  };

  // Open asset history transactions side panel
  const handleViewHistory = (asset: PublicAsset) => {
    setHistoryAsset(asset);
    setIsHistoryOpen(true);
  };

  // Calculate annual depreciation trigger
  const handleTriggerDepreciation = async () => {
    const currentYear = new Date().getFullYear();
    if (!confirm(`Bạn có chắc chắn muốn thực hiện tính hao mòn tài sản công tự động cho năm tài chính ${currentYear}?`)) {
      return;
    }

    try {
      await triggerDepreciationMutation.mutateAsync(currentYear);
      addToast({
        title: 'Tính hao mòn hoàn tất',
        message: `Đã hoàn thành tính hao mòn cho tài sản công đang hoạt động năm ${currentYear}.`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Thất bại',
        message: (err as Error).message || 'Lỗi tính hao mòn.',
        type: 'error'
      });
    }
  };

  // DataTable columns configuration
  const columns = [
    {
      key: 'stt',
      header: 'STT',
      width: '4%',
      align: 'center' as const,
      render: (_: any, row: PublicAsset) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {filteredAssets.indexOf(row) + 1}
        </span>
      )
    },
    {
      key: 'asset_code',
      header: 'Mã tài sản',
      sortable: true,
      width: '10%',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'asset_name',
      header: 'Tên tài sản',
      sortable: true,
      width: '22%',
      render: (val: string, row: PublicAsset) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-200">{val}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">{row.category?.name || 'Chưa phân loại'}</div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Người sử dụng',
      sortable: true,
      width: '13%',
      render: (val: string, row: PublicAsset) => {
        const user = row.custodian?.name || val || '—';
        return (
          <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{user}</div>
        );
      }
    },
    {
      key: 'original_cost',
      header: 'Nguyên giá (VNĐ)',
      sortable: true,
      align: 'right' as const,
      width: '13%',
      render: (val: number) => <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(val)}</span>
    },
    {
      key: 'remaining_value',
      header: 'Giá trị còn lại',
      sortable: true,
      align: 'right' as const,
      width: '13%',
      render: (val: number, row: PublicAsset) => (
        <div>
          <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(val)}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Hao mòn: {formatCurrency(row.accumulated_depreciation)}</div>
        </div>
      )
    },
    {
      key: 'branch',
      header: 'Chi nhánh',
      sortable: true,
      width: '10%',
      render: (_: any, row: PublicAsset) => {
        const b = (row as any).branch;
        return <div className="font-medium text-slate-700 dark:text-slate-300 text-xs">{b || '—'}</div>;
      }
    },
    {
      key: 'department',
      header: 'Phòng ban',
      sortable: true,
      width: '11%',
      render: (val: string) => (
        <div className="text-xs text-slate-500 dark:text-slate-400">{val || '—'}</div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      width: '10%',
      render: (val: string) => {
        const statuses = {
          active: { label: 'Hoạt động', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40' },
          pending_liquidation: { label: 'Chờ thanh lý', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40' },
          liquidated: { label: 'Đã thanh lý', cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40' },
          transferred: { label: 'Điều chuyển', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40' }
        };
        const st = statuses[val as keyof typeof statuses] || { label: val, cls: 'bg-slate-50 text-slate-700 border-slate-200' };
        return (
          <span className={`px-2 py-0.5 border text-[11px] font-bold rounded-full ${st.cls}`}>
            {st.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Hành động',
      width: '8%',
      align: 'center' as const,
      render: (_: any, row: PublicAsset) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => handleViewHistory(row)}
            title="Lịch sử biến động"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditingAsset(row); setIsFormOpen(true); }}
            title="Chỉnh sửa"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {row.status === 'active' && (
            <button
              onClick={() => handleQuickLiquidation(row)}
              title="Đề xuất thanh lý"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDeleteAsset(row.id, row.asset_name)}
            title="Xóa tài sản"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col flex-1 h-full min-h-screen bg-slate-50/50 dark:bg-slate-900">
      
      {/* Page Header */}
      <PageHeader
        title="Quản lý Tài sản công"
        description="Theo dõi danh mục tài sản, hao mòn tài sản công và kiểm kê đúng quy định pháp luật."
        icon={<Landmark className="w-6 h-6 text-primary-600 dark:text-primary-400" />}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleTriggerDepreciation}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Tính hao mòn tự động
            </button>
            <button
              onClick={() => {
                setEditingAsset(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 text-sm"
            >
              <Plus className="w-4 h-4" />
              Ghi tăng tài sản
            </button>
          </div>
        }
        tabs={
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-4 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2
                ${activeTab === 'assets' 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Danh sách tài sản
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2
                ${activeTab === 'reports' 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Báo cáo Phụ lục 2
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2
                ${activeTab === 'inventory' 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Đối chiếu & Kiểm kê thực tế
            </button>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="px-6 py-6 flex-1">
        {activeTab === 'assets' && (
          <div className="space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/30 rounded-xl flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5 text-primary-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Đang dùng</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalStats.count}</div>
                  {totalStats.pendingCount > 0 && (
                    <div className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
                      <ShieldAlert className="w-3 h-3" />{totalStats.pendingCount} chờ thanh lý
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nguyên giá</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">{formatCurrency(totalStats.original)}</div>
                  <div className="text-[10px] text-slate-400">Tổng tài sản đang hoạt động</div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Hao mòn lũy kế</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">{formatCurrency(totalStats.dep)}</div>
                  <div className="text-[10px] text-slate-400">Khấu hao qua các năm</div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-50 dark:bg-violet-950/30 rounded-xl flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-violet-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Còn lại</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(totalStats.remaining)}</div>
                  <div className="text-[10px] text-slate-400">Giá trị thuần hiện tại</div>
                </div>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full">
                <div className="flex items-center gap-1.5 border border-slate-100 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-xs text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Tất cả phân loại --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 border border-slate-100 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent text-xs text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Tất cả trạng thái --</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="pending_liquidation">Chờ thanh lý</option>
                    <option value="liquidated">Đã thanh lý</option>
                    <option value="transferred">Đã điều chuyển</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 border border-slate-100 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="bg-transparent text-xs text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Tất cả chi nhánh --</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 border border-slate-100 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="bg-transparent text-xs text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Tất cả phòng ban --</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* DataTable */}
            <DataTable<PublicAsset>
              data={filteredAssets}
              columns={columns}
              keyExtractor={row => row.id}
              isLoading={isLoading}
              emptyMessage="Không tìm thấy tài sản công nào phù hợp với bộ lọc."
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <PublicAssetReports assets={assets} />
        )}

        {activeTab === 'inventory' && (
          <PublicAssetInventory assets={assets} />
        )}
      </div>

      {/* Asset Form Slide Panel / Modal */}
      <PublicAssetForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveAsset}
        editAsset={editingAsset}
        categories={categories}
        employees={employees}
        projects={projects}
      />

      {/* Quick Liquidation Dialog */}
      {isLiquidationDialogOpen && liquidationAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Đề xuất thanh lý tài sản</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{liquidationAsset.asset_name} ({liquidationAsset.asset_code})</p>
              </div>
            </div>

            <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Tài sản sẽ được chuyển sang trạng thái <strong>Chờ thanh lý</strong>. Cần có quyết định của Giám đốc Ban để hoàn thành thủ tục.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Giá trị còn lại</label>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(liquidationAsset.remaining_value)}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lý do đề nghị thanh lý <span className="text-red-500">*</span></label>
                <select
                  value={liquidationReason}
                  onChange={e => setLiquidationReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option>Hết giá trị khấu hao</option>
                  <option>Hỏng hóc, không sửa chữa được</option>
                  <option>Lạc hậu, không còn phù hợp</option>
                  <option>Không có nhu cầu sử dụng</option>
                  <option>Khác</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setIsLiquidationDialogOpen(false); setLiquidationAsset(null); }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmLiquidation}
                disabled={isLiquidating}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm"
              >
                {isLiquidating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                Xác nhận đề xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Side Panel */}
      {isHistoryOpen && historyAsset && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => {
          if (e.target === e.currentTarget) setIsHistoryOpen(false);
        }}>
          <div className="bg-white dark:bg-slate-900 shadow-2xl w-full max-w-xl h-full overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Panel Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-primary-500" />
                  Lịch sử biến động tài sản công
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">{historyAsset.asset_name} ({historyAsset.asset_code})</p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Content (Timeline list of transactions) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-6 space-y-6">
                {assetHistory.map((tx) => (
                  <div key={tx.id} className="relative">
                    {/* Circle icon marker on line */}
                    <div className={`absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center
                      ${tx.transaction_type === 'increase' ? 'bg-emerald-500' :
                        tx.transaction_type === 'decrease' ? 'bg-red-500' :
                        tx.transaction_type === 'revalue' ? 'bg-amber-500' : 'bg-blue-500'}
                    `} />
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400">{new Date(tx.transaction_date).toLocaleDateString('vi-VN')}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                          ${tx.transaction_type === 'increase' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' :
                            tx.transaction_type === 'decrease' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' :
                            tx.transaction_type === 'revalue' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'}
                        `}>
                          {tx.transaction_type === 'increase' ? 'Ghi tăng' :
                           tx.transaction_type === 'decrease' ? 'Ghi giảm' :
                           tx.transaction_type === 'revalue' ? 'Hao mòn/Đánh giá' : 'Sửa chữa lớn'}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{tx.description}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Lý do: {tx.reason}</p>
                      
                      {tx.decision_number && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          Quyết định: {tx.decision_number} {tx.decision_date ? `ngày ${new Date(tx.decision_date).toLocaleDateString('vi-VN')}` : ''}
                        </p>
                      )}

                      {/* Cost Changes details */}
                      <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px]">
                        <div>
                          <span className="text-slate-400 block">Biến động nguyên giá</span>
                          <span className={`font-bold ${(tx.cost_change || 0) > 0 ? 'text-emerald-600' : (tx.cost_change || 0) < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                            {(tx.cost_change || 0) > 0 ? '+' : ''}{formatCurrency(tx.cost_change || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Biến động hao mòn</span>
                          <span className={`font-bold ${(tx.depreciation_change || 0) > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {(tx.depreciation_change || 0) > 0 ? '+' : ''}{formatCurrency(tx.depreciation_change || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {assetHistory.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 pl-2">Chưa có lịch sử biến động nào được ghi nhận.</p>
                )}
              </div>
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicAssetList;
