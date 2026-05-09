import React, { useState, useEffect, useMemo } from 'react';
import { Project } from '@/types';
import { GitBranch, Play, CheckCircle2, AlertCircle, Clock, FileText, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { WorkflowVisualizer, WorkflowNodeStatus } from '../workflow/WorkflowVisualizer';
import { ApprovalActions } from '../workflow/ApprovalActions';
import { useProjectWorkflow, WorkflowNode } from '../../hooks/useProjectWorkflow';
import { TaskStatus } from '@/types/task.types';
import { getInternalWorkflowTemplates } from '../../../workflows/data/seedInternalWorkflows';

interface ProjectWorkflowTabProps {
    projectID: string;
    project: Project;
}

export const ProjectWorkflowTab: React.FC<ProjectWorkflowTabProps> = ({ projectID, project }) => {
    const { addToast } = useToast();
    
    const { nodes, loading, isInitiailizing, initializeWorkflow, updateNodeStatus } = useProjectWorkflow(projectID);
    
    // Get templates
    const templates = useMemo(() => getInternalWorkflowTemplates(), []);
    
    const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>(templates[0]?.code);
    
    // UI state for approval modal
    const [selectedNode, setSelectedNode] = useState<WorkflowNodeStatus | null>(null);

    const handleRunProcess = () => {
        const templateToRun = templates.find(t => t.code === selectedTemplateCode);
        if (templateToRun) {
            initializeWorkflow(templateToRun);
        }
    };

    const handleActionComplete = async (actionType: 'submit' | 'approve' | 'reject', comment?: string, files?: File[]) => {
        if (!selectedNode) return;
        
        let newStatus: TaskStatus = TaskStatus.Review;
        if (actionType === 'approve') newStatus = TaskStatus.Done;
        if (actionType === 'reject') newStatus = TaskStatus.Todo; // Go back to pending

        await updateNodeStatus(selectedNode.id, newStatus, comment, files);
        setSelectedNode(null);
    };

    const groupedNodes = useMemo(() => {
        return nodes.reduce((acc, node) => {
            const tmpl = node.workflow_template || 'unk';
            if (!acc[tmpl]) acc[tmpl] = [];
            acc[tmpl].push(node);
            return acc;
        }, {} as Record<string, WorkflowNode[]>);
    }, [nodes]);

    return (
        <div className="space-y-4">
            <div className="bg-bg-surface rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div>
                        <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-primary-500" />
                            Quy trình Phê duyệt
                        </h2>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                            Quản lý tiến trình và các bước phê duyệt nội bộ của dự án
                        </p>
                    </div>
                    {nodes.length > 0 && (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select 
                                value={selectedTemplateCode}
                                onChange={(e) => setSelectedTemplateCode(e.target.value)}
                                className="flex-1 text-sm rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-primary-500 focus:border-primary-500 min-w-[200px]"
                            >
                                {templates.map(tmpl => (
                                    <option key={tmpl.code} value={tmpl.code}>{tmpl.name}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handleRunProcess}
                                disabled={isInitiailizing}
                                className="flex items-center justify-center gap-2 gradient-btn text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm whitespace-nowrap disabled:opacity-50"
                            >
                                <Play className="w-4 h-4" />
                                {isInitiailizing ? '...' : 'Khởi chạy'}
                            </button>
                        </div>
                    )}
                </div>

                {nodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                            <GitBranch className="w-8 h-8 text-gray-400 dark:text-slate-400" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Chưa chạy quy trình nào</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mb-6">
                            Dự án này chưa được gắn vào quy trình phê duyệt nào. Bạn vui lòng chọn mẫu quy trình bên dưới để khởi chạy.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                            <select 
                                value={selectedTemplateCode}
                                onChange={(e) => setSelectedTemplateCode(e.target.value)}
                                className="flex-1 w-full text-sm rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-primary-500 focus:border-primary-500 py-2"
                            >
                                {templates.map(tmpl => (
                                    <option key={tmpl.code} value={tmpl.code}>{tmpl.name}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handleRunProcess}
                                disabled={isInitiailizing}
                                className="flex items-center justify-center w-full sm:w-auto gap-2 gradient-btn text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:-translate-y-0.5 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play className="w-4 h-4" />
                                {isInitiailizing ? 'Đang tạo...' : 'Khởi chạy'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedNodes).map(([tmplCode, tmplNodes]) => {
                            const tmpl = templates.find(t => t.code === tmplCode);
                            return (
                                <div key={tmplCode} className="space-y-4">
                                    <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-slate-700 pb-2">Quy trình: {tmpl?.name || tmplCode}</h3>
                                    <WorkflowVisualizer 
                                        nodes={tmplNodes as WorkflowNodeStatus[]} 
                                        onActionClick={(node) => setSelectedNode(node)} 
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {selectedNode && (
                <ApprovalActions 
                    node={selectedNode} 
                    onClose={() => setSelectedNode(null)}
                    onComplete={handleActionComplete}
                />
            )}
        </div>
    );
};
