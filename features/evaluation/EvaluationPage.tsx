import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, RefreshCw, Search, AlertCircle, ClipboardCheck } from 'lucide-react';
import { EvaluationService } from './services/evaluationService';
import { EvaluationStatusBadge, ClassificationBadge } from './components/EvaluationBadges';
import EvaluationFormModal from './components/EvaluationFormModal';
import EvaluationSlidePanel from './components/EvaluationSlidePanel';
import {
    MONTHS_VI,
    calcSelfTotal,
    calcManagerTotal,
    getClassification,
    type EvaluationForm,
    type EvaluationStatus,
} from './types/evaluation.types';
import { useAuth } from '../../context/AuthContext';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { Role } from '../../types/employee.types';

// ── Main Page ──────────────────────────────────────────────────────────────────
const EvaluationPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { openPanel, closePanel } = useSlidePanel();
    const isManager = currentUser?.Role === Role.Manager || currentUser?.Role === Role.Admin;

    const now = new Date();
    const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(now.getFullYear());
    const [filterStatus, setFilterStatus] = useState<EvaluationStatus | ''>('');
    const [search, setSearch] = useState('');
    const [forms, setForms] = useState<EvaluationForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedForm, setSelectedForm] = useState<EvaluationForm | null>(null);

    const fetchForms = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const params: Parameters<typeof EvaluationService.list>[0] = {
            eval_year: filterYear,
            eval_month: filterMonth || undefined,
        };
        if (filterStatus) params.status = filterStatus;
        // Nhân viên thường chỉ thấy phiếu của mình
        if (!isManager) params.employee_id = currentUser.EmployeeID;
        const { data } = await EvaluationService.list(params);
        setForms(data);
        setLoading(false);
    }, [currentUser, filterMonth, filterYear, filterStatus, isManager]);

    useEffect(() => { fetchForms(); }, [fetchForms]);

    const filtered = forms.filter(f =>
        !search ||
        f.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        f.department_name.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: filtered.length,
        submitted: filtered.filter(f => f.status === 'submitted').length,
        approved: filtered.filter(f => f.status === 'approved').length,
        draft: filtered.filter(f => f.status === 'draft').length,
    };

    // ── Open slide panel to create new form ────────────────────────
    const handleOpenCreate = () => {
        if (!currentUser) return;
        let panelId: string;

        const handleSaved = async (savedForm: EvaluationForm) => {
            await fetchForms();
            // If submitted → close the panel
            if (savedForm.status === 'submitted') {
                setTimeout(() => closePanel(panelId), 1600);
            }
        };

        panelId = openPanel({
            title: 'Tạo phiếu đánh giá',
            icon: <ClipboardCheck size={16} />,
            url: '/evaluation/new',
            component: (
                <EvaluationSlidePanel
                    onSaved={handleSaved}
                    onClose={() => closePanel(panelId)}
                />
            ),
        });
    };

    // ── Open slide panel to view/edit existing form ────────────────
    const handleOpenForm = (form: EvaluationForm) => {
        let panelId: string;

        const handleSaved = async (savedForm: EvaluationForm) => {
            await fetchForms();
            // Update in manager modal if status changed to submitted
            if (savedForm.status === 'submitted') {
                setTimeout(() => closePanel(panelId), 1600);
            }
        };

        // Employee self-assess panel
        const isOwnForm = form.employee_id === currentUser?.EmployeeID;
        const canEdit = (form.status === 'draft' || form.status === 'rejected') && isOwnForm;

        if (!isManager || canEdit) {
            panelId = openPanel({
                title: `Phiếu đánh giá — ${form.employee_name}`,
                icon: <ClipboardCheck size={16} />,
                url: `/evaluation/${form.id}`,
                component: (
                    <EvaluationSlidePanel
                        existingForm={form}
                        onSaved={handleSaved}
                        onClose={() => closePanel(panelId)}
                    />
                ),
            });
        } else {
            // Manager review modal (existing)
            setSelectedForm(form);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                        <ClipboardList size={20} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Đánh giá, xếp loại</h1>
                        <p className="text-sm text-slate-400">Phiếu đánh giá hàng tháng theo Quy chế QCDGXL-2026</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchForms} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Làm mới">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-lg shadow-primary-500/20"
                    >
                        <Plus size={16} />
                        Tạo phiếu mới
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Tổng phiếu', value: stats.total, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' },
                    { label: 'Chờ duyệt', value: stats.submitted, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Đã duyệt', value: stats.approved, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Nháp', value: stats.draft, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100 dark:border-slate-700`}>
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {isManager && (
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm nhân viên, phòng..."
                                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400"
                            />
                        </div>
                    )}

                    <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400">
                        <option value={0}>Tất cả tháng</option>
                        {MONTHS_VI.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>

                    <select value={filterYear} onChange={e => setFilterYear(+e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400">
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as EvaluationStatus | '')}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400">
                        <option value="">Tất cả trạng thái</option>
                        <option value="draft">Nháp</option>
                        <option value="submitted">Chờ duyệt</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="rejected">Từ chối</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                        <RefreshCw size={28} className="animate-spin text-primary-400" />
                        <span className="text-sm">Đang tải dữ liệu...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                        <AlertCircle size={36} className="text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-medium">Không có phiếu nào</p>
                        <button
                            onClick={handleOpenCreate}
                            className="mt-2 flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 rounded-xl transition-colors"
                        >
                            <Plus size={14} />
                            Tạo phiếu đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wide px-5 py-3">Nhân viên</th>
                                    {isManager && <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Phòng</th>}
                                    <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Kỳ</th>
                                    <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Điểm TĐG</th>
                                    <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Điểm TP</th>
                                    <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Xếp loại</th>
                                    <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.map(f => {
                                    const selfTotal = calcSelfTotal(f);
                                    const managerTotal = f.manager_score_1 !== null ? calcManagerTotal(f) : null;
                                    const finalScore = managerTotal ?? selfTotal;
                                    const cls = getClassification(finalScore);

                                    return (
                                        <tr key={f.id}
                                            onClick={() => handleOpenForm(f)}
                                            className="hover:bg-primary-50/50 dark:hover:bg-slate-800/70 cursor-pointer transition-colors group">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300 shrink-0">
                                                        {f.employee_name.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                                                        {f.employee_name}
                                                    </span>
                                                </div>
                                            </td>
                                            {isManager && (
                                                <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{f.department_name}</td>
                                            )}
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="text-xs font-medium text-slate-500">{MONTHS_VI[f.eval_month - 1].replace('Tháng ', 'T')}/{f.eval_year}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selfTotal.toFixed(1)}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {managerTotal !== null
                                                    ? <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{managerTotal.toFixed(1)}</span>
                                                    : <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <ClassificationBadge score={finalScore} size="sm" />
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <EvaluationStatusBadge status={f.status} size="sm" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Manager review modal (unchanged) */}
            {selectedForm && (
                <EvaluationFormModal
                    form={selectedForm}
                    isOpen={!!selectedForm}
                    onClose={() => setSelectedForm(null)}
                    onRefresh={fetchForms}
                    canManage={isManager}
                />
            )}
        </div>
    );
};

export default EvaluationPage;
