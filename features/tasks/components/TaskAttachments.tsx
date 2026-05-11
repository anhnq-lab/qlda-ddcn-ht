import React, { useRef, useState } from 'react';
import { Paperclip, FileText, Download, Trash2, Upload, FileSpreadsheet, File, Scale } from 'lucide-react';
import { Task, TaskAttachment } from '../../../types';
import { getFileTypeColor, TaskTemplate } from '../../../utils/taskTemplates';
import { getTemplateConfig } from '../../../utils/templateRegistry';
import { supabase as _supabase } from '../../../lib/supabase';

const supabase = _supabase as any;

interface TaskAttachmentsProps {
    task: Task;
    updateTaskMutation: any;
    templates: TaskTemplate[];
    setActiveExportTemplate: (tpl: TaskTemplate) => void;
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ task, updateTaskMutation, templates, setActiveExportTemplate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !task) return;
        setIsUploading(true);
        try {
            const newAttachments: TaskAttachment[] = [...(task.Attachments || [])];
            for (const file of Array.from(files) as globalThis.File[]) {
                const ext = file.name.split('.').pop();
                const path = `${task.ProjectID}/tasks/${task.TaskID}/${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('task-attachments').upload(path, file);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('task-attachments').getPublicUrl(path);
                newAttachments.push({
                    id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    name: file.name,
                    url: urlData.publicUrl,
                    size: file.size < 1024 * 1024
                        ? `${(file.size / 1024).toFixed(0)} KB`
                        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                    uploadDate: new Date().toLocaleDateString('vi-VN'),
                    type: 'uploaded',
                });
            }
            updateTaskMutation.mutate({ ...task, Attachments: newAttachments });
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveAttachment = (attachId: string) => {
        if (!task || !confirm('Xóa tài liệu này?')) return;
        const updated = (task.Attachments || []).filter(a => a.id !== attachId);
        updateTaskMutation.mutate({ ...task, Attachments: updated });
    };

    return (
        <div className="bg-bg-surface rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-violet-400 to-indigo-500" />
            <div className="p-4">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Paperclip className="w-4 h-4" /> Tài liệu công việc
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-bg-subtle dark:bg-slate-700 px-2 py-1 rounded-lg">
                        {templates.length} mẫu • {(task.Attachments || []).length} đã tải
                    </span>
                </div>

                {/* Template documents */}
                {templates.length > 0 && (
                    <div className="mb-5">
                        <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <FileText className="w-3 h-3" /> Tài liệu mẫu theo quy định
                        </p>
                        <div className="space-y-1.5">
                            {templates.map((tpl, idx) => {
                                const ftc = getFileTypeColor(tpl.fileType);
                                const FileIcon = tpl.fileType === 'xlsx' ? FileSpreadsheet : tpl.fileType === 'pdf' ? File : FileText;
                                return (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50/80 dark:bg-slate-700 rounded-xl hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all ring-1 ring-slate-100 dark:ring-slate-700 group/tpl">
                                        <div className={`p-2 rounded-xl shadow-sm ring-1 ring-slate-100 dark:ring-slate-600 shrink-0 ${ftc.bg}`}>
                                            <FileIcon className={`w-4 h-4 ${ftc.text}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                {tpl.name}
                                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${ftc.bg} ${ftc.text}`}>{tpl.fileType}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 line-clamp-1">{tpl.description}</p>
                                            {tpl.legalBasis && (
                                                <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                                                    <Scale className="w-2.5 h-2.5" /> {tpl.legalBasis}
                                                </p>
                                            )}
                                        </div>
                                        {/* Export button for templates with templatePath */}
                                        {tpl.templatePath && getTemplateConfig(tpl.templatePath) && (
                                            <button
                                                onClick={() => setActiveExportTemplate(tpl)}
                                                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 mt-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold shadow-sm hover:shadow-md hover:from-indigo-600 hover:to-purple-600 transition-all transform active:scale-95"
                                                title="Xuất văn bản DOCX tự động điền dữ liệu dự án"
                                            >
                                                <Download className="w-3 h-3" />
                                                Xuất DOCX
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {templates.length === 0 && (
                    <div className="text-center py-5 mb-4 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
                        <FileText className="w-6 h-6 text-slate-200 dark:text-slate-600 mx-auto mb-1.5" />
                        <p className="text-[10px] text-slate-300 dark:text-slate-600 italic">Chưa có mẫu cho bước này</p>
                    </div>
                )}

                {/* Uploaded documents */}
                {(task.Attachments || []).length > 0 && (
                    <div className="mb-4">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Upload className="w-3 h-3" /> Tài liệu đã tải lên
                        </p>
                        <div className="space-y-1.5">
                            {(task.Attachments || []).map((att) => (
                                <div key={att.id} className="flex items-center gap-3 p-3 bg-emerald-50/40 dark:bg-emerald-900/10 rounded-xl ring-1 ring-emerald-100 dark:ring-emerald-900/30 hover:ring-emerald-200 dark:hover:ring-emerald-800 transition-all group/att">
                                    <div className="p-2 bg-bg-surface rounded-xl shadow-sm ring-1 ring-emerald-100 dark:ring-slate-600 shrink-0">
                                        <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors">
                                            {att.name}
                                        </a>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-400">{att.size} • {att.uploadDate}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Tải xuống">
                                            <Download className="w-3.5 h-3.5" />
                                        </a>
                                        <button
                                            onClick={() => handleRemoveAttachment(att.id)}
                                            className="p-1.5 opacity-0 group-hover/att:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-300 hover:text-red-500 transition-all"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload button */}
                <input
                    type="file" ref={fileInputRef} className="hidden" multiple
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.zip,.rar"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full text-center py-3.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-blue-200 dark:border-blue-800/40 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50"
                >
                    {isUploading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            Đang tải lên...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" /> Thêm tài liệu
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
