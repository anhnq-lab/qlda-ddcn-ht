import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Check, Save, Calendar, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { PublicAssetService } from '../../services/PublicAssetService';
import { 
  PublicAssetInventory as InventoryType, 
  PublicAssetInventoryDetail as DetailType, 
  PublicAsset 
} from '../../types/public-asset.types';
import { formatCurrency } from '../../utils/format';

interface PublicAssetInventoryProps {
  assets: PublicAsset[];
}

export const PublicAssetInventory: React.FC<PublicAssetInventoryProps> = ({ assets }) => {
  const [inventories, setInventories] = useState<InventoryType[]>([]);
  const [activeInventory, setActiveInventory] = useState<InventoryType | null>(null);
  const [details, setDetails] = useState<DetailType[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New inventory fields
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');

  // Load inventories list
  const loadInventories = async () => {
    try {
      setIsLoading(true);
      const data = await PublicAssetService.getInventories();
      setInventories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventories();
  }, []);

  // View inventory details
  const handleViewInventory = async (inv: InventoryType) => {
    try {
      setIsLoading(true);
      setActiveInventory(inv);
      const detailsData = await PublicAssetService.getInventoryDetails(inv.id);
      setDetails(detailsData);
    } catch (err) {
      console.error(err);
      alert('Không thể tải chi tiết kiểm kê: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Start new inventory session
  const handleCreateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tên đợt kiểm kê.');
      return;
    }

    try {
      setIsCreating(true);
      const inv = await PublicAssetService.createInventory(newTitle, newDate, newNotes);
      await loadInventories();
      await handleViewInventory(inv);
      setIsCreating(false);
      setNewTitle('');
      setNewNotes('');
    } catch (err) {
      console.error(err);
      alert('Lỗi tạo đợt kiểm kê: ' + (err as Error).message);
      setIsCreating(false);
    }
  };

  // Update detail quantity/condition
  const handleDetailChange = (id: string, field: 'actual_quantity' | 'condition' | 'notes', value: any) => {
    setDetails(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, [field]: value };
        if (field === 'actual_quantity') {
          const qty = Number(value) || 0;
          updated.difference_quantity = qty - d.book_quantity;
        }
        return updated;
      }
      return d;
    }));
  };

  // Save changes to current session
  const handleSaveDetails = async () => {
    if (!activeInventory) return;
    try {
      setIsLoading(true);
      for (const d of details) {
        await PublicAssetService.updateInventoryDetail(d.id, {
          actual_quantity: d.actual_quantity,
          difference_quantity: d.difference_quantity,
          condition: d.condition,
          notes: d.notes
        });
      }
      alert('Đã lưu tất cả thay đổi tạm thời.');
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu chi tiết kiểm kê: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete inventory session & update asset quantities
  const handleCompleteInventory = async () => {
    if (!activeInventory) return;
    if (!confirm('Bạn có chắc chắn muốn hoàn thành đợt kiểm kê này? Hệ thống sẽ cập nhật số lượng tài sản thực tế và lưu vết biến động.')) {
      return;
    }

    try {
      setIsLoading(true);
      // Save changes first
      for (const d of details) {
        await PublicAssetService.updateInventoryDetail(d.id, {
          actual_quantity: d.actual_quantity,
          difference_quantity: d.difference_quantity,
          condition: d.condition,
          notes: d.notes
        });
      }
      // Trigger completion logic
      await PublicAssetService.completeInventory(activeInventory.id);
      
      // Reload inventory session
      const updated = { ...activeInventory, status: 'completed' as const };
      setActiveInventory(updated);
      await loadInventories();
      alert('Đã hoàn thành kiểm kê thành công và cập nhật số lượng tài sản công.');
    } catch (err) {
      console.error(err);
      alert('Lỗi hoàn thành kiểm kê: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left panel: List & Create form */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Create new inventory widget */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-primary-500" />
            Tạo đợt kiểm kê mới
          </h3>
          
          <form onSubmit={handleCreateInventory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                Tên đợt kiểm kê <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Kiểm kê cuối năm 2026..."
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                Ngày kiểm kê
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                Ghi chú/Mô tả
              </label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ghi chú đợt kiểm kê..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 text-sm"
            >
              <ClipboardList className="w-4 h-4" />
              {isCreating ? 'Đang tạo đợt kiểm kê...' : 'Khởi tạo đợt kiểm kê'}
            </button>
          </form>
        </div>

        {/* Previous Inventories List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary-500" />
            Lịch sử các đợt kiểm kê
          </h3>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {inventories.map((inv) => (
              <div 
                key={inv.id}
                onClick={() => handleViewInventory(inv)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between
                  ${activeInventory?.id === inv.id 
                    ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/20' 
                    : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}
                `}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{inv.title}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Ngày: {new Date(inv.inventory_date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                    ${inv.status === 'completed' 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' 
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'}
                  `}>
                    {inv.status === 'completed' ? 'Xong' : 'Nháp'}
                  </span>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}

            {inventories.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Chưa có đợt kiểm kê nào.</p>
            )}
          </div>
        </div>
      </div>

      {/* Right panel: Active Inventory Session Details */}
      <div className="lg:col-span-2">
        {activeInventory ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm flex flex-col h-full">
            
            {/* Header of session */}
            <div className="flex justify-between items-start border-b pb-4 mb-4 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{activeInventory.title}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold
                    ${activeInventory.status === 'completed' 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' 
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'}
                  `}>
                    {activeInventory.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện (Nháp)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Ngày lập: {new Date(activeInventory.inventory_date).toLocaleDateString('vi-VN')}
                  {activeInventory.notes && ` • Ghi chú: ${activeInventory.notes}`}
                </p>
              </div>

              {activeInventory.status === 'draft' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDetails}
                    disabled={isLoading}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Lưu nháp
                  </button>
                  <button
                    onClick={handleCompleteInventory}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Hoàn thành
                  </button>
                </div>
              )}
            </div>

            {/* Table detail list */}
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase border-b dark:border-slate-700">
                    <th className="p-3">Tài sản công</th>
                    <th className="p-3 text-center w-20">Sổ sách</th>
                    <th className="p-3 text-center w-24">Thực tế</th>
                    <th className="p-3 text-center w-20">Chênh lệch</th>
                    <th className="p-3 w-32">Tình trạng</th>
                    <th className="p-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {details.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800">
                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {d.asset?.asset_name || 'Tài sản đã xóa'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Mã: {d.asset?.asset_code} | Vị trí: {d.asset?.location || 'Chưa rõ'}
                        </div>
                      </td>
                      
                      <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-400">
                        {d.book_quantity}
                      </td>
                      
                      <td className="p-3 text-center">
                        {activeInventory.status === 'draft' ? (
                          <input
                            type="number"
                            min="0"
                            value={d.actual_quantity}
                            onChange={(e) => handleDetailChange(d.id, 'actual_quantity', Number(e.target.value))}
                            className="w-16 px-1.5 py-1 text-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none"
                          />
                        ) : (
                          <span className="font-bold">{d.actual_quantity}</span>
                        )}
                      </td>

                      <td className={`p-3 text-center font-bold
                        ${d.difference_quantity === 0 
                          ? 'text-slate-400' 
                          : d.difference_quantity > 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-red-500'}
                      `}>
                        {d.difference_quantity > 0 ? `+${d.difference_quantity}` : d.difference_quantity}
                      </td>

                      <td className="p-3">
                        {activeInventory.status === 'draft' ? (
                          <select
                            value={d.condition || 'good'}
                            onChange={(e) => handleDetailChange(d.id, 'condition', e.target.value)}
                            className="w-full px-1.5 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs"
                          >
                            <option value="good">Tốt / Bình thường</option>
                            <option value="damaged">Hỏng hóc</option>
                            <option value="need_repair">Cần sửa chữa</option>
                          </select>
                        ) : (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {d.condition === 'good' ? 'Tốt' : d.condition === 'damaged' ? 'Hỏng' : 'Cần sửa'}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        {activeInventory.status === 'draft' ? (
                          <input
                            type="text"
                            value={d.notes || ''}
                            onChange={(e) => handleDetailChange(d.id, 'notes', e.target.value)}
                            placeholder="Ghi chú nhanh..."
                            className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs"
                          />
                        ) : (
                          <span className="text-slate-500">{d.notes || '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {details.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Đợt kiểm kê không có tài sản nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend / Info warning if there are differences */}
            {activeInventory.status === 'draft' && details.some(d => d.difference_quantity !== 0) && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Phát hiện chênh lệch giữa thực tế và sổ sách. Khi click <strong>Hoàn thành</strong>, hệ thống sẽ tự động cập nhật số lượng trong danh mục tài sản và ghi nhận giao dịch tăng/giảm điều chỉnh.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
            <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa chọn đợt kiểm kê</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
              Chọn một đợt kiểm kê từ danh sách bên trái hoặc tạo đợt kiểm kê mới để thực hiện đối chiếu thực tế với sổ sách.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
