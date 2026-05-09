import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, ChevronDown, ChevronRight, Edit2, Trash2,
    BookOpen, Filter, Download, Upload, Calendar, Users, Building2
} from 'lucide-react';
import { AnnualPlanService } from '../../services/PlanService';
import {
    AnnualPlanItem, DepartmentCode, DEPARTMENT_CODES,
    DEPARTMENT_NAMES, FREQUENCY_LABELS, PlanFrequency,
} from '../../types/plan.types';
import AnnualPlanItemModal from './AnnualPlanItemModal';

const CURRENT_YEAR = new Date().getFullYear();

const FREQ_BADGE: Record<PlanFrequency, { label: string; color: string }> = {
    one_time:  { label: 'Một lần',      color: 'bg-blue-100 text-blue-700' },
    monthly:   { label: 'Hàng tháng',   color: 'bg-green-100 text-green-700' },
    quarterly: { label: 'Hàng quý',     color: 'bg-purple-100 text-purple-700' },
    daily:     { label: 'Hàng ngày',    color: 'bg-orange-100 text-orange-700' },
    as_needed: { label: 'Phát sinh',    color: 'bg-slate-100 text-slate-600' },
};

const AnnualPlanPage: React.FC = () => {
    const [year, setYear] = useState(CURRENT_YEAR);
    const [activeDept, setActiveDept] = useState<DepartmentCode>('HCTH');
    const [items, setItems] = useState<AnnualPlanItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<AnnualPlanItem | null>(null);

    useEffect(() => {
        loadItems();
    }, [year, activeDept]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await AnnualPlanService.getByDepartment(year, activeDept);
            setItems(data);
            // Mở hết group khi load
            const groups = new Set(data.map(i => i.group_name ?? ''));
            setExpandedGroups(groups);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return items;
        const q = searchTerm.toLowerCase();
        return items.filter(i =>
            i.task_name.toLowerCase().includes(q) ||
            (i.group_name ?? '').toLowerCase().includes(q) ||
            (i.deliverable ?? '').toLowerCase().includes(q)
        );
    }, [items, searchTerm]);

    // Nhóm theo group_name
    const groups = useMemo(() => {
        const map = new Map<string, AnnualPlanItem[]>();
        for (const item of filtered) {
            const g = item.group_name ?? 'Khác';
            if (!map.has(g)) map.set(g, []);
            map.get(g)!.push(item);
        }
        return map;
    }, [filtered]);

    const toggleGroup = (g: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            next.has(g) ? next.delete(g) : next.add(g);
            return next;
        });
    };

    const handleSaved = () => {
        setModalOpen(false);
        setEditing(null);
        loadItems();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa nhiệm vụ này?')) return;
        await AnnualPlanService.delete(id);
        loadItems();
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-800">Kế hoạch khung năm</h1>
                            <p className="text-xs text-slate-500">Chương trình công tác thường xuyên của các phòng</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Chọn năm */}
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                                <option key={y} value={y}>Năm {y}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => { setEditing(null); setModalOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm nhiệm vụ
                        </button>
                    </div>
                </div>

                {/* Tab phòng */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {DEPARTMENT_CODES.map(code => (
                        <button
                            key={code}
                            onClick={() => setActiveDept(code)}
                            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                activeDept === code
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {code}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Thanh công cụ ── */}
            <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm nhiệm vụ..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium text-slate-700">{DEPARTMENT_NAMES[activeDept]}</span>
                    <span>·</span>
                    <span>{items.length} nhiệm vụ</span>
                </div>
            </div>

            {/* ── Nội dung ── */}
            <div className="flex-1 overflow-auto px-6 py-4">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                        Đang tải...
                    </div>
                ) : groups.size === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <BookOpen className="w-10 h-10 opacity-30" />
                        <p className="text-sm">Chưa có nhiệm vụ nào trong kế hoạch khung năm {year}</p>
                        <button
                            onClick={() => { setEditing(null); setModalOpen(true); }}
                            className="text-primary-600 text-sm hover:underline"
                        >
                            Thêm nhiệm vụ đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Array.from(groups.entries()).map(([groupName, groupItems]) => (
                            <div key={groupName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                {/* Group header */}
                                <button
                                    onClick={() => toggleGroup(groupName)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {expandedGroups.has(groupName)
                                            ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                            : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                        <span className="font-semibold text-sm text-slate-800">{groupName}</span>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                            {groupItems.length}
                                        </span>
                                    </div>
                                </button>

                                {/* Group items */}
                                {expandedGroups.has(groupName) && (
                                    <div className="border-t border-slate-100">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                                                    <th className="px-4 py-2 text-left w-8">TT</th>
                                                    <th className="px-4 py-2 text-left">Nội dung nhiệm vụ</th>
                                                    <th className="px-4 py-2 text-left w-48">Sản phẩm đầu ra</th>
                                                    <th className="px-4 py-2 text-center w-24">Bắt đầu</th>
                                                    <th className="px-4 py-2 text-center w-24">Kết thúc</th>
                                                    <th className="px-4 py-2 text-center w-28">Tần suất</th>
                                                    <th className="px-4 py-2 text-left w-40">Phụ trách</th>
                                                    <th className="px-4 py-2 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {groupItems.map((item, idx) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-2.5 text-slate-400 text-xs">{idx + 1}</td>
                                                        <td className="px-4 py-2.5">
                                                            <span className="text-slate-800 leading-snug">{item.task_name}</span>
                                                            {item.project_id && (
                                                                <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Dự án</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-slate-500 text-xs leading-snug">
                                                            {item.deliverable ?? '—'}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center text-xs text-slate-600">
                                                            {item.start_period ?? '—'}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center text-xs text-slate-600">
                                                            {item.end_period ?? '—'}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_BADGE[item.frequency].color}`}>
                                                                {FREQ_BADGE[item.frequency].label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs text-slate-500 leading-snug">
                                                            {item.responsible_text ?? '—'}
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center gap-1 justify-end">
                                                                <button
                                                                    onClick={() => { setEditing(item); setModalOpen(true); }}
                                                                    className="p-1 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {modalOpen && (
                <AnnualPlanItemModal
                    year={year}
                    departmentCode={activeDept}
                    departmentName={DEPARTMENT_NAMES[activeDept]}
                    item={editing}
                    onSaved={handleSaved}
                    onClose={() => { setModalOpen(false); setEditing(null); }}
                />
            )}
        </div>
    );
};

export default AnnualPlanPage;
