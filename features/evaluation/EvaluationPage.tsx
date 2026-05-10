import React, { useState, useEffect } from 'react';
import { 
    FileText, CheckCircle2, XCircle, Search, SlidersHorizontal, Plus, ChevronRight, 
    Calendar, Users, Eye, FileSignature 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/employee.types';
import { EvaluationService } from './services/evaluationService';
import { 
    type EvaluationForm, 
    type EvaluationStatus, 
    calcSelfTotal, 
    calcManagerTotal, 
    getClassification, 
    STATUS_CONFIG, 
    MONTHS_VI, 
    CLASSIFICATION_CONFIG 
} from './types/evaluation.types';
import { useSlidePanel } from '../../context/SlidePanelContext';
import EvaluationSlidePanel from './components/EvaluationSlidePanel';

export const EvaluationPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { openPanel, closePanel } = useSlidePanel();
    const isManager = currentUser?.Role === Role.Manager || currentUser?.Role === Role.Admin;

    const [forms, setForms] = useState<EvaluationForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [statusFilter, setStatusFilter] = useState<EvaluationStatus | 'all'>('all');
    const [deptFilter, setDeptFilter] = useState<string>('all');
    const [departments, setDepartments] = useState<{code:string;name:string}[]>([]);

    useEffect(() => {
        loadData();
    }, [month, year, statusFilter, deptFilter, currentUser]);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);

        try {
            // Load departments for filter (managers only)
            if (isManager && departments.length === 0) {
                const { data: depts } = await supabase.from('departments').select('code, name').order('name');
                if (depts) setDepartments(depts);
            }

            // Load evaluations
            const queryParams: any = { eval_month: month, eval_year: year };
            
            // Managers see their department (or all if Admin), Staff see only themselves
            if (!isManager) {
                queryParams.employee_id = currentUser.EmployeeID;
            } else if (currentUser.Role !== Role.Admin) {
                queryParams.department_code = currentUser.Department;
            } else if (deptFilter !== 'all') {
                queryParams.department_code = deptFilter;
            }

            if (statusFilter !== 'all') queryParams.status = statusFilter;

            const { data } = await EvaluationService.list(queryParams);
            setForms(data);
        } catch (err) {
            console.error('Error loading evaluations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        openPanel(
            `Đánh giá tháng ${month}/${year}`,
            <EvaluationSlidePanel 
                defaultMonth={month} 
                defaultYear={year} 
                onSaved={(f) => {
                    loadData(); // Reload list
                }}
                onClose={() => closePanel()}
            />
        );
    };

    const handleViewForm = (form: EvaluationForm) => {
        openPanel(
            `Phiếu đánh giá - ${form.employee_name}`,
            <EvaluationSlidePanel 
                existingForm={form}
                onSaved={(f) => {
                    loadData();
                }}
                onClose={() => closePanel()}
            />
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex-none px-6 py-5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display tracking-tight">
                            Đánh giá xếp loại (PL01 & PL02)
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Quy chế đánh giá, xếp loại cán bộ, viên chức (QCDGXL-2026)
                        </p>
                    </div>
                    <button 
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-primary-500/20 transition-all"
                    >
                        <Plus size={16} /> Tạo phiếu tự đánh giá
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <Calendar size={14} className="text-slate-400" />
                        <select 
                            value={month} 
                            onChange={e => setMonth(+e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                            {MONTHS_VI.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                        </select>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <select 
                            value={year} 
                            onChange={e => setYear(+e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <SlidersHorizontal size={14} className="text-slate-400" />
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className="bg-transparent text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="draft">Nháp</option>
                            <option value="submitted">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Từ chối</option>
                        </select>
                    </div>

                    {currentUser?.Role === Role.Admin && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <Users size={14} className="text-slate-400" />
                            <select 
                                value={deptFilter} 
                                onChange={e => setDeptFilter(e.target.value)}
                                className="bg-transparent text-sm text-slate-700 dark:text-slate-300 focus:outline-none max-w-[200px] truncate"
                            >
                                <option value="all">Tất cả phòng ban</option>
                                {departments.map(d => (
                                    <option key={d.code} value={d.code}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : forms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">Chưa có phiếu đánh giá nào trong tháng này.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {forms.map(form => {
                            const selfTotal = calcSelfTotal(form);
                            const managerTotal = calcManagerTotal(form);
                            const finalScore = form.status === 'approved' ? managerTotal : selfTotal;
                            const cls = getClassification(finalScore);
                            const clsCfg = CLASSIFICATION_CONFIG[cls];
                            
                            return (
                                <div 
                                    key={form.id}
                                    onClick={() => handleViewForm(form)}
                                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{form.employee_name}</h3>
                                            <p className="text-[11px] text-slate-500 mt-1">{form.chuc_vu || form.department_name}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${STATUS_CONFIG[form.status].bg} ${STATUS_CONFIG[form.status].color}`}>
                                            {STATUS_CONFIG[form.status].label}
                                        </span>
                                    </div>

                                    <div className={`p-4 rounded-xl border ${clsCfg.bg} ${clsCfg.darkBg} ${clsCfg.border} mb-4`}>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                    {form.status === 'approved' ? 'Điểm duyệt' : 'Điểm tự chấm'}
                                                </div>
                                                <div className={`text-2xl font-black ${clsCfg.color} ${clsCfg.darkColor}`}>
                                                    {finalScore.toFixed(0)} <span className="text-xs font-normal opacity-50">/100</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xs font-bold ${clsCfg.color} ${clsCfg.darkColor}`}>
                                                    {cls}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-1">
                                                    PL{form.form_type === 'leader' ? '01' : '02'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-400">
                                            {form.self_submitted_at ? `Nộp: ${new Date(form.self_submitted_at).toLocaleDateString('vi-VN')}` : 'Chưa nộp'}
                                        </span>
                                        <span className="text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Xem chi tiết <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EvaluationPage;
