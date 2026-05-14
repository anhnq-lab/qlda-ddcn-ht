import React, { useState, useRef } from 'react';
import { Shield, Plus, Search, Calendar, Building2, AlertTriangle, CheckCircle2, Clock, FileText, ChevronDown, ChevronUp, Edit3, Trash2, X, User, Upload, Paperclip, Download, File as FileIcon, ArrowUpDown } from 'lucide-react';
import { useInspections, useCreateInspection, useUpdateInspection, useDeleteInspection } from '@/hooks/useInspections';
import { Inspection, InspectionType, FollowUpStatus, INSPECTION_TYPE_LABELS, FOLLOW_UP_STATUS_LABELS } from '@/types/inspection.types';
import { formatFullCurrency } from '@/utils/format';
import { StatCard } from '@/components/common/StatCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

// ── Helpers ──
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Status Badge ──
const FollowUpBadge: React.FC<{ status: FollowUpStatus }> = ({ status }) => {
    const config: Record<FollowUpStatus, { bg: string; text: string; icon: React.ElementType }> = {
        pending: { bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-400', icon: Clock },
        in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: AlertTriangle },
        completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
    };
    const c = config[status];
    const Icon = c.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
            <Icon className="w-3 h-3" />
            {FOLLOW_UP_STATUS_LABELS[status]}
        </span>
    );
};

const TypeBadge: React.FC<{ type: InspectionType }> = ({ type }) => {
    const colors: Record<InspectionType, string> = {
        thanh_tra: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        kiem_toan: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${colors[type]}`}>
            {INSPECTION_TYPE_LABELS[type]}
        </span>
    );
};

// ── Status Action Dropdown ──
const StatusActionDropdown: React.FC<{
    current: FollowUpStatus;
    onChangeStatus: (status: FollowUpStatus) => void;
    isUpdating: boolean;
}> = ({ current, onChangeStatus, isUpdating }) => {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, right: 0 });

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
        }
        setOpen(!open);
    };

    const transitions: Record<FollowUpStatus, { next: FollowUpStatus[]; labels: Record<FollowUpStatus, string> }> = {
        pending: {
            next: ['in_progress'],
            labels: { in_progress: '▶ Bắt đầu xử lý', completed: '', pending: '' },
        },
        in_progress: {
            next: ['completed', 'pending'],
            labels: { completed: '✅ Hoàn thành', pending: '⏪ Quay lại chờ xử lý', in_progress: '' },
        },
        completed: {
            next: ['in_progress'],
            labels: { in_progress: '🔄 Mở lại xử lý', completed: '', pending: '' },
        },
    };

    const t = transitions[current];

    return (
        <>
            <button
                ref={btnRef}
                onClick={handleToggle}
                disabled={isUpdating}
                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Chuyển trạng thái"
            >
                {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <ArrowUpDown className="w-4 h-4 text-blue-500" />
                )}
            </button>
            {open && (
                <div
                    ref={dropRef}
                    className="fixed bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 py-1 min-w-[200px]"
                    style={{ top: pos.top, right: pos.right, zIndex: 9999 }}
                    onClick={e => e.stopPropagation()}
                >
                    <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Chuyển trạng thái</p>
                    {t.next.map(status => (
                        <button
                            key={status}
                            onClick={() => { onChangeStatus(status); setOpen(false); }}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-slate-300"
                        >
                            {t.labels[status]}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
};

// ── File Attachment Section ──
const AttachmentSection: React.FC<{
    attachments: Array<{ name: string; url: string; size?: string }>;
    inspectionId: string;
    projectId: string;
    onAttachmentsChange: (attachments: Array<{ name: string; url: string; size?: string }>) => void;
}> = ({ attachments, inspectionId, projectId, onAttachmentsChange }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const newAttachments = [...attachments];
            for (const file of Array.from(files) as File[]) {
                const timestamp = Date.now();
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const storagePath = `inspections/${projectId}/${inspectionId}/${timestamp}_${safeName}`;

                const { error: uploadError } = await (supabase as any).storage
                    .from('documents')
                    .upload(storagePath, file, { cacheControl: '3600', upsert: false });

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    continue;
                }

                const { data: urlData } = (supabase as any).storage
                    .from('documents')
                    .getPublicUrl(storagePath);

                newAttachments.push({
                    name: file.name,
                    url: urlData?.publicUrl || storagePath,
                    size: formatFileSize(file.size),
                });
            }
            onAttachmentsChange(newAttachments);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = (index: number) => {
        const updated = attachments.filter((_, i) => i !== index);
        onAttachmentsChange(updated);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    File đính kèm ({attachments.length})
                </p>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                >
                    {uploading ? (
                        <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploading ? 'Đang tải...' : 'Tải lên'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar"
                    onChange={handleUpload}
                    className="hidden"
                />
            </div>
            {attachments.length > 0 ? (
                <div className="space-y-1.5">
                    {attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg group">
                            <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="text-xs text-gray-700 dark:text-slate-300 truncate flex-1">{att.name}</span>
                            {att.size && <span className="text-[10px] text-gray-400 shrink-0">{att.size}</span>}
                            {att.url && (
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors shrink-0" title="Tải xuống">
                                    <Download className="w-3.5 h-3.5 text-blue-500" />
                                </a>
                            )}
                            <button type="button" onClick={() => handleRemove(i)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                                <X className="w-3.5 h-3.5 text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center py-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 cursor-pointer hover:border-blue-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                    <div className="text-center">
                        <FileIcon className="w-5 h-5 text-gray-300 dark:text-slate-400 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400 dark:text-slate-400">Kéo thả hoặc nhấn để tải file</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Form Modal ──
const InspectionFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Inspection>) => Promise<void>;
    editData?: Inspection | null;
    projectId: string;
}> = ({ isOpen, onClose, onSave, editData, projectId }) => {
    const [form, setForm] = useState<Partial<Inspection>>(() =>
        editData ? { ...editData } : { ProjectID: projectId, InspectionType: 'thanh_tra', Penalties: 0, FollowUpStatus: 'pending', Attachments: [], Status: 'active' }
    );
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setForm(editData ? { ...editData } : { ProjectID: projectId, InspectionType: 'thanh_tra', Penalties: 0, FollowUpStatus: 'pending', Attachments: [], Status: 'active' });
        }
    }, [isOpen, editData, projectId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.InspectionName?.trim()) return;
        setSaving(true);
        try {
            await onSave(form);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
    const labelCls = "text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1 block";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h3 className="text-base font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-red-600" />
                        {editData ? 'Sửa thông tin thanh tra' : 'Thêm đợt thanh tra/kiểm toán'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Loại *</label>
                            <select value={form.InspectionType || 'thanh_tra'} onChange={e => setForm(f => ({ ...f, InspectionType: e.target.value as InspectionType }))} className={inputCls}>
                                {Object.entries(INSPECTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Cơ quan thực hiện</label>
                            <input value={form.InspectionAgency || ''} onChange={e => setForm(f => ({ ...f, InspectionAgency: e.target.value }))} className={inputCls} placeholder="VD: Thanh tra Bộ XD" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Tên đợt thanh tra/kiểm toán *</label>
                            <input value={form.InspectionName || ''} onChange={e => setForm(f => ({ ...f, InspectionName: e.target.value }))} className={inputCls} placeholder="VD: Thanh tra việc quản lý sử dụng vốn đầu tư" required />
                        </div>
                        <div>
                            <label className={labelCls}>Người thực hiện</label>
                            <input value={form.InspectorName || ''} onChange={e => setForm(f => ({ ...f, InspectorName: e.target.value }))} className={inputCls} placeholder="VD: Nguyễn Văn A" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Số quyết định</label>
                            <input value={form.DecisionNumber || ''} onChange={e => setForm(f => ({ ...f, DecisionNumber: e.target.value }))} className={inputCls} placeholder="VD: 123/QĐ-TTr" />
                        </div>
                        <div>
                            <label className={labelCls}>Ngày quyết định</label>
                            <input type="date" value={form.DecisionDate || ''} onChange={e => setForm(f => ({ ...f, DecisionDate: e.target.value }))} className={inputCls} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Ngày bắt đầu</label>
                            <input type="date" value={form.StartDate || ''} onChange={e => setForm(f => ({ ...f, StartDate: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Ngày kết thúc</label>
                            <input type="date" value={form.EndDate || ''} onChange={e => setForm(f => ({ ...f, EndDate: e.target.value }))} className={inputCls} />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Kết luận</label>
                        <textarea value={form.Conclusion || ''} onChange={e => setForm(f => ({ ...f, Conclusion: e.target.value }))} className={`${inputCls} resize-none`} rows={3} placeholder="Nội dung kết luận thanh tra..." />
                    </div>

                    <div>
                        <label className={labelCls}>Khuyến nghị / Kiến nghị</label>
                        <textarea value={form.Recommendations || ''} onChange={e => setForm(f => ({ ...f, Recommendations: e.target.value }))} className={`${inputCls} resize-none`} rows={2} placeholder="Các kiến nghị, yêu cầu xử lý..." />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}>Số tiền xử phạt/thu hồi (VNĐ)</label>
                            <input type="number" value={form.Penalties || 0} onChange={e => setForm(f => ({ ...f, Penalties: Number(e.target.value) }))} className={inputCls} min="0" />
                        </div>
                        <div>
                            <label className={labelCls}>Trạng thái xử lý</label>
                            <select value={form.FollowUpStatus || 'pending'} onChange={e => setForm(f => ({ ...f, FollowUpStatus: e.target.value as FollowUpStatus }))} className={inputCls}>
                                {Object.entries(FOLLOW_UP_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Hạn xử lý</label>
                            <input type="date" value={form.FollowUpDeadline || ''} onChange={e => setForm(f => ({ ...f, FollowUpDeadline: e.target.value }))} className={inputCls} />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Ghi chú xử lý sau thanh tra/kiểm toán</label>
                        <textarea value={form.FollowUpNotes || ''} onChange={e => setForm(f => ({ ...f, FollowUpNotes: e.target.value }))} className={`${inputCls} resize-none`} rows={2} placeholder="Ghi chú về quá trình xử lý sau thanh tra/kiểm toán..." />
                    </div>

                    {/* File Upload Section */}
                    <AttachmentSection
                        attachments={form.Attachments || []}
                        inspectionId={editData?.InspectionID || 'new'}
                        projectId={projectId}
                        onAttachmentsChange={(atts) => setForm(f => ({ ...f, Attachments: atts }))}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving || !form.InspectionName?.trim()} className="px-6 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2">
                            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                            {editData ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main Tab Component ──
interface ProjectInspectionTabProps {
    projectID: string;
}

export const ProjectInspectionTab: React.FC<ProjectInspectionTabProps> = ({ projectID }) => {
    const { data: inspections = [], isLoading } = useInspections(projectID);
    const createMutation = useCreateInspection();
    const updateMutation = useUpdateInspection();
    const deleteMutation = useDeleteInspection();
    const { currentUser } = useAuth();

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Inspection | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Inspection | null>(null);
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    const filteredInspections = inspections.filter(i => {
        if (filterType !== 'all' && i.InspectionType !== filterType) return false;
        if (searchQuery && !i.InspectionName.toLowerCase().includes(searchQuery.toLowerCase()) && !i.InspectionAgency?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const stats = {
        total: inspections.length,
        pending: inspections.filter(i => i.FollowUpStatus === 'pending').length,
        inProgress: inspections.filter(i => i.FollowUpStatus === 'in_progress').length,
        completed: inspections.filter(i => i.FollowUpStatus === 'completed').length,
        totalPenalties: inspections.reduce((sum, i) => sum + i.Penalties, 0),
    };

    const handleSave = async (data: Partial<Inspection>) => {
        data.CreatedBy = data.CreatedBy || currentUser?.EmployeeID;
        if (editingItem) {
            await updateMutation.mutateAsync({ id: editingItem.InspectionID, data: { ...data, ProjectID: projectID } });
        } else {
            await createMutation.mutateAsync({ ...data, ProjectID: projectID });
        }
    };

    const handleStatusChange = async (item: Inspection, newStatus: FollowUpStatus) => {
        setUpdatingStatusId(item.InspectionID);
        try {
            await updateMutation.mutateAsync({
                id: item.InspectionID,
                data: { FollowUpStatus: newStatus, ProjectID: projectID },
            });
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteMutation.mutateAsync({ id: deleteTarget.InspectionID, projectId: projectID });
        setDeleteTarget(null);
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded-2xl" />)}
                </div>
                <div className="h-64 bg-gray-100 dark:bg-slate-700 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <StatCard label="Tổng đợt TT/KT" value={stats.total} color="slate" icon={<Shield className="w-5 h-5" />} />
                <StatCard label="Chờ xử lý" value={stats.pending} color="amber" icon={<Clock className="w-5 h-5" />} />
                <StatCard label="Đang xử lý" value={stats.inProgress} color="blue" icon={<AlertTriangle className="w-5 h-5" />} />
                <StatCard label="Đã hoàn thành" value={stats.completed} color="emerald" icon={<CheckCircle2 className="w-5 h-5" />} />
                <StatCard label="Tổng xử phạt" value={formatFullCurrency(stats.totalPenalties)} color="rose" icon={<AlertTriangle className="w-5 h-5" />} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm..."
                            className="pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500 outline-none w-56"
                        />
                    </div>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100">
                        <option value="all">Tất cả loại</option>
                        {Object.entries(INSPECTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md dark:bg-blue-500 dark:hover:bg-primary-600"
                >
                    <Plus className="w-4 h-4" /> Thêm đợt thanh tra
                </button>
            </div>

            {/* List */}
            {filteredInspections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-full mb-4">
                        <Shield className="w-8 h-8 text-gray-300 dark:text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 dark:text-slate-400">Chưa có thông tin thanh tra / kiểm toán</p>
                    <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Nhấn "Thêm đợt thanh tra" để bắt đầu</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredInspections.map(item => {
                        const isExpanded = expandedId === item.InspectionID;
                        return (
                            <div key={item.InspectionID} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                                {/* Header Row */}
                                <div
                                    className="px-5 py-4 flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : item.InspectionID)}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl shrink-0">
                                            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{item.InspectionName}</h4>
                                                <TypeBadge type={item.InspectionType} />
                                                <FollowUpBadge status={item.FollowUpStatus} />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 dark:text-slate-400 font-medium">
                                                {item.InspectionAgency && (
                                                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {item.InspectionAgency}</span>
                                                )}
                                                {item.DecisionNumber && (
                                                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> QĐ: {item.DecisionNumber}</span>
                                                )}
                                                {item.StartDate && (
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.StartDate}{item.EndDate ? ` → ${item.EndDate}` : ''}</span>
                                                )}
                                                {item.InspectorName && (
                                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.InspectorName}</span>
                                                )}
                                                {item.Attachments.length > 0 && (
                                                    <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> {item.Attachments.length} file</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-3">
                                        {item.Penalties > 0 && (
                                            <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">
                                                {formatFullCurrency(item.Penalties)}
                                            </span>
                                        )}
                                        <StatusActionDropdown
                                            current={item.FollowUpStatus}
                                            onChangeStatus={(s) => handleStatusChange(item, s)}
                                            isUpdating={updatingStatusId === item.InspectionID}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                            <Edit3 className="w-4 h-4 text-gray-400 dark:text-slate-400" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4 text-gray-300 dark:text-slate-600 hover:text-red-500" />
                                        </button>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 border-t border-gray-100 dark:border-slate-700 pt-4 space-y-3">
                                        {item.Conclusion && (
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Kết luận</p>
                                                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{item.Conclusion}</p>
                                            </div>
                                        )}
                                        {item.Recommendations && (
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Khuyến nghị / Kiến nghị</p>
                                                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{item.Recommendations}</p>
                                            </div>
                                        )}
                                        {item.FollowUpNotes && (
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Ghi chú xử lý sau thanh tra/kiểm toán</p>
                                                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{item.FollowUpNotes}</p>
                                            </div>
                                        )}
                                        {item.FollowUpDeadline && (
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                <span className="font-bold">Hạn xử lý:</span> {item.FollowUpDeadline}
                                            </p>
                                        )}
                                        {/* Attachments in expanded view */}
                                        {item.Attachments.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">File đính kèm ({item.Attachments.length})</p>
                                                <div className="space-y-1.5">
                                                    {item.Attachments.map((att, i) => (
                                                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                                            <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            <span className="text-xs text-gray-700 dark:text-slate-300 truncate flex-1">{att.name}</span>
                                                            {att.size && <span className="text-[10px] text-gray-400 shrink-0">{att.size}</span>}
                                                            {att.url && (
                                                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors shrink-0">
                                                                    <Download className="w-3.5 h-3.5 text-blue-500" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Form Modal */}
            <InspectionFormModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingItem(null); }}
                onSave={handleSave}
                editData={editingItem}
                projectId={projectID}
            />

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Xóa thông tin thanh tra"
                message={`Bạn có chắc muốn xóa đợt thanh tra "${deleteTarget?.InspectionName}"?`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};
