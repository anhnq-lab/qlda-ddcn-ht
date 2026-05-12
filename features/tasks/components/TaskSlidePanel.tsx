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
        { key: 'history', label: 'Lịch sử', icon: History },
    ];

    if (isLoading) return null;

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
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
                {activeTab === 'history' && (
                    <TaskCollaboration taskId={taskId} type="history" />
                )}
            </div>
        </div>
    );
};
