import React from 'react';
import { X, Check } from 'lucide-react';

interface ContractorAccount {
    account_id: string;
    contractor_id: string;
    username: string;
    display_name: string;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    last_login: string | null;
    allowed_project_ids: string[] | null;
    auth_user_id: string | null;
    created_at: string | null;
    contractor_name?: string;
}

interface ProjectInfo {
    project_id: string;
    project_name: string;
}

interface ProjectAssignmentModalProps {
    projectTarget: ContractorAccount;
    projects: ProjectInfo[];
    onClose: () => void;
    onToggleProject: (projectId: string) => Promise<void>;
}

export const ProjectAssignmentModal: React.FC<ProjectAssignmentModalProps> = ({
    projectTarget, projects, onClose, onToggleProject
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-bg-surface rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-txt-primary">Gán dự án</h3>
                        <p className="text-sm text-txt-muted">{projectTarget.display_name} — {projectTarget.contractor_name}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5">
                    {projects.map(proj => {
                        const isAssigned = (projectTarget.allowed_project_ids || []).includes(proj.project_id);
                        return (
                            <button key={proj.project_id} onClick={() => onToggleProject(proj.project_id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all ${isAssigned
                                    ? 'bg-primary-50 dark:bg-primary-900/15 border border-primary-200 dark:border-primary-800/40'
                                    : 'bg-gray-50 dark:bg-slate-700 border border-transparent hover:bg-bg-muted'}`}>
                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isAssigned
                                    ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                                    {isAssigned && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate ${isAssigned ? 'text-primary-800 dark:text-primary-300' : 'text-txt-secondary'}`}>{proj.project_name}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{proj.project_id}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="mt-4 pt-3 border-t border-border text-xs text-gray-400 text-center">
                    Đã gán {(projectTarget.allowed_project_ids || []).length} / {projects.length} dự án
                </div>
            </div>
        </div>
    );
};
