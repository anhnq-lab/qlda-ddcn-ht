import React, { useState, useEffect } from 'react';
import { X, Landmark, FileText, Calendar, Shield, Cpu, HelpCircle } from 'lucide-react';
import { 
  PublicAsset, 
  PublicAssetCategory 
} from '../../types/public-asset.types';
import { Employee, Project } from '../../types';
import { formatCurrency } from '../../utils/format';

interface PublicAssetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editAsset?: PublicAsset | null;
  categories: PublicAssetCategory[];
  employees: Employee[];
  projects: Project[];
}

export const PublicAssetForm: React.FC<PublicAssetFormProps> = ({
  isOpen,
  onClose,
  onSave,
  editAsset,
  categories,
  employees,
  projects,
}) => {
  const isEditMode = !!editAsset;
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Bộ');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [custodianId, setCustodianId] = useState('');
  const [projectId, setProjectId] = useState('');
  
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [useDate, setUseDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Cost breakdown
  const [fundingBudgetCost, setFundingBudgetCost] = useState<number>(0);
  const [fundingOtherCost, setFundingOtherCost] = useState<number>(0);
  const [originalCost, setOriginalCost] = useState<number>(0);
  
  const [depreciationRate, setDepreciationRate] = useState<number>(0);
  const [accumulatedDepreciation, setAccumulatedDepreciation] = useState<number>(0);
  const [status, setStatus] = useState<string>('active');

  // Load default or edit data
  useEffect(() => {
    if (isOpen) {
      if (editAsset) {
        setAssetCode(editAsset.asset_code || '');
        setAssetName(editAsset.asset_name || '');
        setCategoryId(editAsset.category_id || '');
        setDescription(editAsset.description || '');
        setUnit(editAsset.unit || 'Bộ');
        setQuantity(editAsset.quantity || 1);
        setLocation(editAsset.location || '');
        setBranch((editAsset as any).branch || '');
        setDepartment(editAsset.department || '');
        setCustodianId(editAsset.custodian_id || '');
        setProjectId(editAsset.project_id || '');
        setPurchaseDate(editAsset.purchase_date || '');
        setUseDate(editAsset.use_date || '');
        setFundingBudgetCost(editAsset.funding_budget_cost || 0);
        setFundingOtherCost(editAsset.funding_other_cost || 0);
        setOriginalCost(editAsset.original_cost || 0);
        setDepreciationRate(editAsset.depreciation_rate || 0);
        setAccumulatedDepreciation(editAsset.accumulated_depreciation || 0);
        setStatus(editAsset.status || 'active');
      } else {
        // Defaults for create mode
        setAssetCode('');
        setAssetName('');
        setCategoryId(categories[0]?.id || '');
        setDescription('');
        setUnit('Bộ');
        setQuantity(1);
        setLocation('');
        setBranch('');
        setDepartment('');
        setCustodianId('');
        setProjectId('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setUseDate(new Date().toISOString().split('T')[0]);
        setFundingBudgetCost(0);
        setFundingOtherCost(0);
        setOriginalCost(0);
        setDepreciationRate(categories[0]?.depreciation_rate || 0);
        setAccumulatedDepreciation(0);
        setStatus('active');
      }
    }
  }, [isOpen, editAsset, categories]);

  // Handle category change: update depreciation rate
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat) {
      setDepreciationRate(cat.depreciation_rate || 0);
    }
  };

  // Recalculate original cost when funding costs change
  useEffect(() => {
    setOriginalCost(fundingBudgetCost + fundingOtherCost);
  }, [fundingBudgetCost, fundingOtherCost]);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCode.trim() || !assetName.trim() || !categoryId) {
      alert('Vui lòng điền đầy đủ Mã, Tên và Loại tài sản.');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        asset_code: assetCode,
        asset_name: assetName,
        category_id: categoryId,
        description: description || null,
        unit,
        quantity,
        location: location || null,
        branch: branch || null,
        department: department || null,
        custodian_id: custodianId || null,
        project_id: projectId || null,
        purchase_date: purchaseDate,
        use_date: useDate,
        original_cost: originalCost,
        funding_budget_cost: fundingBudgetCost,
        funding_other_cost: fundingOtherCost,
        depreciation_rate: depreciationRate,
        accumulated_depreciation: accumulatedDepreciation,
        status,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu tài sản: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-bg-surface shadow-2xl w-full max-w-3xl h-full overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg-subtle">
          <div>
            <h2 className="text-lg font-bold text-txt-primary flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary-500" />
              {isEditMode ? 'Chỉnh sửa tài sản công' : 'Thêm mới tài sản công'}
            </h2>
            <p className="text-xs text-txt-muted mt-1">
              Quản lý tài sản công theo Thông tư 23/2023/TT-BTC
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-txt-placeholder transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: General Information */}
          <div>
            <h3 className="text-sm font-semibold text-txt-primary mb-3 flex items-center gap-2 border-b pb-1 dark:border-slate-800">
              <FileText className="w-4 h-4 text-primary-500" />
              Thông tin chung
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Mã tài sản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                  placeholder="Ví dụ: TSC-001, OTO-02"
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Tên tài sản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="Tên tài sản công..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Phân loại tài sản <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="" disabled>-- Chọn phân loại tài sản --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      [{cat.code}] - {cat.name} ({cat.asset_type === 'tangible' ? 'Hữu hình' : 'Vô hình'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                Mô tả chi tiết / Thông số kỹ thuật
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập thông số kỹ thuật, xuất xứ, nhãn hiệu..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Section 2: Management & Status */}
          <div>
            <h3 className="text-sm font-semibold text-txt-primary mb-3 flex items-center gap-2 border-b pb-1 dark:border-slate-800">
              <Shield className="w-4 h-4 text-primary-500" />
              Bộ phận quản lý & Bàn giao
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Chi nhánh / Văn phòng
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {['Trụ sở chính', 'Can Lộc', 'Thạch Hà', 'Hương Khê', 'Cẩm xuyên', 'Đức Thọ', 'Vũ Quang'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Phòng ban nội bộ
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {[
                    'Ban Giám đốc',
                    'Phòng Hành chính - Tổng hợp',
                    'Phòng Kỹ thuật - Thẩm định',
                    'Phòng Tài chính - Kế toán',
                    'Phòng Quản lý Dự án 1',
                    'Phòng Quản lý Dự án 2',
                    'Phòng Quản lý Dự án 3',
                  ].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Người chịu trách nhiệm / Custodian
                </label>
                <select
                  value={custodianId}
                  onChange={(e) => setCustodianId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">-- Không có / Chưa bàn giao --</option>
                  {employees.map((emp) => (
                    <option key={emp.EmployeeID} value={emp.EmployeeID}>
                      {emp.FullName} - {emp.Position || 'Nhân viên'} ({emp.Department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Dự án liên quan (Nếu mua cho dự án)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">-- Không thuộc dự án cụ thể --</option>
                  {projects.map((proj) => (
                    <option key={proj.ProjectID} value={proj.ProjectID}>
                      [{proj.ProjectID}] - {proj.ProjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Vị trí lắp đặt/Bảo quản
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ví dụ: Phòng họp tầng 2, Nhà kho..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Time & Depreciation */}
          <div>
            <h3 className="text-sm font-semibold text-txt-primary mb-3 flex items-center gap-2 border-b pb-1 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-primary-500" />
              Thời gian sử dụng & Khấu hao/Hao mòn
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Ngày mua/nhận bàn giao
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Ngày bắt đầu sử dụng/Ghi tăng
                </label>
                <input
                  type="date"
                  value={useDate}
                  onChange={(e) => setUseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Tỷ lệ hao mòn (% / năm)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={depreciationRate}
                    onChange={(e) => setDepreciationRate(Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  {depreciationRate > 0 && (
                    <div className="px-3 py-2 text-sm border border-border-subtle rounded-xl bg-bg-subtle text-txt-muted whitespace-nowrap font-semibold">
                      {Math.round(100 / depreciationRate)} năm
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Hao mòn lũy kế đầu kỳ (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={accumulatedDepreciation}
                  onChange={(e) => setAccumulatedDepreciation(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Cost Structure */}
          <div>
            <h3 className="text-sm font-semibold text-txt-primary mb-3 flex items-center gap-2 border-b pb-1 dark:border-slate-800">
              <Cpu className="w-4 h-4 text-primary-500" />
              Nguyên giá tài sản (Cơ cấu nguồn vốn)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Nguồn Ngân sách (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={fundingBudgetCost}
                  onChange={(e) => setFundingBudgetCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Nguồn khác (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={fundingOtherCost}
                  onChange={(e) => setFundingOtherCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                  Tổng Nguyên giá (Tự tính)
                </label>
                <div className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-subtle text-txt-secondary font-bold">
                  {formatCurrency(originalCost)}
                </div>
              </div>
            </div>
          </div>

          {/* Status field */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                Trạng thái tài sản
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="active">Đang hoạt động / Sử dụng</option>
                <option value="pending_liquidation">Đang chờ thanh lý</option>
                <option value="liquidated">Đã thanh lý</option>
                <option value="transferred">Đã bàn giao/điều chuyển</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-bg-subtle flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-xl text-txt-secondary font-medium hover:bg-bg-muted transition-colors"
          >
            Hủy
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              isEditMode ? 'Lưu thay đổi' : 'Ghi tăng tài sản'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
