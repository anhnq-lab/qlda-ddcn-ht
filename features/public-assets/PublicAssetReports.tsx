import React, { useMemo } from 'react';
import { Download, Printer, FileText, ShieldCheck, Landmark, DollarSign, Activity } from 'lucide-react';
import { PublicAsset } from '../../types/public-asset.types';
import { formatCurrency } from '../../utils/format';
import * as XLSX from 'xlsx';

interface PublicAssetReportsProps {
  assets: PublicAsset[];
}

// Asset group order matching BK02 in Circular 23/2023/TT-BTC
const ASSET_GROUP_ORDER = ['LAND', 'BUILDING_HQ', 'BUILDING_OTHER', 'STRUCTURE', 'CAR_OFFICIAL', 'CAR_SPECIAL', 'VEHICLE_OTHER', 'PC_DESKTOP', 'PC_LAPTOP', 'PRINTER_PHOTO', 'AIR_CON', 'OFFICE_EQUIP', 'SPECIAL_EQUIP', 'INTANGIBLE_SOFTWARE', 'INTANGIBLE_LAND_RIGHT', 'TANGIBLE_OTHER'];

const ASSET_SECTION_LABELS: Record<string, string> = {
  LAND: 'I. ĐẤT',
  BUILDING_HQ: 'II. NHÀ CỬA VẬT KIẾN TRÚC',
  BUILDING_OTHER: 'II. NHÀ CỬA VẬT KIẾN TRÚC',
  STRUCTURE: 'II. NHÀ CỬA VẬT KIẾN TRÚC',
  CAR_OFFICIAL: 'III. XE Ô TÔ',
  CAR_SPECIAL: 'III. XE Ô TÔ',
  VEHICLE_OTHER: 'III. XE Ô TÔ',
  PC_DESKTOP: 'IV. MÁY MÓC THIẾT BỊ',
  PC_LAPTOP: 'IV. MÁY MÓC THIẾT BỊ',
  PRINTER_PHOTO: 'IV. MÁY MÓC THIẾT BỊ',
  AIR_CON: 'IV. MÁY MÓC THIẾT BỊ',
  OFFICE_EQUIP: 'IV. MÁY MÓC THIẾT BỊ',
  SPECIAL_EQUIP: 'IV. MÁY MÓC THIẾT BỊ',
  INTANGIBLE_SOFTWARE: 'V. TÀI SẢN VÔ HÌNH',
  INTANGIBLE_LAND_RIGHT: 'V. TÀI SẢN VÔ HÌNH',
  TANGIBLE_OTHER: 'VI. TSCĐ KHÁC',
};

export const PublicAssetReports: React.FC<PublicAssetReportsProps> = ({ assets }) => {

  // Calculate aggregate metrics
  const stats = useMemo(() => {
    const totalCount = assets.length;
    const totalOriginalCost = assets.reduce((sum, a) => sum + (a.original_cost || 0), 0);
    const totalDepreciation = assets.reduce((sum, a) => sum + (a.accumulated_depreciation || 0), 0);
    const totalRemainingValue = assets.reduce((sum, a) => sum + (a.remaining_value || 0), 0);
    return { totalCount, totalOriginalCost, totalDepreciation, totalRemainingValue };
  }, [assets]);

  // Group assets by section label (I. ĐẤT, II. NHÀ CỬA...) for BK02 display
  const groupedAssets = useMemo(() => {
    const sections: { label: string; items: PublicAsset[] }[] = [];
    const seenLabels = new Set<string>();
    const labelToItems: Record<string, PublicAsset[]> = {};

    for (const a of assets) {
      const code = a.category?.code || 'TANGIBLE_OTHER';
      const label = ASSET_SECTION_LABELS[code] || 'VI. TSCĐ KHÁC';
      if (!labelToItems[label]) labelToItems[label] = [];
      labelToItems[label].push(a);
    }

    // Maintain section order
    const labelOrder = [...new Set(ASSET_GROUP_ORDER.map(c => ASSET_SECTION_LABELS[c] || 'VI. TSCĐ KHÁC'))];
    for (const label of labelOrder) {
      if (labelToItems[label] && !seenLabels.has(label)) {
        seenLabels.add(label);
        sections.push({ label, items: labelToItems[label] });
      }
    }
    // Any remaining
    for (const [label, items] of Object.entries(labelToItems)) {
      if (!seenLabels.has(label)) sections.push({ label, items });
    }
    return sections;
  }, [assets]);

  // Export BK02 to Excel — grouped by section, with subtotals, matching Circular 23/2023/TT-BTC
  const handleExportExcel = () => {
    if (assets.length === 0) { alert('Không có dữ liệu để xuất file.'); return; }

    const year = new Date().getFullYear();
    const rows: any[][] = [
      ['ỦY BAN NHÂN DÂN TỈNH HÀ TĨNH', '', '', '', '', '', '', '', ''],
      ['BAN QLDA ĐTXD CÔNG TRÌNH DÂN DỤNG VÀ HẠ TẦNG KHU VỰC', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['BK02. BẢNG KÊ CHI TIẾT TÀI SẢN CỐ ĐỊNH', '', '', '', '', '', '', '', ''],
      [`NĂM ${year}`, '', '', '', '', '', '', '', ''],
      ['(Kèm theo Thông tư số 23/2023/TT-BTC ngày 25/04/2023 của Bộ Tài chính)', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['STT', 'Mã TSCĐ', 'Tên tài sản', 'ĐVT', 'Số lượng', 'Nguyên giá (đ)', 'Hao mòn LK (đ)', 'Còn lại (đ)', 'Bộ phận quản lý'],
    ];

    let globalStt = 0;
    for (const { label, items } of groupedAssets) {
      const subOriginal = items.reduce((s, a) => s + (a.original_cost || 0), 0);
      const subDep = items.reduce((s, a) => s + (a.accumulated_depreciation || 0), 0);
      const subRemaining = items.reduce((s, a) => s + (a.remaining_value || 0), 0);

      // Section header
      rows.push([label, '', '', '', '', subOriginal, subDep, subRemaining, '']);

      for (const a of items) {
        globalStt++;
        rows.push([
          globalStt,
          a.asset_code,
          a.asset_name,
          a.unit || 'Cái',
          a.quantity || 1,
          a.original_cost || 0,
          a.accumulated_depreciation || 0,
          a.remaining_value || 0,
          a.department || ''
        ]);
      }
    }

    // Grand total
    rows.push(['TỔNG CỘNG', '', '', '', '', stats.totalOriginalCost, stats.totalDepreciation, stats.totalRemainingValue, '']);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Column widths
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 16 }, { wch: 40 }, { wch: 8 }, { wch: 6 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 25 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BK02-TSCĐ');
    XLSX.writeFile(workbook, `BK02_TSCĐ_${year}.xlsx`);
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
              Xuất BK02 (.xlsx)
            </button>
          </div>
        </div>

        {/* BK02 Preview Table — grouped by asset section */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-700/60 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase border-b dark:border-slate-700">
                <th className="p-3 border-r dark:border-slate-700 text-center w-10">STT</th>
                <th className="p-3 border-r dark:border-slate-700">Mã TSCĐ</th>
                <th className="p-3 border-r dark:border-slate-700">Tên tài sản</th>
                <th className="p-3 border-r dark:border-slate-700 text-center w-14">ĐVT</th>
                <th className="p-3 border-r dark:border-slate-700 text-center w-10">SL</th>
                <th className="p-3 border-r dark:border-slate-700 text-right">Nguyên giá (đ)</th>
                <th className="p-3 border-r dark:border-slate-700 text-right">Hao mòn LK (đ)</th>
                <th className="p-3 border-r dark:border-slate-700 text-right">Còn lại (đ)</th>
                <th className="p-3">Bộ phận</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              {groupedAssets.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-slate-400">Không có dữ liệu tài sản công.</td></tr>
              )}
              {groupedAssets.map(({ label, items }) => {
                const subOriginal = items.reduce((s, a) => s + (a.original_cost || 0), 0);
                const subDep = items.reduce((s, a) => s + (a.accumulated_depreciation || 0), 0);
                const subRemaining = items.reduce((s, a) => s + (a.remaining_value || 0), 0);
                let stt = 0;
                return (
                  <React.Fragment key={label}>
                    {/* Section header row */}
                    <tr className="bg-slate-100/80 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-700">
                      <td colSpan={5} className="p-2.5 pl-3 font-bold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wide">{label}</td>
                      <td className="p-2.5 text-right font-bold text-slate-700 dark:text-slate-200 border-l dark:border-slate-700">{formatCurrency(subOriginal)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-500 border-l dark:border-slate-700">{formatCurrency(subDep)}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 border-l dark:border-slate-700">{formatCurrency(subRemaining)}</td>
                      <td className="p-2.5 border-l dark:border-slate-700"></td>
                    </tr>
                    {/* Items */}
                    {items.map((a) => {
                      stt++;
                      return (
                        <tr key={a.id} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800">
                          <td className="p-2.5 border-r dark:border-slate-700 text-center text-slate-500">{stt}</td>
                          <td className="p-2.5 border-r dark:border-slate-700 font-mono font-medium text-primary-600 dark:text-primary-400">{a.asset_code}</td>
                          <td className="p-2.5 border-r dark:border-slate-700 font-medium">{a.asset_name}</td>
                          <td className="p-2.5 border-r dark:border-slate-700 text-center text-slate-500">{a.unit}</td>
                          <td className="p-2.5 border-r dark:border-slate-700 text-center">{a.quantity}</td>
                          <td className="p-2.5 border-r dark:border-slate-700 text-right">{formatCurrency(a.original_cost)}</td>
                          <td className="p-2.5 border-r dark:border-slate-700 text-right text-slate-500">{formatCurrency(a.accumulated_depreciation)}</td>
                          <td className="p-2.5 border-r dark:border-slate-700 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(a.remaining_value)}</td>
                          <td className="p-2.5">{a.department || '—'}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {/* Grand total row */}
              {assets.length > 0 && (
                <tr className="bg-primary-50 dark:bg-primary-950/20 border-t-2 border-primary-200 dark:border-primary-800">
                  <td colSpan={5} className="p-3 font-bold text-slate-700 dark:text-slate-200 text-xs uppercase">TỔNG CỘNG</td>
                  <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-100 border-l dark:border-slate-700">{formatCurrency(stats.totalOriginalCost)}</td>
                  <td className="p-3 text-right font-bold text-slate-600 dark:text-slate-400 border-l dark:border-slate-700">{formatCurrency(stats.totalDepreciation)}</td>
                  <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 border-l dark:border-slate-700">{formatCurrency(stats.totalRemainingValue)}</td>
                  <td className="border-l dark:border-slate-700"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
