import React, { useState } from 'react';
import {
    FileText, Download, BarChart2, PieChart, RefreshCw, Database,
    CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, Package
} from 'lucide-react';
// generateExcelReport: lazy-loaded inside the export handler to keep exceljs out of the initial bundle
import { useProjects } from '../../hooks/useProjects';
import { usePayments } from '../../hooks/usePayments';
import { useTasks } from '../../hooks/useTasks';

type ReportType = 'monitoring' | 'disbursement' | 'issues' | 'all' | 'appendix1' | 'appendix2' | 'all_appendix';

const REPORTS: {
    type: ReportType | 'appendix';
    title: string;
    desc: string;
    period: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
}[] = [
    {
        type: 'monitoring',
        title: 'Báo cáo Giám sát Đầu tư',
        desc: 'Báo cáo tình hình thực hiện dự án theo biểu mẫu quy định của Bộ KH&ĐT (BC-01).',
        period: 'Định kỳ: Tháng / Quý',
        icon: BarChart2,
        iconBg: 'bg-slate-100 dark:bg-slate-700',
        iconColor: 'text-slate-700 dark:text-slate-300',
    },
    {
        type: 'disbursement',
        title: 'Báo cáo Tình hình Giải ngân',
        desc: 'So sánh vốn giải ngân thực tế so với kế hoạch vốn được giao.',
        period: 'Real-time',
        icon: PieChart,
        iconBg: 'bg-primary-50 dark:bg-primary-900/30',
        iconColor: 'text-primary-600 dark:text-primary-400',
    },
    {
        type: 'issues',
        title: 'Báo cáo Xử lý Vướng mắc',
        desc: 'Tổng hợp các vấn đề khó khăn, vướng mắc cần tháo gỡ trong quá trình thi công.',
        period: 'Theo sự vụ',
        icon: AlertTriangle,
        iconBg: 'bg-warning-50 dark:bg-warning-900/30',
        iconColor: 'text-warning-600 dark:text-warning-400',
    },
    {
        type: 'appendix',
        title: 'Báo cáo Phụ lục Tổng hợp',
        desc: 'Tổng hợp danh mục dự án của các phòng ban phân nhóm theo Tình trạng dự án hoặc Lĩnh vực chuyên ngành.',
        period: 'Định kỳ: Báo cáo năm / Quý',
        icon: FileSpreadsheet,
        iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        iconColor: 'text-emerald-700 dark:text-emerald-400',
    },
];

const ReportCenter: React.FC = () => {
    const { projects } = useProjects();
    const { payments } = usePayments();
    const { data: tasks = [] } = useTasks();
    const reportSource = { projects, payments, tasks };

    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'success'>('idle');
    const [exportingReport, setExportingReport] = useState<ReportType | null>(null);
    const [exportSuccess, setExportSuccess] = useState<ReportType | null>(null);

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => { setIsSyncing(false); setSyncStatus('success'); }, 2000);
    };

    const handleExportExcel = async (reportType: ReportType) => {
        setExportingReport(reportType);
        setExportSuccess(null);
        try {
            if (reportType === 'appendix1' || reportType === 'appendix2' || reportType === 'all_appendix') {
                const genType = reportType === 'all_appendix' ? 'all' : reportType;
                const { generateAppendixReport } = await import('../../utils/excelAppendixGenerator');
                await generateAppendixReport(genType, projects);
            } else {
                const { generateExcelReport } = await import('../../utils/excelReportGenerator');
                await generateExcelReport(reportType, reportSource);
            }
            setExportSuccess(reportType);
            setTimeout(() => setExportSuccess(null), 4000);
        } catch (error) {
            console.error('Excel export error:', error);
            alert('Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại.');
        } finally {
            setExportingReport(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                        Trung tâm Báo cáo &amp; Điều hành
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Tổng hợp báo cáo giám sát đầu tư và đồng bộ dữ liệu quốc gia
                    </p>
                </div>
                {/* Export All Button */}
                <button
                    onClick={() => handleExportExcel('all')}
                    disabled={exportingReport === 'all'}
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
                >
                    {exportingReport === 'all' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : exportSuccess === 'all' ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : (
                        <Package className="w-4 h-4" />
                    )}
                    {exportingReport === 'all' ? 'Đang tạo...' : exportSuccess === 'all' ? '✓ Đã xuất' : 'Xuất toàn bộ (.xlsx)'}
                </button>
            </div>

            {/* BC-03: Đồng bộ CSDL Quốc gia */}
            <div className="rounded-2xl shadow-sm p-4 overflow-hidden relative border bg-white dark:bg-slate-800 dark:border-slate-700 border-gray-200">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-blue-50/50 dark:bg-blue-900/10 skew-x-12 transform translate-x-10 pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center relative z-10 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-700 shrink-0">
                                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                Hệ thống Thông tin Quốc gia về Đầu tư công
                            </h3>
                        </div>
                        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-xl pl-16">
                            Tự động đồng bộ dữ liệu dự án, gói thầu về CSDL Quốc gia qua API theo chuẩn Nghị định 111/2025/NĐ-CP.
                        </p>
                        <div className="flex items-center gap-4 mt-5 pl-16">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Trạng thái kết nối</span>
                                <span className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    Đã kết nối (API v2.0)
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Lần đồng bộ cuối</span>
                                <span className="text-sm font-bold text-gray-700 dark:text-slate-300 px-3 py-1.5 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600">
                                    Hôm nay, 08:30 AM
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-start lg:items-end w-full lg:w-auto">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing || syncStatus === 'success'}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all w-full sm:w-auto ${syncStatus === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default shadow-sm'
                                : 'bg-primary-600 hover:bg-primary-500 dark:bg-blue-500 dark:hover:bg-primary-600 text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:-translate-y-0.5'
                            }`}
                        >
                            {isSyncing ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : syncStatus === 'success' ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <RefreshCw className="w-5 h-5" />
                            )}
                            {isSyncing ? 'Đang đồng bộ...' : syncStatus === 'success' ? 'Đồng bộ thành công' : 'Đồng bộ ngay'}
                        </button>
                        {syncStatus === 'success' && (
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-3 animate-in fade-in flex items-center justify-center gap-1.5 w-full">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã gửi 15 gói dữ liệu JSON.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Reports Grid */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mt-2 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Danh sách Báo cáo định kỳ
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        <FileSpreadsheet className="w-3 h-3" /> Excel
                    </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {REPORTS.map(({ type, title, desc, period, icon: Icon, iconBg, iconColor }) => {
                        const isExporting = exportingReport === type;
                        const isSuccess = exportSuccess === type;
                        return (
                            <div key={type} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow group flex flex-col">
                                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center ${iconColor} mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h4 className="text-base font-bold text-gray-800 dark:text-slate-200 mb-2">{title}</h4>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 flex-1">{desc}</p>

                                <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex flex-col gap-3">
                                    {type === 'appendix' ? (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-400 dark:text-slate-400 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded">
                                                    {period}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                <button
                                                    onClick={() => handleExportExcel('appendix1')}
                                                    disabled={exportingReport !== null}
                                                    className={`text-xs font-bold flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border transition-all ${
                                                        exportSuccess === 'appendix1'
                                                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                            : 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    } disabled:opacity-60`}
                                                >
                                                    {exportingReport === 'appendix1' ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : exportSuccess === 'appendix1' ? (
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <Download className="w-3.5 h-3.5" />
                                                    )}
                                                    {exportingReport === 'appendix1' ? 'Đang tạo...' : exportSuccess === 'appendix1' ? 'Đã tải' : 'Phụ lục 1'}
                                                </button>
                                                <button
                                                    onClick={() => handleExportExcel('appendix2')}
                                                    disabled={exportingReport !== null}
                                                    className={`text-xs font-bold flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border transition-all ${
                                                        exportSuccess === 'appendix2'
                                                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                            : 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    } disabled:opacity-60`}
                                                >
                                                    {exportingReport === 'appendix2' ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : exportSuccess === 'appendix2' ? (
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <Download className="w-3.5 h-3.5" />
                                                    )}
                                                    {exportingReport === 'appendix2' ? 'Đang tạo...' : exportSuccess === 'appendix2' ? 'Đã tải' : 'Phụ lục 2'}
                                                </button>
                                                <button
                                                    onClick={() => handleExportExcel('all_appendix')}
                                                    disabled={exportingReport !== null}
                                                    className={`col-span-2 text-xs font-bold flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl shadow-sm transition-all ${
                                                        exportSuccess === 'all_appendix'
                                                            ? 'text-emerald-600 border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                            : 'text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-emerald-500/10 hover:shadow-md'
                                                    } disabled:opacity-60`}
                                                >
                                                    {exportingReport === 'all_appendix' ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : exportSuccess === 'all_appendix' ? (
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                                    )}
                                                    {exportingReport === 'all_appendix' ? 'Đang tạo file gộp...' : exportSuccess === 'all_appendix' ? 'Đã tải file gộp' : 'Tải cả hai phụ lục (2 Sheet)'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between items-center w-full">
                                            <span className="text-xs font-medium text-gray-400 dark:text-slate-400 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded">
                                                {period}
                                            </span>
                                            <button
                                                onClick={() => handleExportExcel(type as ReportType)}
                                                disabled={isExporting}
                                                className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${isSuccess
                                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                                                    : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:shadow-sm'
                                                } disabled:opacity-60`}
                                            >
                                                {isExporting ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
                                                ) : isSuccess ? (
                                                    <><CheckCircle2 className="w-4 h-4" /> Đã tải</>
                                                ) : (
                                                    <><Download className="w-4 h-4" /> Xuất Excel</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ReportCenter;