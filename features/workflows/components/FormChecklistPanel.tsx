import React, { useState, useEffect } from 'react';
import {
    CheckSquare, Square, FileText, ClipboardList,
    Table2, FileCheck2, Save, Loader2, PartyPopper, Download
} from 'lucide-react';
import { getFormDefinition } from '../data/formChecklist';
import { useQuery } from '@tanstack/react-query';
import { ProjectService } from '../../../services/ProjectService';
import { generateBMTK1B02, BMTK1B02FormData } from '../../../utils/exportBMTK1B02';
import { ProjectMemberService } from '../../../services/ProjectMemberService';
import { useContractors } from '../../../hooks/useContractors';
import { useBiddingPackages } from '../../../hooks/useBiddingPackages';
import { format } from 'date-fns';

export interface FormSavePayload {
    checkedIds: number[];
    totalItems: number;
    allDone: boolean;
}

interface Props {
    formCode: string;
    /** Checked IDs được restore từ WorkflowRunnerPanel (để persist state) */
    initialCheckedIds?: number[];
    /** Gọi khi user nhấn "Lưu biểu mẫu" */
    onSave?: (payload: FormSavePayload) => Promise<void> | void;
    projectId?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ReactNode> = {
    checklist: <ClipboardList className="w-4 h-4 text-primary-500" />,
    table:     <Table2 className="w-4 h-4 text-amber-500" />,
    document:  <FileCheck2 className="w-4 h-4 text-emerald-500" />,
};

const TYPE_LABEL: Record<string, string> = {
    checklist: 'Bảng kiểm tra',
    table:     'Biểu bảng',
    document:  'Hồ sơ / Văn bản',
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * FormChecklistPanel — panel con trong SlidePanel stack.
 * Hiển thị checklist tương tác. Khi tick đủ tất cả → tự động gọi onSave(allDone=true).
 * Có nút "Lưu biểu mẫu" để lưu tiến độ bất kỳ lúc nào.
 */
export const FormChecklistPanel: React.FC<Props> = ({
    formCode,
    initialCheckedIds = [],
    onSave,
    projectId,
}) => {
    const form = getFormDefinition(formCode);

    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => ProjectService.getById(projectId!),
        enabled: !!projectId,
    });

    const { data: projectMembers = [] } = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => ProjectMemberService.getMembersWithDetails(projectId!),
        enabled: !!projectId,
    });
    const { contractors } = useContractors();
    const { data: biddingPackages } = useBiddingPackages(projectId || '');

    const [bmtkFormData, setBmtkFormData] = useState<BMTK1B02FormData>({
        canBoPhuTrach: '',
        donViTuVan: '',
        soHopDong: '',
        thoiHanHoanThanh: '',
        ngayLap: format(new Date(), 'dd/MM/yyyy'),
        hangMuc: ''
    });
    const [exporting, setExporting] = useState(false);

    const [checked, setChecked] = useState<Set<number>>(new Set(initialCheckedIds));
    const [saving, setSaving] = useState(false);
    const [savedOnce, setSavedOnce] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);

    // Khi initialCheckedIds thay đổi từ ngoài (restore) → sync
    useEffect(() => {
        setChecked(new Set(initialCheckedIds));
    }, [formCode]); // chỉ reset khi đổi form

    if (!form) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <FileText className="w-10 h-10 text-gray-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-bold text-gray-600 dark:text-slate-400">Không tìm thấy biểu mẫu</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Mã: {formCode}</p>
            </div>
        );
    }

    const total = form.type === 'checklist' ? form.items.length : 0;
    const done  = checked.size;
    const pct   = total === 0 ? 100 : Math.round((done / total) * 100);
    const isAllDone = total === 0 || done >= total;

    const toggle = (id: number) => {
        setChecked(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
        setSavedOnce(false); // có thay đổi → cần lưu lại
    };

    const handleSave = async () => {
        if (!onSave) return;
        setSaving(true);
        try {
            await onSave({
                checkedIds: [...checked],
                totalItems: total,
                allDone: isAllDone,
            });
            setSavedOnce(true);
            if (isAllDone) setJustCompleted(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800">

            {/* ── Header ── */}
            <div className="p-5 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                    {TYPE_ICON[form.type] ?? <FileText className="w-4 h-4 text-gray-400" />}
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-slate-400">
                        {TYPE_LABEL[form.type] ?? form.type}
                    </span>
                    <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        {formCode}
                    </span>
                </div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white leading-snug">{form.title}</h2>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{form.description}</p>

                {/* Progress bar */}
                {form.type === 'checklist' && total > 0 && (
                    <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                {isAllDone ? '✅ Đã hoàn thành tất cả mục' : 'Tiến độ kiểm tra'}
                            </span>
                            <span className={`text-[10px] font-bold ${isAllDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary-600 dark:text-primary-400'}`}>
                                {done}/{total} mục ({pct}%)
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    isAllDone
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                        : 'bg-gradient-to-r from-primary-500 to-primary-400'
                                }`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Banner hoàn thành ── */}
            {justCompleted && (
                <div className="mx-4 mt-4 flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <PartyPopper className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                        <p className="text-[12px] font-black text-emerald-700 dark:text-emerald-400">Đã lưu — Biểu mẫu hoàn tất!</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">Bước sẽ tự động chuyển sang giai đoạn tiếp theo.</p>
                    </div>
                </div>
            )}

            {/* ── Nội dung checklist ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5" style={{ paddingBottom: '80px' }}>

                {/* Checklist type */}
                {form.type === 'checklist' && (
                    <>
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                            Danh mục kiểm tra ({total} mục)
                        </p>
                        {form.items.map(item => {
                            const isChecked = checked.has(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => toggle(item.id)}
                                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all border ${
                                        isChecked
                                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40'
                                            : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600/50 hover:bg-gray-100 dark:hover:bg-slate-700/60 active:scale-[0.99]'
                                    }`}
                                >
                                    <span className="mt-0.5 shrink-0 text-[10px] font-black text-gray-400 dark:text-slate-500 w-5 text-right">
                                        {item.id}.
                                    </span>
                                    <span className={`flex-1 text-[12px] leading-relaxed ${
                                        isChecked
                                            ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-60'
                                            : 'text-gray-700 dark:text-slate-300'
                                    }`}>
                                        {item.content}
                                    </span>
                                    <span className="shrink-0 mt-0.5">
                                        {isChecked
                                            ? <CheckSquare className="w-4 h-4 text-emerald-500" />
                                            : <Square className="w-4 h-4 text-gray-300 dark:text-slate-500" />
                                        }
                                    </span>
                                </button>
                            );
                        })}

                        {/* Nút chọn tất cả / bỏ chọn */}
                        {total > 3 && (
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => { setChecked(new Set(form.items.map(i => i.id))); setSavedOnce(false); }}
                                    className="flex-1 text-[10px] font-bold py-1.5 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                >
                                    ✅ Chọn tất cả
                                </button>
                                <button
                                    onClick={() => { setChecked(new Set()); setSavedOnce(false); }}
                                    className="flex-1 text-[10px] font-bold py-1.5 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    ☐ Bỏ chọn tất
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Table type */}
                {form.type === 'table' && (
                    <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                            Cấu trúc bảng biểu
                        </p>
                        <div className="bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                                        <th className="text-left px-3 py-2 font-black text-gray-600 dark:text-slate-300 w-8">TT</th>
                                        <th className="text-left px-3 py-2 font-black text-gray-600 dark:text-slate-300">Nội dung cột</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.items.map((item, i) => (
                                        <tr key={item.id} className={`border-b border-gray-100 dark:border-slate-700 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-slate-700'}`}>
                                            <td className="px-3 py-2.5 text-gray-400 dark:text-slate-500 font-bold">{item.id}</td>
                                            <td className="px-3 py-2.5 text-gray-700 dark:text-slate-300">{item.content}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-3 italic">
                            * Biểu mẫu này được điền theo dữ liệu thực tế của từng dự án.
                        </p>
                    </div>
                )}

                {/* Document type */}
                {form.type === 'document' && (
                    <div>
                        {formCode === 'BM-TK1B-02' ? (
                            <div className="space-y-4 mb-4">
                                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                    Thông tin phiếu giao nhiệm vụ
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                            Chuyên viên phụ trách
                                        </label>
                                        <select
                                            className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                                            value={bmtkFormData.canBoPhuTrach}
                                            onChange={(e) => setBmtkFormData(p => ({ ...p, canBoPhuTrach: e.target.value }))}
                                        >
                                            <option value="">Chọn chuyên viên...</option>
                                            {projectMembers.map(emp => (
                                                <option key={emp.EmployeeID} value={emp.FullName}>
                                                    {emp.FullName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                            Đơn vị tư vấn
                                        </label>
                                        <select
                                            className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                                            value={bmtkFormData.donViTuVan}
                                            onChange={(e) => setBmtkFormData(p => ({ ...p, donViTuVan: e.target.value }))}
                                        >
                                            <option value="">Chọn nhà thầu...</option>
                                            {contractors?.map(c => (
                                                <option key={c.ContractorID} value={c.FullName}>
                                                    {c.FullName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                            Hạng mục / Gói thầu
                                        </label>
                                        <select
                                            className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                                            value={bmtkFormData.hangMuc}
                                            onChange={(e) => setBmtkFormData(p => ({ ...p, hangMuc: e.target.value }))}
                                        >
                                            <option value="">Chọn gói thầu...</option>
                                            {biddingPackages?.map(pkg => (
                                                <option key={pkg.PackageID} value={pkg.PackageName}>
                                                    {pkg.PackageName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-gray-500 dark:text-slate-400 mb-1 font-semibold">Số văn bản / HĐ</label>
                                        <input 
                                            type="text" 
                                            value={bmtkFormData.soHopDong}
                                            onChange={e => setBmtkFormData(prev => ({...prev, soHopDong: e.target.value}))}
                                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow" 
                                            placeholder="12/HĐ-TV..."
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-gray-500 dark:text-slate-400 mb-1 font-semibold">Ngày lập</label>
                                        <input 
                                            type="text" 
                                            value={bmtkFormData.ngayLap}
                                            onChange={e => setBmtkFormData(prev => ({...prev, ngayLap: e.target.value}))}
                                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow" 
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-gray-500 dark:text-slate-400 mb-1 font-semibold">Thời hạn hoàn thành</label>
                                        <input 
                                            type="text" 
                                            value={bmtkFormData.thoiHanHoanThanh}
                                            onChange={e => setBmtkFormData(prev => ({...prev, thoiHanHoanThanh: e.target.value}))}
                                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow" 
                                            placeholder="Theo hợp đồng..."
                                        />
                                    </div>
                                </div>
                                
                                <button
                                    onClick={async () => {
                                        if (!project) return;
                                        setExporting(true);
                                        try {
                                            await generateBMTK1B02(project, bmtkFormData);
                                            // Đánh dấu hoàn thành form nếu cần thiết
                                            if (onSave) {
                                                await onSave({
                                                    checkedIds: form.items.map(i => i.id),
                                                    totalItems: form.items.length,
                                                    allDone: true
                                                });
                                                setSavedOnce(true);
                                            }
                                        } finally {
                                            setExporting(false);
                                        }
                                    }}
                                    disabled={exporting || !project}
                                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-md"
                                >
                                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Xuất file Word (DOCX)
                                </button>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-2 text-center italic">
                                    Hệ thống sẽ tự động sử dụng thông tin từ dự án <b>{project?.ProjectName}</b> cho các trường còn lại.
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                                    Nội dung chính cần có
                                </p>
                                <div className="space-y-2">
                                    {form.items.map(item => (
                                        <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600">
                                            <span className="shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-[9px] font-black text-primary-600 dark:text-primary-400 mt-0.5">
                                                {item.id}
                                            </span>
                                            <p className="text-[12px] text-gray-700 dark:text-slate-300 leading-relaxed">{item.content}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-3 italic">
                                    * Hồ sơ / văn bản do chuyên viên soạn thảo theo mẫu và ký theo thẩm quyền.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Footer: Nút Lưu ── */}
            <div className="shrink-0 px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                {/* Cảnh báo nếu chưa đủ */}
                {form.type === 'checklist' && !isAllDone && done > 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
                        Còn {total - done} mục chưa kiểm tra
                    </p>
                )}

                {onSave && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[12px] transition-all shadow-sm ${
                            isAllDone
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-emerald-900'
                                : 'bg-primary-600 hover:bg-primary-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                        ) : isAllDone ? (
                            <><CheckSquare className="w-4 h-4" /> Lưu &amp; Hoàn tất biểu mẫu</>
                        ) : (
                            <><Save className="w-4 h-4" /> Lưu tiến độ ({done}/{total})</>
                        )}
                    </button>
                )}

                <p className="text-[9px] text-gray-400 dark:text-slate-500 italic text-center">
                    📌 QT-DAXD-TK-QLDA2-2026 — áp dụng từ 01/7/2026
                </p>
            </div>
        </div>
    );
};
