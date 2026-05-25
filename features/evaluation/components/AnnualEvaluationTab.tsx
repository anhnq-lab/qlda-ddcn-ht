import React, { useState, useMemo, useEffect } from 'react';
import { 
    Calendar, Users, Search, Download, Eye, TrendingUp, 
    AlertCircle, Award, ClipboardCheck, Sparkles, Building2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import { useToast } from '../../../components/ui/Toast';
import { EvaluationService } from '../services/evaluationService';
import { getFormTotal, getClassification } from '../types/evaluation.types';
import type { EmployeeDisbursementPerformance, EvaluationForm } from '../types/evaluation.types';
import DisbursementDetailPanel from './DisbursementDetailPanel';
import { utils, writeFile } from 'xlsx';

export const AnnualEvaluationTab: React.FC = () => {
    const { currentUser } = useAuth();
    const { openPanel, closePanel, setPanelWidth } = useSlidePanel();
    const { showToast } = useToast();

    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [deptFilter, setDeptFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const [disbData, setDisbData] = useState<EmployeeDisbursementPerformance[]>([]);
    const [monthlyForms, setMonthlyForms] = useState<EvaluationForm[]>([]);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [disbRes, formsRes] = await Promise.all([
                    EvaluationService.getAllEmployeesDisbursementPerformance(year),
                    EvaluationService.list({ eval_year: year })
                ]);

                if (disbRes.error) {
                    showToast(`Lỗi tải dữ liệu giải ngân: ${disbRes.error}`, 'error');
                } else {
                    setDisbData(disbRes.data);
                }

                if (formsRes.error) {
                    showToast(`Lỗi tải phiếu đánh giá: ${formsRes.error}`, 'error');
                } else {
                    setMonthlyForms(formsRes.data);
                }
            } catch (err: any) {
                showToast(`Lỗi kết nối hệ thống: ${err.message}`, 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year, showToast]);

    // Lấy danh sách các phòng ban từ dữ liệu để lọc
    const departments = useMemo(() => {
        const depts = new Set(disbData.map(d => d.department).filter(Boolean));
        return Array.from(depts);
    }, [disbData]);

    // Quy đổi tỷ lệ giải ngân sang điểm giải ngân (thang điểm 100)
    const getDisbScore = (rate: number): number => {
        if (rate >= 95) return 100;
        if (rate >= 90) return 90;
        if (rate >= 80) return 80;
        if (rate >= 70) return 70;
        if (rate >= 60) return 60;
        return 50;
    };

    // Tính toán điểm tổng hợp cuối năm cho từng nhân sự
    const processedEvaluations = useMemo(() => {
        // Group phiếu đánh giá theo nhân viên
        const formsByEmployee: Record<string, EvaluationForm[]> = {};
        monthlyForms.forEach(f => {
            if (!formsByEmployee[f.employee_id]) {
                formsByEmployee[f.employee_id] = [];
            }
            formsByEmployee[f.employee_id].push(f);
        });

        return disbData.map(emp => {
            const empForms = formsByEmployee[emp.employee_id] || [];
            
            // Chỉ tính điểm các phiếu đã được Duyệt (approved), nếu không có thì lấy self_score làm fallback tham khảo
            const approvedForms = empForms.filter(f => f.status === 'approved');
            const targetForms = approvedForms.length > 0 ? approvedForms : empForms;

            let monthlyAvg = 0;
            if (targetForms.length > 0) {
                const totalScore = targetForms.reduce((sum, f) => {
                    const score = getFormTotal(f, approvedForms.length > 0 ? 'manager' : 'self');
                    return sum + (score === -1 ? 0 : score);
                }, 0);
                monthlyAvg = totalScore / targetForms.length;
            }

            const hasProjects = emp.total_projects > 0;
            const disbScore = getDisbScore(Number(emp.adjusted_disbursement_rate));
            
            // Công thức tính điểm cuối năm:
            // Có dự án: 60% trung bình tháng + 40% điểm giải ngân
            // Không có dự án: 100% trung bình tháng
            const finalScore = hasProjects 
                ? (0.6 * monthlyAvg + 0.4 * disbScore)
                : monthlyAvg;

            const classification = getClassification(finalScore);

            return {
                ...emp,
                monthlyAvg,
                disbScore,
                finalScore,
                classification,
                hasProjects,
                formsCount: targetForms.length
            };
        });
    }, [disbData, monthlyForms]);

    // Lọc dữ liệu theo phòng ban và từ khóa tìm kiếm
    const filteredEvaluations = useMemo(() => {
        return processedEvaluations.filter(emp => {
            const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
            const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (emp.position || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesDept && matchesSearch;
        });
    }, [processedEvaluations, deptFilter, searchTerm]);

    // Handler xem chi tiết dự án
    const handleViewDetails = (empId: string, name: string, position: string, department: string) => {
        // Kiểm tra xem nhân viên này có phải quản lý không để truyền tham số isManager
        const emp = processedEvaluations.find(e => e.employee_id === empId);
        const isManager = emp ? (emp.position.includes('Trưởng phòng') || emp.role === 'Manager' || emp.role === 'Director' || emp.role === 'DeputyDirector') : false;

        setPanelWidth(window.innerWidth * 0.55); // Rộng 55% màn hình
        openPanel({
            title: `Chi tiết giải ngân dự án năm ${year}`,
            component: <DisbursementDetailPanel 
                employeeId={empId}
                employeeName={name}
                position={position}
                department={department}
                year={year}
                isManager={isManager}
                onClose={() => closePanel()}
            />
        });
    };

    // Xuất Excel
    const handleExportExcel = () => {
        if (filteredEvaluations.length === 0) {
            showToast('Không có dữ liệu để xuất Excel', 'warning');
            return;
        }

        const excelData = filteredEvaluations.map((row, index) => ({
            'STT': index + 1,
            'Mã NV': row.employee_id,
            'Họ và Tên': row.full_name,
            'Phòng Ban': row.department,
            'Chức Vụ': row.position,
            'Số Dự Án Phụ Trách': row.total_projects || 0,
            'Điểm TB 12 Tháng (60%)': Number(row.monthlyAvg.toFixed(1)),
            'Tỷ Lệ Giải Ngân Thực Tế (%)': row.hasProjects ? Number(row.raw_disbursement_rate) : 'N/A',
            'Tỷ Lệ Giải Ngân Hiệu Chỉnh (%)': row.hasProjects ? Number(row.adjusted_disbursement_rate) : 'N/A',
            'Điểm Giải Ngân Quy Đổi (40%)': row.hasProjects ? row.disbScore : 'N/A',
            'Điểm Tổng Hợp Cuối Năm': Number(row.finalScore.toFixed(1)),
            'Xếp Loại Đề Xuất': row.classification
        }));

        const worksheet = utils.json_to_sheet(excelData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, `Đánh giá cuối năm ${year}`);

        // Tự động căn chỉnh độ rộng cột
        const maxLen = excelData.reduce((acc, row) => {
            Object.keys(row).forEach((key, i) => {
                const val = String(row[key as keyof typeof row] || '');
                acc[i] = Math.max(acc[i] || 0, val.length + 4);
            });
            return acc;
        }, [] as number[]);
        worksheet['!cols'] = maxLen.map(w => ({ wch: w }));

        writeFile(workbook, `BaoCao_DanhGia_NhanSu_GiaiNgan_${year}.xlsx`);
        showToast('Xuất báo cáo Excel thành công!', 'success');
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-bg-app rounded-3xl border border-border shadow-sm">
            {/* Header / Summary stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-bg-surface p-6 rounded-2xl border border-border">
                <div>
                    <h2 className="text-xl font-bold text-txt-primary flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        Bảng Đánh Giá Xếp Loại Nhân Sự Cuối Năm {year}
                    </h2>
                    <p className="text-xs text-txt-secondary mt-1">
                        Kết hợp điểm đánh giá trung bình 12 tháng (trọng số 60%) và điểm hiệu suất giải ngân dự án (trọng số 40% - áp dụng cho PM/Chuyên viên).
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Chọn Năm */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-bg-subtle border border-border rounded-xl">
                        <Calendar size={14} className="text-txt-muted" />
                        <select 
                            value={year} 
                            onChange={e => setYear(+e.target.value)}
                            className="bg-transparent text-sm font-bold text-txt-primary focus:outline-none"
                        >
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>Năm {y}</option>)}
                        </select>
                    </div>

                    {/* Lọc phòng ban */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-bg-subtle border border-border rounded-xl">
                        <Building2 size={14} className="text-txt-muted" />
                        <select 
                            value={deptFilter} 
                            onChange={e => setDeptFilter(e.target.value)}
                            className="bg-transparent text-sm text-txt-primary focus:outline-none max-w-[200px] truncate"
                        >
                            <option value="all">Tất cả đơn vị</option>
                            {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20 transition-all"
                    >
                        <Download size={15} /> Xuất Excel
                    </button>
                </div>
            </div>

            {/* Quick stats widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-bg-surface p-4 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-950/30 text-primary-600 rounded-xl">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-wider text-txt-muted">Nhân viên được đánh giá</p>
                        <p className="text-xl font-bold text-txt-primary mt-0.5">{filteredEvaluations.length}</p>
                    </div>
                </div>

                <div className="bg-bg-surface p-4 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-wider text-txt-muted">Có dự án quản lý (PM)</p>
                        <p className="text-xl font-bold text-txt-primary mt-0.5">
                            {filteredEvaluations.filter(e => e.hasProjects).length}
                        </p>
                    </div>
                </div>

                <div className="bg-bg-surface p-4 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-violet-50 dark:bg-violet-950/30 text-violet-600 rounded-xl">
                        <Award className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-wider text-txt-muted">Xếp loại Xuất sắc (A1)</p>
                        <p className="text-xl font-bold text-txt-primary mt-0.5">
                            {filteredEvaluations.filter(e => e.classification.includes('A1')).length}
                        </p>
                    </div>
                </div>

                <div className="bg-bg-surface p-4 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-xl">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-wider text-txt-muted">Không hoàn thành (C)</p>
                        <p className="text-xl font-bold text-txt-primary mt-0.5">
                            {filteredEvaluations.filter(e => e.classification.includes('(C)')).length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Search toolbar */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo họ tên, chức danh, mã nhân viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-border rounded-xl text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 placeholder:text-txt-muted transition-all"
                />
            </div>

            {/* Evaluation Table */}
            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                    </div>
                ) : filteredEvaluations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-txt-muted">
                        <ClipboardCheck className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">Không có dữ liệu nhân sự phù hợp.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-bg-muted text-[10px] font-black uppercase tracking-wider text-txt-secondary border-b border-border">
                                    <th className="px-5 py-3 text-left">Nhân sự</th>
                                    <th className="px-5 py-3 text-left">Đơn vị & Chức vụ</th>
                                    <th className="px-5 py-3 text-center">Phiếu tháng</th>
                                    <th className="px-5 py-3 text-center">Điểm TB tháng (60%)</th>
                                    <th className="px-5 py-3 text-center">Vướng GPMB (Hiệu chỉnh)</th>
                                    <th className="px-5 py-3 text-center">Tỷ lệ Giải ngân</th>
                                    <th className="px-5 py-3 text-center">Điểm Giải ngân (40%)</th>
                                    <th className="px-5 py-3 text-center font-bold">Điểm cuối năm</th>
                                    <th className="px-5 py-3 text-center">Xếp loại</th>
                                    <th className="px-5 py-3 text-right">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredEvaluations.map((row) => {
                                    // Xác định màu sắc nhãn xếp loại
                                    let clsBadge = 'bg-slate-50 text-slate-600 border-slate-200';
                                    if (row.classification.includes('A1')) {
                                        clsBadge = 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400';
                                    } else if (row.classification.includes('(A)')) {
                                        clsBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400';
                                    } else if (row.classification.includes('(B)')) {
                                        clsBadge = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400';
                                    } else if (row.classification.includes('(C)')) {
                                        clsBadge = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400';
                                    }

                                    return (
                                        <tr key={row.employee_id} className="hover:bg-bg-subtle transition-colors group">
                                            <td className="px-5 py-4 text-left">
                                                <div>
                                                    <p className="font-semibold text-txt-primary text-sm group-hover:text-primary-600 transition-colors">
                                                        {row.full_name}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-txt-muted mt-0.5">
                                                        {row.employee_id}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-left">
                                                <div>
                                                    <p className="text-xs font-medium text-txt-primary">{row.position}</p>
                                                    <p className="text-[10px] text-txt-secondary mt-0.5">{row.department}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="text-xs font-semibold px-2 py-0.5 bg-bg-subtle border border-border rounded-full text-txt-secondary">
                                                    {row.formsCount}/12
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="text-sm font-bold text-txt-primary">
                                                    {row.monthlyAvg > 0 ? row.monthlyAvg.toFixed(1) : '—'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {row.hasProjects ? (
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                        Number(row.total_planned_adjusted) < Number(row.total_planned)
                                                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-200'
                                                            : 'bg-slate-50 dark:bg-slate-800 text-txt-muted border border-border'
                                                    }`}>
                                                        {Number(row.total_planned_adjusted) < Number(row.total_planned) ? 'Đã hiệu chỉnh' : 'Không vướng'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-txt-muted">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {row.hasProjects ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-bold text-txt-primary">
                                                            {row.adjusted_disbursement_rate}%
                                                        </span>
                                                        {row.raw_disbursement_rate !== row.adjusted_disbursement_rate && (
                                                            <span className="text-[9px] text-txt-muted line-through">
                                                                {row.raw_disbursement_rate}%
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-txt-muted">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {row.hasProjects ? (
                                                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                                        {row.disbScore}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-txt-muted">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                                                    {row.finalScore.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex text-[9px] font-black border px-2 py-1 rounded-md ${clsBadge}`}>
                                                    {row.classification.replace('Hoàn thành ', 'HT ')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {row.hasProjects ? (
                                                    <button 
                                                        onClick={() => handleViewDetails(row.employee_id, row.full_name, row.position, row.department)}
                                                        className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-primary-600 rounded-lg transition-colors"
                                                        title="Xem dự án chi tiết"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-txt-muted italic pr-2">Không có dự án</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnualEvaluationTab;
