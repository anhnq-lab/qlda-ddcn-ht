import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, Plus, Search, Filter, History, Trash2, Edit2, Info, 
  Settings, CheckCircle2, AlertTriangle, RefreshCw, Layers, X 
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import { PublicAssetForm } from './PublicAssetForm';
import { PublicAssetReports } from './PublicAssetReports';
import { PublicAssetInventory } from './PublicAssetInventory';
import { PublicAssetService } from '../../services/PublicAssetService';
import { EmployeeService } from '../../services/EmployeeService';
import { ProjectService } from '../../services/ProjectService';
import { 
  PublicAsset, 
  PublicAssetCategory, 
  PublicAssetTransaction 
} from '../../types/public-asset.types';
import { Employee, Project } from '../../types';
import { formatCurrency } from '../../utils/format';
import { useToast } from '../../components/ui/Toast';

type ActiveTab = 'assets' | 'reports' | 'inventory';

export const PublicAssetList: React.FC = () => {
  const { addToast } = useToast();
  
  // Tabs & UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  
  // Data State
  const [assets, setAssets] = useState<PublicAsset[]>([]);
  const [categories, setCategories] = useState<PublicAssetCategory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modals / Panels
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PublicAsset | null>(null);
  
  // Transaction/History log panel
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyAsset, setHistoryAsset] = useState<PublicAsset | null>(null);
  const [assetHistory, setAssetHistory] = useState<PublicAssetTransaction[]>([]);

  // Load resources
  const loadData = async () => {
    try {
      setIsLoading(true);
      const catData = await PublicAssetService.getCategories();
      setCategories(catData);
      
      const empData = await EmployeeService.getAll();
      setEmployees(empData);
      
      const projData = await ProjectService.getAll();
      setProjects(projData);

      const assetData = await PublicAssetService.getAll();
      setAssets(assetData);
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Lỗi tải dữ liệu',
        message: (err as Error).message || 'Không thể kết nối đến máy chủ.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered assets for DataTable
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = searchQuery === '' || 
        a.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.location && a.location.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === '' || a.category_id === selectedCategory;
      const matchesStatus = selectedStatus === '' || a.status === selectedStatus;
      const matchesDept = selectedDept === '' || a.department === selectedDept;

      return matchesSearch && matchesCategory && matchesStatus && matchesDept;
    });
  }, [assets, searchQuery, selectedCategory, selectedStatus, selectedDept]);

  // Statistics
  const totalStats = useMemo(() => {
    const activeAssets = assets.filter(a => a.status === 'active');
    const totalOriginal = activeAssets.reduce((sum, a) => sum + a.original_cost, 0);
    const totalDep = activeAssets.reduce((sum, a) => sum + a.accumulated_depreciation, 0);
    const totalRemaining = activeAssets.reduce((sum, a) => sum + a.remaining_value, 0);
    return {
      count: activeAssets.length,
      original: totalOriginal,
      dep: totalDep,
      remaining: totalRemaining
    };
  }, [assets]);

  // Departments List (unique values for filtering)
  const departments = useMemo(() => {
    const depts = assets.map(a => a.department).filter(Boolean) as string[];
    return Array.from(new Set(depts));
  }, [assets]);

  // CRUD Actions
  const handleSaveAsset = async (payload: any) => {
    try {
      if (editingAsset) {
        await PublicAssetService.update(editingAsset.id, payload);
        addToast({
          title: 'Cập nhật thành công',
          message: `Đã cập nhật thông tin tài sản công ${payload.asset_name}.`,
          type: 'success'
        });
      } else {
        await PublicAssetService.create(payload);
        addToast({
          title: 'Ghi tăng thành công',
          message: `Đã ghi tăng tài sản công mới ${payload.asset_name}.`,
          type: 'success'
        });
      }
      const updated = await PublicAssetService.getAll();
      setAssets(updated);
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
      await PublicAssetService.delete(id);
      addToast({
        title: 'Đã xóa tài sản',
        message: `Đã xóa tài sản công "${name}" khỏi hệ thống.`,
        type: 'success'
      });
      const updated = await PublicAssetService.getAll();
      setAssets(updated);
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Lỗi',
        message: 'Không thể xóa tài sản này.',
        type: 'error'
      });
    }
  };

  // Open asset history transactions side panel
  const handleViewHistory = async (asset: PublicAsset) => {
    try {
      const txs = await PublicAssetService.getTransactionsByAsset(asset.id);
      setHistoryAsset(asset);
      setAssetHistory(txs);
      setIsHistoryOpen(true);
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Lỗi',
        message: 'Không thể tải lịch sử biến động.',
        type: 'error'
      });
    }
  };

  // Calculate annual depreciation trigger
  const handleTriggerDepreciation = async () => {
    const currentYear = new Date().getFullYear();
    if (!confirm(`Bạn có chắc chắn muốn thực hiện tính hao mòn tài sản công tự động cho năm tài chính ${currentYear}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const count = await PublicAssetService.calculateAnnualDepreciation(currentYear);
      addToast({
        title: 'Tính hao mòn hoàn tất',
        message: `Đã hoàn thành tính hao mòn cho ${count} tài sản công đang hoạt động năm ${currentYear}.`,
        type: 'success'
      });
      const updated = await PublicAssetService.getAll();
      setAssets(updated);
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Thất bại',
        message: (err as Error).message || 'Lỗi tính hao mòn.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // DataTable columns configuration
  const columns = [
    {
      key: 'asset_code',
      header: 'Mã tài sản',
      sortable: true,
      width: '12%',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'asset_name',
      header: 'Tên tài sản',
      sortable: true,
      width: '25%',
      render: (val: string, row: PublicAsset) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-200">{val}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">{row.category?.name || 'Chưa phân loại'}</div>
        </div>
      )
    },
    {
      key: 'original_cost',
      header: 'Nguyên giá (VNĐ)',
      sortable: true,
      align: 'right' as const,
      width: '15%',
      render: (val: number) => <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(val)}</span>
    },
    {
      key: 'remaining_value',
      header: 'Giá trị còn lại',
      sortable: true,
      align: 'right' as const,
      width: '15%',
      render: (val: number, row: PublicAsset) => (
        <div>
          <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(val)}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Hao mòn: {formatCurrency(row.accumulated_depreciation)}</div>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Bộ phận quản lý',
      sortable: true,
      width: '15%',
      render: (val: string, row: PublicAsset) => (
        <div>
          <div className="font-medium text-slate-700 dark:text-slate-300">{val || '—'}</div>
          {row.custodian && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500">Bàn giao: {row.custodian.name}</div>
          )}
        </div>
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
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingAsset(row);
              setIsFormOpen(true);
            }}
            title="Chỉnh sửa"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAsset(row.id, row.asset_name)}
            title="Xóa tài sản"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col flex-1 h-full min-h-screen bg-slate-50/50 dark:bg-slate-900/20">
      
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
            
            {/* Filter controls */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm tài sản theo mã, tên, vị trí..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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

      {/* Transaction History Side Panel */}
      {isHistoryOpen && historyAsset && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => {
          if (e.target === e.currentTarget) setIsHistoryOpen(false);
        }}>
          <div className="bg-white dark:bg-slate-900 shadow-2xl w-full max-w-xl h-full overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Panel Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
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
                      <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px]">
                        <div>
                          <span className="text-slate-400 block">Biến động nguyên giá</span>
                          <span className={`font-bold ${tx.cost_change > 0 ? 'text-emerald-600' : tx.cost_change < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                            {tx.cost_change > 0 ? '+' : ''}{formatCurrency(tx.cost_change)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Biến động hao mòn</span>
                          <span className={`font-bold ${tx.depreciation_change > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {tx.depreciation_change > 0 ? '+' : ''}{formatCurrency(tx.depreciation_change)}
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
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
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
