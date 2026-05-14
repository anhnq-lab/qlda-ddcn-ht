import React, { useState } from 'react';
import { useTask } from '../../../hooks/useTasks';
import TaskDetail from '../TaskDetail';
import { TaskCollaboration } from './TaskCollaboration';
import { X, CheckSquare, MessageSquare, History } from 'lucide-react';

interface TaskSlidePanelProps {
    taskId: string;
    onClose: () => void;
}

type TabKey = 'overview' | 'comments' | 'history';

export const TaskSlidePanel: React.FC<TaskSlidePanelProps> = ({ taskId, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const { data: task, isLoading } = useTask(taskId);

    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: 'overview', label: 'Tổng quan', icon: CheckSquare },
        { key: 'comments', label: 'Bình luận', icon: MessageSquare },
        { key: 'history', label: 'Lịch sử', icon: History },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 p-6 space-y-4 animate-pulse">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-8"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Không tìm thấy công việc</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Công việc này có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
                <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors">
                    Đóng panel
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-">
            {/* ═══ TABS ═══ */}
            <div className="px-5 border-b border-gray-200 dark:border-slate-700 flex gap-2 shrink-0 bg-white dark:bg-slate-900 shadow-sm z-10 relative">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-3.5 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${
                            activeTab === tab.key
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.key ? 'animate-pulse' : ''}`} />
                        {tab.label}
                        {activeTab === tab.key && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* ═══ CONTENT ═══ */}
            <div className="flex-1 overflow-y-auto relative">
                {activeTab === 'overview' && (
                    <TaskDetail taskId={taskId} isPanel={true} onClose={onClose} />
                )}
                {activeTab === 'comments' && (
                    <div className="p-4 md:p-6 h-full">
                        <TaskCollaboration taskId={taskId} type="comments" />
                    </div>
                )}
                {activeTab === 'history' && (
                    <div className="p-4 md:p-6 h-full">
                        <TaskCollaboration taskId={taskId} type="history" />
                    </div>
                )}
            </div>
        </div>
    );
};
