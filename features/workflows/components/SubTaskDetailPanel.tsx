import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { Clock, Shield, Target, FileSpreadsheet, BookOpen, Upload, Loader2, Link as LinkIcon, X, Save, Search } from 'lucide-react';
import type { WorkflowNode, SubTask } from '../../../types/workflow.types';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import LegalDocumentSearch from '../../legal-documents/LegalDocumentSearch';

import { uploadTemplateFile, appendTemplateName, resolveLegalReference } from '../utils/workflowUtils';

interface SubTaskDetailPanelProps {
    node: WorkflowNode;
    subTaskId: string;
    onSave: (nodeId: string, updatedData: any) => Promise<void>;
    closePanel: () => void;
}

export const SubTaskDetailPanel: React.FC<SubTaskDetailPanelProps> = ({ node, subTaskId, onSave, closePanel }) => {
    const { addToast } = useToast();
    const { openPanel } = useSlidePanel();
    const [subTask, setSubTask] = useState<SubTask | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // File upload state
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (node && node.metadata) {
            const meta = node.metadata;
            const subTasks: SubTask[] = meta.sub_tasks || [];
            const found = subTasks.find(st => st.id === subTaskId);
            if (found) {
                setSubTask({ ...found }); // deep copy to edit locally
            }
        }
    }, [node, subTaskId]);

    const handleChange = (field: keyof SubTask, value: any) => {
        if (!subTask) return;
        setSubTask({ ...subTask, [field]: value });
    };

    const handleSave = async () => {
        if (!subTask || !node) return;
        setIsSaving(true);
        try {
            const meta = node.metadata || {};
            const subTasks: SubTask[] = meta.sub_tasks || [];
            
            // Apply changes
            const updatedSubTasks = subTasks.map(st => st.id === subTaskId ? subTask : st);
            
            // To keep backwards compatibility if this is the first subtask
            let updatedData: any = {
                metadata: {
                    ...meta,
                    sub_tasks: updatedSubTasks
                }
            };

            if (subTasks.length > 0 && subTasks[0].id === subTaskId) {
                // sync legacy fields
                updatedData.assignee_role = subTask.assignee_role || '';
                updatedData.metadata.legal_basis = subTask.legal_basis || '';
                updatedData.metadata.output = subTask.output || '';
                updatedData.metadata.template_forms = subTask.template_forms ? subTask.template_forms.split(',').map(s=>s.trim()) : [];
            }

            await onSave(node.id, updatedData);
            closePanel();
        } catch (err: any) {
            addToast({ title: 'Lỗi khi lưu', message: err.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!subTask || !node) return;
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploaded = await uploadTemplateFile(file, node.id);
            const templateName = appendTemplateName(subTask.template_forms || '', uploaded.name);

            // Update local state
            setSubTask({
                ...subTask,
                template_url: uploaded.url,
                template_forms: templateName
            });

            // Auto-persist to node metadata
            const meta = node.metadata || {};
            const subTasks: SubTask[] = meta.sub_tasks || [];
            const updatedSubTasks = subTasks.map(st => st.id === subTaskId ? {
                ...st,
                template_url: uploaded.url,
                template_forms: templateName
            } : st);

            const updatedData: any = {
                metadata: {
                    ...meta,
                    sub_tasks: updatedSubTasks,
                    ...(subTasks.length > 0 && subTasks[0].id === subTaskId
                        ? { template_forms: templateName.split(',').map(s => s.trim()) }
                        : {})
                }
            };

            await onSave(node.id, updatedData);
            addToast({ title: 'Đã tải lên biểu mẫu', message: 'Hệ thống đã lưu biểu mẫu thành công.', type: 'success' });
        } catch (err: any) {
            addToast({ title: 'Lệnh tải lên thất bại', message: err.message, type: 'error' });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleOpenLegalSearch = (basisText: string) => {
        const target = resolveLegalReference(basisText);

        openPanel({
            title: 'Tra cứu pháp luật',
            component: <LegalDocumentSearch 
                isEmbedded 
                initialDocId={target.docId} 
                initialArticleId={target.articleId} 
                initialSearchQuery={target.searchQuery || ''} 
            />
        });
    };

    if (!subTask) {
        return <div className="p-4 text-center text-slate-500">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-[#FAFAF8] dark:bg-slate-900 relative">
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <div className="flex-1 overflow-auto p-4 custom-scrollbar pb-28 space-y-6">
                <div className="bg-bg-surface rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                    <div className="space-y-1.5 p-1">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Nội dung công việc <span className="text-rose-500">*</span></label>
                        <textarea value={subTask.name} onChange={e => handleChange('name', e.target.value)}
                            ref={(el) => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }
                            }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                            }}
                            style={{ minHeight: '80px' }}
                            rows={2}
                            placeholder="VD: Trình, thẩm định, duyệt nội dung..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[13px] font-medium leading-relaxed focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none overflow-hidden" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Shield size={12} className="text-blue-500"/> Đơn vị thực hiện</label>
                            <input type="text" value={subTask.assignee_role} onChange={e => handleChange('assignee_role', e.target.value)}
                                placeholder="VD: Chủ đầu tư..."
                                className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Target size={12} className="text-rose-500"/> Đầu ra quy định</label>
                            <input type="text" value={subTask.output} onChange={e => handleChange('output', e.target.value)}
                                placeholder="VD: Tờ trình, Báo cáo..."
                                className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Clock size={12} className="text-amber-500" /> Thời gian (SLA)
                        </label>
                        <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all w-full max-w-xs">
                            <input type="text" 
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={subTask.sla || ''} 
                                onChange={e => {
                                    const v = e.target.value.replace(/\D/g, '');
                                    handleChange('sla', v);
                                }}
                                placeholder=""
                                className="w-16 flex-1 h-9 bg-transparent px-3 text-xs font-bold text-center border-r border-slate-200 dark:border-slate-700 focus:outline-none text-slate-800 dark:text-white" />
                            <select 
                                value={subTask.sla_unit || 'd'} 
                                onChange={e => handleChange('sla_unit', e.target.value)}
                                className="min-w-[90px] h-9 bg-slate-100 dark:bg-slate-800 px-2.5 text-[11px] font-semibold focus:outline-none text-slate-700 dark:text-slate-300 border-none cursor-pointer">
                                <option value="d">Ngày lịch</option>
                                <option value="wd">Ngày LV</option>
                                <option value="h">Giờ</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><FileSpreadsheet size={12} className="text-indigo-500"/> Biểu mẫu</label>
                                <button type="button" 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        fileInputRef.current?.click();
                                    }} 
                                    disabled={isUploading}
                                    className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded block transition-colors text-[10px] font-bold disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />} Tải file lên
                                </button>
                            </div>
                            <textarea value={subTask.template_forms} onChange={e => handleChange('template_forms', e.target.value)} rows={2}
                                placeholder="VD: Mẫu 01 (ND-112)"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[12px] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-y min-h-[60px]" />
                            {subTask.template_url && (
                                <div className="flex items-center gap-1 mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                                    <LinkIcon size={10} />
                                    <a href={subTask.template_url} target="_blank" rel="noreferrer" className="hover:underline truncate" title={subTask.template_url}>
                                        Đã đính kèm biểu mẫu
                                    </a>
                                    <button type="button" onClick={() => handleChange('template_url', '')} className="ml-1 text-slate-400 hover:text-rose-500">
                                        <X size={10} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><BookOpen size={12} className="text-emerald-500"/> Cơ sở pháp lý</label>
                                <button type="button" 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        handleOpenLegalSearch(subTask.legal_basis || '') 
                                    }} 
                                    className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded block transition-colors text-[10px] font-bold"
                                >
                                    <Search size={10} /> Tra cứu
                                </button>
                            </div>
                            <textarea value={subTask.legal_basis || ''} onChange={e => handleChange('legal_basis', e.target.value)} rows={2}
                                placeholder="VD: Khoản 3, Điều 43..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[12px] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 z-10">
                <button onClick={closePanel} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    Hủy bỏ
                </button>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving || isUploading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-primary-500/20 hover:shadow-md hover:shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Lưu Thay Đổi
                </button>
            </div>
        </div>
    );
};
