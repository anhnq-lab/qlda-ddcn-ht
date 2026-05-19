import React, { useState, useEffect } from 'react';
import { X, Save, Clock, BookOpen, Shield, Target, FileText } from 'lucide-react';
import type { WorkflowNode } from '../../../types/workflow.types';

interface NodeEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    node: WorkflowNode | null;
    onSave: (nodeId: string, data: any) => Promise<void>;
}

const NodeEditModal: React.FC<NodeEditModalProps> = ({ isOpen, onClose, node, onSave }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<any>('input');
    const [assigneeRole, setAssigneeRole] = useState('');
    const [slaValue, setSlaValue] = useState('');
    const [slaUnit, setSlaUnit] = useState('d');
    const [description, setDescription] = useState('');
    const [legalBasis, setLegalBasis] = useState('');
    const [output, setOutput] = useState('');
    const [phase, setPhase] = useState('preparation');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (node) {
            setName(node.name || '');
            setType(node.type || 'input');
            setAssigneeRole(node.assignee_role || '');
            
            const sf = node.sla_formula || '';
            const valMatch = sf.match(/^(\d+)/);
            const unitMatch = sf.match(/[a-zA-Z]+$/);
            setSlaValue(valMatch ? valMatch[0] : '');
            setSlaUnit(unitMatch ? unitMatch[0] : 'd');
            
            const meta = (node.metadata as any) || {};
            setPhase(meta.phase || 'preparation');
            setDescription(meta.description || '');
            setLegalBasis(meta.legal_basis || '');
            setOutput(meta.output || '');
        }
    }, [node]);

    if (!isOpen || !node) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedData = {
                name,
                type,
                assignee_role: assigneeRole,
                sla_formula: slaValue ? `${slaValue}${slaUnit}` : null,
                metadata: {
                    ...(node.metadata as any || {}),
                    description,
                    legal_basis: legalBasis,
                    output,
                    phase
                }
            };
            await onSave(node.id, updatedData);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <FileText size={20} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">Chỉnh sửa bước nghiệp vụ</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{(node as any).code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto custom-scrollbar space-y-5 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 focus-within:text-primary-600 dark:focus-within:text-primary-500 transition-colors">
                            <label className="text-xs font-bold text-inherit">Tên nội dung thực hiện (Bước)</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white transition-colors" />
                        </div>
                        <div className="space-y-1.5 focus-within:text-primary-600 dark:focus-within:text-primary-500 transition-colors">
                            <label className="text-xs font-bold text-inherit flex items-center gap-1.5">Phân loại bước</label>
                            <select value={type} onChange={e => setType(e.target.value)}
                                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white transition-colors cursor-pointer appearance-none">
                                <option value="start">Khởi xướng (Start)</option>
                                <option value="input">Lập hồ sơ / Thực thi (Input)</option>
                                <option value="approval">Phê duyệt (Approval)</option>
                                <option value="automated">Hệ thống xử lý tự động (Auto)</option>
                                <option value="end">Kết thúc (End)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5 focus-within:text-primary-600 dark:focus-within:text-primary-500 transition-colors">
                        <label className="text-xs font-bold text-inherit flex items-center gap-1.5">
                            <BookOpen size={14} className="text-blue-500" /> Giai đoạn dự án
                        </label>
                        <select value={phase} onChange={e => setPhase(e.target.value)}
                            className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white transition-colors cursor-pointer appearance-none">
                            <option value="preparation">I. Giai đoạn Chuẩn bị dự án</option>
                            <option value="execution">II. Giai đoạn Thực hiện dự án</option>
                            <option value="completion">III. Giai đoạn Kết thúc xây dựng</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                <Shield size={14} className="text-blue-500" /> Đơn vị thực hiện
                            </label>
                            <input type="text" value={assigneeRole} onChange={e => setAssigneeRole(e.target.value)}
                                placeholder="VD: Chủ đầu tư, BQLDA..."
                                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                <Clock size={14} className="text-warning-500" /> Thời gian (SLA)
                            </label>
                            <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                                <input type="number" 
                                    value={slaValue} 
                                    onChange={e => setSlaValue(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    className="w-16 flex-1 h-11 bg-transparent px-4 text-sm font-bold text-center border-r border-slate-200 dark:border-slate-700 focus:outline-none text-slate-800 dark:text-white" />
                                <select 
                                    value={slaUnit} 
                                    onChange={e => setSlaUnit(e.target.value)}
                                    className="min-w-[100px] h-11 bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300 border-none cursor-pointer">
                                    <option value="d">Ngày lịch</option>
                                    <option value="wd">Ngày làm việc</option>
                                    <option value="h">Giờ (Hours)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <BookOpen size={14} className="text-emerald-500" /> Căn cứ pháp lý
                        </label>
                        <textarea value={legalBasis} onChange={e => setLegalBasis(e.target.value)} rows={2}
                            placeholder="VD: Điều 29 Luật ĐTC 58/2024"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Mô tả công việc chi tiết</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                            placeholder="Lập hồ sơ, trình phê duyệt..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none leading-relaxed" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Target size={14} className="text-rose-500" /> Sản phẩm đầu ra (Hồ sơ)
                        </label>
                        <input type="text" value={output} onChange={e => setOutput(e.target.value)}
                            placeholder="VD: Quyết định phê duyệt, Tờ trình..."
                            className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                    <button onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        Hủy
                    </button>
                    <button onClick={handleSave} disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-primary-600 hover:bg-primary-700 text-white shadow-md disabled:opacity-50 transition-colors">
                        {isSaving ? <span className="animate-spin text-white">●</span> : <Save size={16} />}
                        Lưu Thay Đổi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NodeEditModal;
