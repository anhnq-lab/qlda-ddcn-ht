import React from 'react';
import { MessageSquare, Edit3, X, Check } from 'lucide-react';
import type { ProjectBriefingData } from '../../../../services/DashboardService';

interface Props {
    proj: ProjectBriefingData;
    isLeader: boolean;
    editingProjectId: string | null;
    commentText: string;
    onCommentChange: (text: string) => void;
    isSavingComment: boolean;
    onStartEdit: (projectId: string, existing: string) => void;
    onCancel: () => void;
    onSave: (projectId: string) => void;
}

export const LeaderCommentSection: React.FC<Props> = ({
    proj, isLeader, editingProjectId, commentText, onCommentChange,
    isSavingComment, onStartEdit, onCancel, onSave,
}) => {
    const isEditing = editingProjectId === proj.projectId;

    return (
        <div className="mt-4 pt-3 border-t border-dashed border-border">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-primary-500" />
                    <h5 className="text-xs font-black uppercase tracking-wider text-txt-secondary">Ý kiến chỉ đạo của Ban lãnh đạo</h5>
                </div>
                {isLeader && !isEditing && (
                    <button
                        onClick={() => onStartEdit(proj.projectId, proj.leaderComment || '')}
                        className="flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-950/30 px-2 py-1 rounded transition-colors"
                        aria-label={`Cập nhật ý kiến chỉ đạo cho ${proj.projectName}`}
                    >
                        <Edit3 className="w-3 h-3" /> Cập nhật ý kiến
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-2 bg-bg-surface p-3 rounded-lg border border-primary-300 dark:border-primary-800">
                    <textarea
                        value={commentText}
                        onChange={e => onCommentChange(e.target.value)}
                        placeholder="Nhập ý kiến chỉ đạo của Ban lãnh đạo đối với dự án này..."
                        className="w-full text-xs p-2 border border-border rounded bg-bg-surface focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        rows={3}
                        aria-label="Ý kiến chỉ đạo"
                    />
                    <div className="flex justify-end gap-1.5">
                        <button
                            onClick={onCancel}
                            disabled={isSavingComment}
                            className="btn btn-outline text-[10px] px-2.5 py-1 flex items-center gap-1"
                        >
                            <X className="w-3.5 h-3.5" /> Hủy
                        </button>
                        <button
                            onClick={() => onSave(proj.projectId)}
                            disabled={isSavingComment}
                            className="btn btn-primary text-[10px] px-2.5 py-1 flex items-center gap-1"
                        >
                            {isSavingComment
                                ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                                : <Check className="w-3.5 h-3.5" />
                            }
                            Lưu ý kiến
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`p-3 rounded-lg border leading-relaxed ${proj.leaderComment ? 'bg-primary-50/20 dark:bg-primary-950/10 border-primary-100 dark:border-primary-900/30' : 'bg-slate-50/50 dark:bg-slate-900/5 border-dashed border-slate-200 dark:border-slate-800'}`}>
                    {proj.leaderComment ? (
                        <div className="relative pl-3 border-l-2 border-primary-500">
                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line italic">
                                "{proj.leaderComment}"
                            </p>
                        </div>
                    ) : (
                        <p className="text-[11px] text-txt-muted italic text-center py-1">
                            Chưa có ý kiến chỉ đạo từ Ban lãnh đạo
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default LeaderCommentSection;
