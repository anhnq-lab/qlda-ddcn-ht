import React, { useState } from 'react';
import { WorkflowNodeStatus } from './WorkflowVisualizer';
import { Upload, CheckCircle2, XCircle, Send } from 'lucide-react';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

interface ApprovalActionsProps {
    node: WorkflowNodeStatus;
    onClose: () => void;
    onComplete: (actionType: 'submit' | 'approve' | 'reject', comment?: string, files?: File[]) => void;
}

export const ApprovalActions: React.FC<ApprovalActionsProps> = ({ node, onClose, onComplete }) => {
    const { addToast } = useToast();
    const [action, setAction] = useState<'submit' | 'approve' | 'reject' | null>(null);
    const [comment, setComment] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    const handleConfirm = () => {
        if (!action) return;
        onComplete(action, comment, files);
        addToast({ title: 'Thành công', message: 'Đã cập nhật trạng thái bước quy trình', type: 'success' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-bg-surface rounded-2xl shadow-sm w-full max-w-md border border-border max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-border">
                    <h2 className="text-lg font-black text-txt-primary">Xử lý bước quy trình</h2>
                    <p className="text-sm text-txt-muted mt-1">{node.step_name}</p>
                </div>
                
                <div className="p-5 overflow-y-auto space-y-4">
                    {/* Action Selection */}
                    <div className="grid grid-cols-1 gap-3">
                        {node.status === 'in_progress' ? (
                            <button
                                onClick={() => setAction('submit')}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                    action === 'submit' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
                                }`}
                            >
                                <Send className="w-5 h-5 flex-shrink-0" />
                                <div className="text-left">
                                    <h4 className="font-bold text-sm">Trình duyệt kết quả</h4>
                                    <span className="text-xs opacity-80">Hoàn thành và chuyển lên cấp trên</span>
                                </div>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setAction('approve')}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                        action === 'approve' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-500 dark:text-emerald-400' : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <div className="text-left">
                                        <h4 className="font-bold text-sm">Phê duyệt</h4>
                                        <span className="text-xs opacity-80">Đồng ý kết quả và mở bước tiếp theo</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setAction('reject')}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                        action === 'reject' ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-500 dark:text-red-400' : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <XCircle className="w-5 h-5 flex-shrink-0" />
                                    <div className="text-left">
                                        <h4 className="font-bold text-sm">Từ chối</h4>
                                        <span className="text-xs opacity-80">Yêu cầu thực hiện lại bước này</span>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>

                    {/* File Upload Mock/Logic */}
                    {action === 'submit' && (
                        <div>
                            <label className="block text-sm font-bold text-txt-secondary mb-2">Đính kèm tài liệu kết quả</label>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 hover:border-primary-500 dark:border-slate-600 rounded-xl cursor-pointer bg-bg-surface transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-6 h-6 mb-2 text-gray-400" />
                                    <p className="text-xs text-txt-muted">Click hoặc kéo thả file vào đây</p>
                                </div>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                />
                            </label>

                            {files.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700 p-2 rounded-lg text-sm border border-gray-100 dark:border-slate-600">
                                            <span className="truncate text-txt-secondary pr-2">{file.name}</span>
                                            <button 
                                                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Comment Area */}
                    {action && (
                        <div>
                            <label className="block text-sm font-bold text-txt-secondary mb-2">Ghi chú / Ý kiến</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-xl bg-bg-surface p-3 min-h-[80px]"
                                placeholder={action === 'reject' ? "Ghi rõ lý do từ chối để nhân sự làm lại..." : "Nhập ý kiến (tuỳ chọn)"}
                                required={action === 'reject'}
                            />
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-border flex justify-end gap-2 bg-bg-subtle rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        Hủy
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!action || (action === 'reject' && !comment)}
                        className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};
