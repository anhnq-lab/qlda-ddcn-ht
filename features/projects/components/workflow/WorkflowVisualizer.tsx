import React from 'react';
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react';

export interface WorkflowNodeStatus {
    id: string;
    step_name: string;
    status: 'pending' | 'in_progress' | 'review' | 'done';
    assignee: string;
    action_date?: string;
}

interface WorkflowVisualizerProps {
    nodes: WorkflowNodeStatus[];
    onActionClick: (node: WorkflowNodeStatus) => void;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ nodes, onActionClick }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 mt-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-6">Trạng thái Quy trình</h3>
            
            <div className="relative border-l-2 border-gray-100 dark:border-slate-700 ml-4 pb-4">
                {nodes.map((node, index) => {
                    const isDone = node.status === 'done';
                    const isActive = node.status === 'in_progress' || node.status === 'review';
                    const isPending = node.status === 'pending';
                    
                    return (
                        <div key={node.id} className="mb-8 relative pl-6">
                            {/* Marker */}
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-800 ${
                                isDone ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/50' : 
                                isActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50' : 
                                'border-gray-300 dark:border-slate-600'
                            }`}>
                                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute -top-[2px] -left-[2px]" />}
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 absolute top-1 left-1" />}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div>
                                    <h4 className={`text-sm font-bold ${
                                        isDone ? 'text-gray-900 dark:text-white' : 
                                        isActive ? 'text-primary-700 dark:text-primary-400' : 
                                        'text-gray-500 dark:text-slate-400'
                                    }`}>
                                        Bước {index + 1}: {node.step_name}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1 font-medium bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-gray-600 dark:text-slate-300">
                                            Phụ trách: {node.assignee}
                                        </span>
                                        {node.action_date && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {node.action_date}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {isActive && (
                                    <button 
                                        onClick={() => onActionClick(node)}
                                        className="shrink-0 btn-base btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                                    >
                                        <PlayCircle className="w-3.5 h-3.5" />
                                        Xử lý bước này
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
