import React, { useMemo } from 'react';
import { Download, Printer, FileText, ArrowRight, ShieldCheck, Landmark, DollarSign, Activity } from 'lucide-react';
import { PublicAsset } from '../../types/public-asset.types';
import { formatCurrency } from '../../utils/format';
import * as XLSX from 'xlsx';

interface PublicAssetReportsProps {
  assets: PublicAsset[];
}

export const PublicAssetReports: React.FC<PublicAssetReportsProps> = ({ assets }) => {
  
  // Calculate aggregate metrics
  const stats = useMemo(() => {
    const totalCount = assets.length;
    const totalOriginalCost = assets.reduce((sum, a) => sum + (a.original_cost || 0), 0);
    const totalDepreciation = assets.reduce((sum, a) => sum + (a.accumulated_depreciation || 0), 0);
    const totalRemainingValue = assets.reduce((sum, a) => sum + (a.remaining_value || 0), 0);
    
    return {
      totalCount,
      totalOriginalCost,
      totalDepreciation,
      totalRemainingValue
    };
  }, [assets]);

  // Export to Excel according to circular template (Phụ lục số 02 - Sổ tài sản công)
  const handleExportExcel = () => {
    if (assets.length === 0) {
      alert('Không có dữ liệu để xuất file.');
      return;
    }

    // 1. Prepare data rows
    const excelRows = assets.map((a, index) => ({
      'STT': index + 1,
      'Mã tài sản': a.asset_code,
      'Tên tài sản': a.asset_name,
      'Loại tài sản': a.category?.name || 'Khác',
      'Đơn vị tính': a.unit || 'Bộ',
      'Số lượng': a.quantity || 1,
      'Ngày sử dụng': a.use_date ? new Date(a.use_date).toLocaleDateString('vi-VN') : '',
      'Nguyên giá (VNĐ)': a.original_cost || 0,
      'Nguồn NSNN (VNĐ)': a.funding_budget_cost || 0,
      'Nguồn Khác (VNĐ)': a.funding_other_cost || 0,
      'Hao mòn lũy kế (VNĐ)': a.accumulated_depreciation || 0,
      'Giá trị còn lại (VNĐ)': a.remaining_value || 0,
      'Bộ phận quản lý': a.department || '',
      'Trạng thái': a.status === 'active' ? 'Đang hoạt động' : 
                   a.status === 'liquidated' ? 'Đã thanh lý' : 
                   a.status === 'transferred' ? 'Đã điều chuyển' : 'Chờ thanh lý'
    }));

    // 2. Create Sheet
    const worksheet = XLSX.utils.json_to_sheet([]);
    
    // Add title block matching Circular 23/2023/TT-BTC
    XLSX.utils.sheet_add_aoa(worksheet, [
      ['ỦY BAN NHÂN DÂN TỈNH HÀ TĨNH'],
      ['BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG CÔNG TRÌNH DÂN DỤNG VÀ HTKT'],
      [''],
      ['SỔ THEO DÕI TÀI SẢN CÔNG'],
      [`Năm báo cáo: ${new Date().getFullYear()}`],
      ['(Ban hành kèm theo Thông tư số 23/2023/TT-BTC ngày 25/04/2023 của Bộ Tài chính)'],
      ['']
    ], { origin: 'A1' });

    // Append table headers and data
    XLSX.utils.sheet_add_json(worksheet, excelRows, { origin: 'A8', skipHeader: false });

    // 3. Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sổ Tài sản Công');

    // 4. Download file
    XLSX.writeFile(workbook, `So_Tai_San_Cong_Circular23_${new Date().getFullYear()}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tổng số tài sản</span>
            <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.totalCount}</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500" />
              Hoạt động ổn định
            </p>
          </div>
          <div className="w-12 h-12 bg-primary-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-primary-500">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tổng nguyên giá</span>
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1.5">{formatCurrency(stats.totalOriginalCost)}</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">Ngân sách & nguồn hợp pháp khác</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-emerald-500">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hao mòn lũy kế</span>
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1.5">{formatCurrency(stats.totalDepreciation)}</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">Khấu hao lũy kế qua các năm</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-amber-500">
            <Printer className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Giá trị còn lại</span>
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1.5">{formatCurrency(stats.totalRemainingValue)}</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">Giá trị thuần hiện tại</p>
          </div>
          <div className="w-12 h-12 bg-violet-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-violet-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Reports Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              Sổ theo dõi tài sản công (Phụ lục số 02)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Báo cáo đúng chuẩn quy định của Bộ Tài chính tại Thông tư số 23/2023/TT-BTC
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 text-sm"
            >
              <Printer className="w-4 h-4" />
              In ấn báo cáo
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 text-sm"
            >
              <Download className="w-4 h-4" />
              Xuất Excel Phụ lục 2
            </button>
          </div>
        </div>

        {/* Print Layout Preview Table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-700/60 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase border-b dark:border-slate-700">
                <th className="p-3 border-r dark:border-slate-700 text-center w-10">STT</th>
                <th className="p-3 border-r dark:border-slate-700">Mã TSC</th>
                <th className="p-3 border-r dark:border-slate-700">Tên tài sản</th>
                <th className="p-3 border-r dark:border-slate-700 text-center">ĐVT</th>
                <th className="p-3 border-r dark:border-slate-700 text-center">SL</th>
                <th className="p-3 border-r dark:border-slate-700 text-right">Nguyên giá</th>
                <th className="p-3 border-r dark:border-slate-700 text-right">Hao mòn lũy kế</th>
                <th className="p-3 border-r dark:border-slate-700 text-right">Giá trị còn lại</th>
                <th className="p-3">Bộ phận sử dụng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {assets.map((a, i) => (
                <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 border-r dark:border-slate-700 text-center">{i + 1}</td>
                  <td className="p-3 border-r dark:border-slate-700 font-mono font-medium">{a.asset_code}</td>
                  <td className="p-3 border-r dark:border-slate-700 font-medium">{a.asset_name}</td>
                  <td className="p-3 border-r dark:border-slate-700 text-center">{a.unit}</td>
                  <td className="p-3 border-r dark:border-slate-700 text-center">{a.quantity}</td>
                  <td className="p-3 border-r dark:border-slate-700 text-right font-medium">{formatCurrency(a.original_cost)}</td>
                  <td className="p-3 border-r dark:border-slate-700 text-right text-slate-500">{formatCurrency(a.accumulated_depreciation)}</td>
                  <td className="p-3 border-r dark:border-slate-700 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(a.remaining_value)}</td>
                  <td className="p-3">{a.department || '—'}</td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Không tìm thấy tài sản công nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
