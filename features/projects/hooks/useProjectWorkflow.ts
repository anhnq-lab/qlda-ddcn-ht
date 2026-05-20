import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { v4 as uuidv4 } from 'uuid';
import { TaskStatus, TaskPriority } from '@/types/task.types';
import { WorkflowTemplate } from '../../workflows/data/seedWorkflows';

export interface WorkflowNode {
    id: string; // TaskID
    step_name: string; // Title
    status: 'pending' | 'in_progress' | 'review' | 'done'; // mapped from TaskStatus
    assignee: string; // mapped from Assignee name
    action_date?: string; // CreatedDate or updated
    sort_order: number;
    workflow_template: string; // Track which template this belongs to
}

export const useProjectWorkflow = (projectID: string) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [isInitiailizing, setIsInitializing] = useState(false);

    const fetchNodes = useCallback(async () => {
        if (!projectID) return;
        setLoading(true);
        try {
            // We assume tasks with a metadata property `workflow_template` are part of a workflow.
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', projectID)
                .not('metadata->workflow_template', 'is', null)
                .order('sort_order', { ascending: true });

            if (error) throw error;

            if (data) {
                const mapped: WorkflowNode[] = data.map((t: any) => ({
                    id: t.id,
                    step_name: t.title,
                    status: t.status === 'todo' ? 'pending' : t.status,
                    assignee: t.metadata?.assigneeName || t.metadata?.role || 'Admin',
                    sort_order: t.sort_order,
                    action_date: t.created_at ? new Date(t.created_at).toLocaleDateString() : undefined,
                    workflow_template: t.metadata?.workflow_template
                }));
                setNodes(mapped);
            }
        } catch (error) {
            console.error('Error fetching workflow nodes', error);
        } finally {
            setLoading(false);
        }
    }, [projectID]);

    useEffect(() => {
        fetchNodes();
    }, [fetchNodes]);

    const initializeWorkflow = async (template: WorkflowTemplate) => {
        if (!projectID || !template) return;
        setIsInitializing(true);
        try {
            // First check if already initialized for this specific template
            const { count } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', projectID)
                .eq('metadata->>workflow_template', template.code);
            
            if (count && count > 0) {
                addToast({ title: 'Lỗi', message: 'Dự án đã tồn tại quy trình này.', type: 'error' });
                return;
            }

            const workflowID = uuidv4();

            const tasksToInsert = template.steps.map((step, index) => ({
                id: uuidv4(),
                project_id: projectID,
                workflow_id: workflowID,
                title: step.name,
                task_type: 'project',
                status: index === 0 ? 'in_progress' : 'todo',
                priority: 'medium',
                sort_order: index,
                assignee_id: '00000000-0000-0000-0000-000000000000', // System default mask
                metadata: { 
                    workflow_template: template.code,
                    assigneeName: step.role,
                    role: step.role,
                    phase: step.metadata?.phase,
                },
                due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
            }));

            const { error } = await supabase.from('tasks').insert(tasksToInsert as any);
            if (error) throw error;
            
            addToast({ title: 'Thành công', message: `Tạo quy trình ${template.name} thành công`, type: 'success' });
            await fetchNodes();
        } catch (error) {
            console.error('Init workflow error', error);
            addToast({ title: 'Lỗi', message: 'Không thể khởi tạo quy trình', type: 'error' });
        } finally {
            setIsInitializing(false);
        }
    };

    const updateNodeStatus = async (taskID: string, newStatus: TaskStatus, comment?: string, files?: File[]) => {
        try {
            const updatePayload: any = { status: newStatus };
            if (comment) {
                updatePayload.description = comment;
            }
            const uploadedFiles = [];
            if (files && files.length > 0) {
                for (const file of files) {
                    const filePath = `workflow_attachments/${taskID}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
                    const { data, error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, { upsert: true });
                    
                    if (uploadError) {
                        console.error('Lỗi upload file:', uploadError);
                        addToast({ title: 'Lỗi', message: `Không thể tải lên tài liệu ${file.name}`, type: 'error' });
                        continue;
                    }
                    
                    if (data) {
                        const { data: publicData } = supabase.storage.from('documents').getPublicUrl(filePath);
                        uploadedFiles.push({
                            id: crypto.randomUUID(),
                            name: file.name,
                            url: publicData?.publicUrl || '',
                            size: file.size,
                            uploadDate: new Date().toISOString(),
                            type: 'uploaded'
                        });
                    }
                }
            }
            
            if (uploadedFiles.length > 0) {
                // Chúng ta sẽ lưu file vào mảng attachments hoặc metadata.attachments
                (updatePayload as any).metadata = {
                    ...((nodes.find(n => n.id === taskID) as any)?.metadata || {}),
                    attached_files: uploadedFiles
                };
            }

            const { error } = await (supabase as any)
                .from('tasks')
                .update(updatePayload)
                .eq('id', taskID);
                
            if (error) throw error;

            // Simple auto-advance for the demo using next sorting task
            if (newStatus === 'done') {
                const currentNodeInfo = nodes.find(n => n.id === taskID);
                if (currentNodeInfo) {
                    const nextNode = nodes.find(n => n.sort_order === currentNodeInfo.sort_order + 1 && n.workflow_template === currentNodeInfo.workflow_template);
                    if (nextNode && nextNode.status === 'pending') {
                        await (supabase as any)
                            .from('tasks')
                            .update({ status: 'in_progress' })
                            .eq('id', nextNode.id);
                    }
                }
            }

            await fetchNodes();
        } catch (error) {
            console.error('Update workflow status error', error);
            addToast({ title: 'Lỗi', message: 'Không thể cập nhật bước này', type: 'error' });
        }
    };

    return {
        nodes,
        loading,
        isInitiailizing,
        initializeWorkflow,
        updateNodeStatus
    };
};

