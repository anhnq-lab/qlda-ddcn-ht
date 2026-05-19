import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { FileText, LayoutList, Clock, Shield, BookOpen, AlertCircle, Users, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import type { Workflow, WorkflowNode } from '../../../types/workflow.types';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import DesignFormRenderer from './DesignFormRenderer';
import { isDesignWorkflow } from '../constants/designWorkflowStates';

const renderSimpleMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
        // Handle bold: **text** -> <strong>text</strong>
        let htmlLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Handle italic: *text* -> <em>text</em>
        htmlLine = htmlLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        if (htmlLine.startsWith('- ')) {
            return <li key={idx} className="ml-4 list-disc marker:text-primary-400" dangerouslySetInnerHTML={{ __html: htmlLine.substring(2) }} />;
        }
        if (htmlLine.startsWith('  - ')) {
            return <li key={idx} className="ml-8 list-[circle] marker:text-slate-400" dangerouslySetInnerHTML={{ __html: htmlLine.substring(4) }} />;
        }
        return <p key={idx} className="mb-2" dangerouslySetInnerHTML={{ __html: htmlLine }} />;
    });
};

interface InternalWorkflowViewerPanelProps {
    workflowId: string;
    onClose: () => void;
}

const InternalWorkflowViewerPanel: React.FC<InternalWorkflowViewerPanelProps> = ({ workflowId, onClose }) => {
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedForms, setExpandedForms] = useState<Record<string, boolean>>({});
    const { closePanel } = useSlidePanel();

    const toggleForm = (nodeId: string) => {
        setExpandedForms(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [wfRes, nodesRes] = await Promise.all([
                    supabase.from('workflows').select('*').eq('id', workflowId).single(),
                    supabase.from('workflow_nodes').select('*').eq('workflow_id', workflowId).or('is_deleted.eq.false,is_deleted.is.null').order('sort_order', { ascending: true }).order('created_at', { ascending: true })
                ]);
                if (!wfRes.error) setWorkflow(wfRes.data as any);
                if (!nodesRes.error) setNodes((nodesRes.data || []) as any);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [workflowId]);

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-800 p-4 pt-16">
                <div className="animate-pulse space-y-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-slate-200 rounded" />)}
                </div>
            </div>
        );
    }

    if (!workflow) return null;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative">
            <div className="px-6 py-8 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <BookOpen size={120} />
                </div>
                <div className="relative z-10 flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-md">Quy trình nội bộ</span>
                            <span className="text-xs font-mono text-slate-500">{workflow.code}</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight font-display mb-3">
                            {workflow.name}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                            {workflow.description || 'Chưa có mô tả quy trình.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-12 pb-20">
                    <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                            <LayoutList size={16} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                            Chi tiết luồng thực hiện ({nodes.length} bước)
                        </h3>
                    </div>

                    <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-10">
                        {nodes.map((node, index) => {
                            const meta = (node.metadata as any) || {};
                            const guidelines = meta.guidelines || meta.description;
                            const subTasks = meta.sub_tasks || [];

                            return (
                                <div key={node.id} className="relative pl-8">
                                    <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-4 border-primary-500 shadow-sm flex items-center justify-center font-bold text-primary-600 text-xs">
                                        {index + 1}
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                                            <h4 className="text-[17px] font-bold text-primary-700 dark:text-primary-400 mb-3">{node.name}</h4>
                                            
                                            <div className="flex flex-wrap gap-4 text-sm mt-3">
                                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                    <Users size={15} className="text-blue-500" />
                                                    <span className="font-semibold">{node.assignee_role || 'Chưa phân công'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                    <Clock size={15} className="text-warning-500" />
                                                    <span className="font-semibold">Thời gian: {node.sla_formula || (meta.sla ? meta.sla : 'Theo hợp đồng')}</span>
                                                </div>
                                                {meta.phase && (
                                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                        <Shield size={15} className="text-emerald-500" />
                                                        <span className="font-semibold capitalize">Giai đoạn: {meta.phase}</span>
                                                    </div>
                                                )}
                                                {meta.form_code && (
                                                    <button
                                                        onClick={() => toggleForm(node.id)}
                                                        className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
                                                    >
                                                        <ClipboardList size={15} />
                                                        <span>{meta.form_code}</span>
                                                        {expandedForms[node.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-6">
                                            {guidelines && (
                                                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none 
                                                    prose-headings:font-bold prose-headings:text-slate-800 dark:prose-headings:text-slate-100
                                                    prose-p:text-slate-600 dark:prose-p:text-slate-300
                                                    prose-a:text-primary-600 prose-li:my-0.5">
                                                    {renderSimpleMarkdown(guidelines)}
                                                </div>
                                            )}

                                            {subTasks && subTasks.length > 0 && (
                                                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <AlertCircle size={14} /> Danh sách công việc con
                                                    </h5>
                                                    <ul className="space-y-2">
                                                        {subTasks.map((st: any, idx: number) => (
                                                            <li key={idx} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                                                                <span className="text-primary-500 font-mono mt-0.5">{index + 1}.{idx + 1}</span>
                                                                <div>
                                                                    <p className="font-medium">{st.name}</p>
                                                                    <p className="text-xs text-slate-500 mt-0.5">Thực hiện: {st.assignee_role}</p>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Biểu mẫu inline */}
                                            {meta.form_code && expandedForms[node.id] && (
                                                <div className="mt-3">
                                                    <DesignFormRenderer
                                                        formCode={meta.form_code}
                                                        readOnly={false}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternalWorkflowViewerPanel;
