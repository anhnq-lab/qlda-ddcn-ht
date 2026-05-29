import React from 'react';
import { FolderTree, Building2, Upload, Loader2, FileText, Clock, Share2, CheckCircle2 } from 'lucide-react';
import type { CDEStats } from '../types';
import { StatCard } from '../../../components/ui';
import CDENotificationBell from './CDENotificationBell';

interface CDEHeaderProps {
    projects: Array<{ ProjectID: string; ProjectName: string }>;
    selectedProjectId: string;
    onProjectChange: (id: string) => void;
    stats: CDEStats | undefined;
    onUpload: () => void;
    isUploading: boolean;
    canUpload: boolean;
    userRole?: string;
    hideStats?: boolean;
}

const CDEHeader: React.FC<CDEHeaderProps> = ({
    projects, selectedProjectId, onProjectChange, stats, onUpload, isUploading, canUpload, userRole, hideStats,
}) => {
    const statCards = [
        { label: 'Tổng hồ sơ', value: stats?.total || 0, icon: FileText, color: 'slate' as const },
        { label: 'Đang xử lý', value: stats?.wip || 0, icon: Clock, color: 'amber' as const },
        { label: 'Đang xét duyệt', value: stats?.shared || 0, icon: Share2, color: 'blue' as const },
        { label: 'Đã phê duyệt', value: stats?.published || 0, icon: CheckCircle2, color: 'emerald' as const },
    ];

    return (
        <div className="flex-none mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-2xl font-black text-txt-primary tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center shadow-md shadow-primary-200 dark:shadow-primary-950/40" >
                            <FolderTree className="w-5 h-5 text-white" />
                        </div>
                        Môi trường dữ liệu chung
                    </h1>
                    <p className="text-sm text-txt-muted mt-1 ml-[52px]">
                        CDE — Common Data Environment (ISO 19650)
                        {userRole && <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full uppercase">{userRole}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="bg-bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[320px] flex-1 max-w-[450px] shadow-sm">
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <select
                            value={selectedProjectId}
                            onChange={(e) => onProjectChange(e.target.value)}
                            className="flex-1 text-sm font-semibold text-txt-primary outline-none bg-transparent cursor-pointer truncate"
                        >
                            {projects.map(p => (
                                <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
                            ))}
                        </select>
                    </div>
                    <CDENotificationBell />
                    <button
                        onClick={onUpload}
                        disabled={!canUpload || isUploading}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap shadow-md shadow-primary-200/50 dark:shadow-none"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Nộp hồ sơ
                    </button>
                </div>
            </div>

            {!hideStats && (
                <div className="grid grid-cols-4 gap-4">
                    {statCards.map((stat, idx) => (
                        <StatCard
                            key={idx}
                            label={stat.label}
                            value={stat.value}
                            icon={<stat.icon className="w-5 h-5 flex-shrink-0" />}
                            color={stat.color}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CDEHeader;
