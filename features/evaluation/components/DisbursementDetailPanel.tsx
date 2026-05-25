import React, { useState, useEffect } from 'react';
import { 
    X, Briefcase, TrendingUp, AlertTriangle, HardHat, 
    Layers, Landmark, CheckCircle2, Percent, ArrowRight
} from 'lucide-react';
import { EvaluationService } from '../services/evaluationService';
import type { ProjectDisbursementDetail } from '../types/evaluation.types';
import { useToast } from '../../../components/ui/Toast';

interface DisbursementDetailPanelProps {
    employeeId: string;
    employeeName: string;
    position: string;
    department: string;
    year: number;
    isManager: boolean;
    onClose: () => void;
}

export const DisbursementDetailPanel: React.FC<DisbursementDetailPanelProps> = ({
    employeeId,
    employeeName,
    position,
    department,
    year,
    isManager,
    onClose
}) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const [projects, setProjects] = useState<ProjectDisbursementDetail[]>([]);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await EvaluationService.getEmployeeProjectsDisbursementDetail(employeeId, year, isManager);
                if (res.error) {
                    showToast(`Lỗi tải chi tiết dự án: ${res.error}`, 'error');
                } else {
                    setProjects(res.data);
                }
            } catch (err: any) {
                showToast(`Lỗi kết nối: ${err.message}`, 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [employeeId, year, isManager, showToast]);

    // Định dạng tiền tệ VND
    const formatCurrency = (val: number | string): string => {
        const num = Number(val);
        if (num >= 1e12) return (num / 1e12).toFixed(2) + ' nghìn tỷ';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + ' tỷ';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + ' triệu';
        return num.toLocaleString('vi-VN') + ' đ';
    };

    return (
        <div className="flex flex-col h-full bg-bg-surface dark:bg-slate-900 border-l border-border animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-bg-muted/50">
                <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-md">
                        {isManager ? 'Báo cáo Phòng ban' : 'Chi tiết cá nhân'}
                    </span>
                    <h3 className="text-base font-black text-txt-primary truncate mt-1">
                        Hiệu suất giải ngân - {employeeName}
                    </h3>
                    <p className="text-xs text-txt-secondary mt-0.5 truncate">
                        {position} • {department}
                    </p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-bg-muted text-txt-secondary hover:text-txt-primary rounded-xl transition-all"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                        <p className="text-xs text-txt-muted">Đang truy vấn dữ liệu giải ngân...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-txt-muted text-center">
                        <Briefcase className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-semibold">Không tìm thấy dự án phụ trách nào.</p>
                        <p className="text-xs mt-1 max-w-[280px]">Nhân sự này không đứng tên làm thành viên hay PM của dự án nào trong năm {year}.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Summary Widget */}
                        <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 p-4 rounded-2xl flex items-start gap-4">
                            <div className="p-2.5 bg-primary-600 text-white rounded-xl">
                                <Landmark className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-primary-800 dark:text-primary-400">
                                    Tổng vốn quản lý năm {year}
                                </h4>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <p className="text-[10px] text-primary-600 dark:text-primary-400 uppercase tracking-wider font-semibold">Tổng vốn giao kế hoạch</p>
                                        <p className="text-base font-black text-txt-primary mt-0.5">
                                            {formatCurrency(projects.reduce((acc, p) => acc + Number(p.planned_amount), 0))}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-primary-600 dark:text-primary-400 uppercase tracking-wider font-semibold">Thực tế đã giải ngân</p>
                                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                            {formatCurrency(projects.reduce((acc, p) => acc + Number(p.actual_disbursed), 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Project Cards */}
                        <div className="space-y-4">
                            <p className="text-xs font-black uppercase text-txt-muted tracking-widest">
                                Danh sách dự án phụ trách ({projects.length})
                            </p>
                            
                            {projects.map((proj) => {
                                const isAdjusted = Number(proj.planned_amount_adjusted) < Number(proj.planned_amount);
                                const gpmbRate = proj.total_area > 0 ? (proj.cleared_area / proj.total_area) * 100 : 100;
                                
                                // Color variables based on rate
                                let rateColor = 'text-red-600 dark:text-red-400';
                                let rateBg = 'bg-red-50 dark:bg-red-950/20';
                                if (Number(proj.adjusted_rate) >= 85) {
                                    rateColor = 'text-emerald-600 dark:text-emerald-400';
                                    rateBg = 'bg-emerald-50 dark:bg-emerald-950/20';
                                } else if (Number(proj.adjusted_rate) >= 70) {
                                    rateColor = 'text-blue-600 dark:text-blue-400';
                                    rateBg = 'bg-blue-50 dark:bg-blue-950/20';
                                } else if (Number(proj.adjusted_rate) >= 50) {
                                    rateColor = 'text-amber-600 dark:text-amber-400';
                                    rateBg = 'bg-amber-50 dark:bg-amber-950/20';
                                }

                                return (
                                    <div 
                                        key={proj.proj_id} 
                                        className="p-5 rounded-2xl bg-bg-surface border border-border shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col gap-4"
                                    >
                                        {/* Title & Role */}
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="min-w-0">
                                                <h5 className="text-sm font-bold text-txt-primary leading-snug line-clamp-2">
                                                    {proj.proj_name}
                                                </h5>
                                                <p className="text-[10px] font-mono text-txt-muted mt-1">
                                                    Mã dự án: {proj.proj_id}
                                                </p>
                                            </div>
                                            {proj.member_role && (
                                                <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-txt-secondary rounded-md border border-border">
                                                    <HardHat size={10} />
                                                    {proj.member_role}
                                                </span>
                                            )}
                                        </div>

                                        {/* GPMB Info */}
                                        <div className="p-3 bg-bg-muted/50 rounded-xl border border-border flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-semibold text-txt-primary">Giải phóng mặt bằng (GPMB)</span>
                                            </div>
                                            <div className="text-right">
                                                {proj.total_area > 0 ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs font-bold text-txt-primary">
                                                            Đã bàn giao {gpmbRate.toFixed(1)}%
                                                        </span>
                                                        <span className="text-[9px] text-txt-muted">
                                                            ({proj.cleared_area.toLocaleString('vi-VN')} m² / {proj.total_area.toLocaleString('vi-VN')} m²)
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> Sạch (100%)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Financial details */}
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div className="space-y-1.5">
                                                <p className="text-txt-muted font-medium">Vốn giao kế hoạch:</p>
                                                <p className="font-bold text-txt-primary">{formatCurrency(proj.planned_amount)}</p>
                                                {isAdjusted && (
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                                                        <AlertTriangle size={9} />
                                                        Giao hiệu chỉnh: {formatCurrency(proj.planned_amount_adjusted)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 text-right">
                                                <p className="text-txt-muted font-medium">Thực tế giải ngân:</p>
                                                <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(proj.actual_disbursed)}</p>
                                                <p className="text-[10px] text-txt-muted">Tiền giải ngân hoàn thành</p>
                                            </div>
                                        </div>

                                        {/* Progress bars & Rates */}
                                        <div className="flex items-center gap-4 pt-3 border-t border-border/60">
                                            {/* Progress Bar */}
                                            <div className="flex-1">
                                                <div className="flex justify-between text-[10px] text-txt-muted font-semibold mb-1">
                                                    <span>Tiến độ giải ngân</span>
                                                    <span>{proj.adjusted_rate}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${
                                                            Number(proj.adjusted_rate) >= 85 ? 'bg-emerald-500' :
                                                            Number(proj.adjusted_rate) >= 70 ? 'bg-blue-500' :
                                                            Number(proj.adjusted_rate) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${Math.min(100, Number(proj.adjusted_rate))}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Rate badge */}
                                            <div className={`px-3 py-2 rounded-xl border border-border/80 flex flex-col items-center justify-center shrink-0 ${rateBg}`}>
                                                <span className={`text-base font-black ${rateColor}`}>
                                                    {proj.adjusted_rate}%
                                                </span>
                                                {isAdjusted && (
                                                    <span className="text-[8px] text-txt-muted line-through font-semibold">
                                                        Gốc: {proj.raw_rate}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DisbursementDetailPanel;
