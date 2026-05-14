import React, { useState, useEffect, useMemo } from 'react';
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
import { DEPARTMENT_CODES, DEPARTMENT_NAMES } from '../../types/plan.types';

export const EvaluationPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { openPanel, closePanel, setPanelWidth } = useSlidePanel();
    const isManager = currentUser?.Role === Role.Manager || currentUser?.Role === Role.Admin;

    const [forms, setForms] = useState<EvaluationForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [statusFilter, setStatusFilter] = useState<EvaluationStatus | 'all'>('all');
    const [deptFilter, setDeptFilter] = useState<string>('all');
    const [activeSubTab, setActiveSubTab] = useState<'leader' | 'staff'>('leader');
    
    // Convert hardcoded departments to the format needed for the select dropdown
    const departments = DEPARTMENT_CODES.map(code => ({
        code,
        name: DEPARTMENT_NAMES[code]
    }));

    useEffect(() => {
        loadData();
    }, [month, year, statusFilter, deptFilter, currentUser]);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);

        try {
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
        setPanelWidth(window.innerWidth / 2);
        openPanel({
            title: `Đánh giá tháng ${month}/${year}`,
            component: <EvaluationSlidePanel 
                defaultMonth={month} 
                defaultYear={year} 
                onSaved={(f) => {
                    loadData(); // Reload list
                }}
                onClose={() => closePanel()}
            />
        });
    };

    const handleViewForm = (form: EvaluationForm) => {
        setPanelWidth(window.innerWidth / 2);
        openPanel({
            title: `Phiếu đánh giá - ${form.employee_name}`,
            component: <EvaluationSlidePanel 
                existingForm={form}
                onSaved={(f) => {
                    loadData();
                }}
                onClose={() => closePanel()}
            />
        });
    };

    const filteredAndSortedForms = useMemo(() => {
        let result = forms.filter(f => activeSubTab === 'leader' ? f.form_type === 'leader' : f.form_type === 'staff');
        
        if (activeSubTab === 'leader') {
            const positionOrder = [
                'Giám đốc Ban',
                'Phó Giám đốc Ban',
                'Kế toán trưởng',
                'Trưởng phòng',
                'Phó Trưởng phòng',
                'Phó trưởng phòng'
            ];
            
            result.sort((a, b) => {
                const posA = a.chuc_vu || '';
                const posB = b.chuc_vu || '';
                
                const getOrder = (pos: string) => {
                    for (let i = 0; i < positionOrder.length; i++) {
                        if (pos.includes(positionOrder[i])) return i;
                    }
                    return 999;
                };
                
                const indexA = getOrder(posA);
                const indexB = getOrder(posB);
                
                if (indexA !== indexB) {
                    return indexA - indexB;
                }
                
                // Specific requested name order
                const exactNameOrder = [
                    'Nguyễn Quang Linh',
                    'Trần Ngọc Bảo',
                    'Ngô Đức Quy'
                ];
                
                const getExactNameOrder = (name: string) => {
                    const idx = exactNameOrder.findIndex(n => name.includes(n));
                    return idx === -1 ? 999 : idx;
                };
                
                const nameIdxA = getExactNameOrder(a.employee_name);
                const nameIdxB = getExactNameOrder(b.employee_name);
                
                if (nameIdxA !== nameIdxB) {
                    return nameIdxA - nameIdxB;
                }
                
                return a.employee_name.localeCompare(b.employee_name);
            });
        } else {
            result.sort((a, b) => {
                if (a.department_code !== b.department_code) {
                    return (a.department_name || '').localeCompare(b.department_name || '');
                }
                return a.employee_name.localeCompare(b.employee_name);
            });
        }
        
        return result;
    }, [forms, activeSubTab]);

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

                {/* Tabs & Filters */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate- p-1 rounded-xl w-max border border-slate-200 dark:border-slate-700/50">
                        <button 
                            onClick={() => setActiveSubTab('leader')}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                activeSubTab === 'leader' 
                                    ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            Lãnh đạo (PL01)
                        </button>
                        <button 
                            onClick={() => setActiveSubTab('staff')}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                activeSubTab === 'staff' 
                                    ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            Nhân viên (PL02)
                        </button>
                    </div>

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
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredAndSortedForms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">Chưa có phiếu đánh giá nào trong nhóm này.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)]">
                        <table className="w-full">
                            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                <tr className="text-slate-500 dark:text-slate-400">
                                    <th className="px-4 py-3 text-left min-w-[200px] border-b border-slate-200 dark:border-slate-700">Nhân sự</th>
                                    <th className="px-4 py-3 text-center w-24 border-b border-slate-200 dark:border-slate-700">Loại phiếu</th>
                                    <th className="px-4 py-3 text-center w-24 border-b border-slate-200 dark:border-slate-700">Tự chấm</th>
                                    <th className="px-4 py-3 text-center w-24 border-b border-slate-200 dark:border-slate-700">Phê duyệt</th>
                                    <th className="px-4 py-3 text-center min-w-[140px] border-b border-slate-200 dark:border-slate-700">Xếp loại</th>
                                    <th className="px-4 py-3 text-center w-32 border-b border-slate-200 dark:border-slate-700">Trạng thái</th>
                                    <th className="px-4 py-3 text-right w-32 border-b border-slate-200 dark:border-slate-700">Ngày nộp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {filteredAndSortedForms.map((row) => {
                                    const selfTotal = calcSelfTotal(row);
                                    const managerTotal = calcManagerTotal(row);
                                    const finalScore = row.status === 'approved' ? managerTotal : selfTotal;
                                    const cls = getClassification(finalScore);
                                    const clsCfg = CLASSIFICATION_CONFIG[cls];
                                    const statusCfg = STATUS_CONFIG[row.status];

                                    return (
                                        <tr
                                            key={row.id}
                                            onClick={() => handleViewForm(row)}
                                            className="group cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-700"
                                        >
                                            <td className="px-4 py-3.5 text-left">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm group-hover:text-primary-600 transition-colors truncate">
                                                        {row.employee_name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                        {row.chuc_vu || row.department_name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                    PL{row.form_type === 'leader' ? '01' : '02'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{selfTotal.toFixed(0)}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="font-bold text-primary-600 dark:text-primary-400">{managerTotal.toFixed(0)}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${clsCfg.bg} ${clsCfg.color}`}>
                                                    {cls}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${statusCfg.bg} ${statusCfg.color}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className="text-xs text-slate-500">
                                                    {row.self_submitted_at ? new Date(row.self_submitted_at).toLocaleDateString('vi-VN') : '—'}
                                                </span>
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

export default EvaluationPage;
