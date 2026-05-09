import React, { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority, Employee, ProjectGroup, Project } from '@/types';
import {
    Layers, CheckCircle2, Circle, Clock, ChevronDown, ChevronRight,
    FileText, AlertCircle, Plus, Calendar, User, Flag, Zap, Building2, Scale, Info, ExternalLink, ListPlus, Paperclip, Upload, X, Trash2
} from 'lucide-react';
import { ProjectGanttChart } from '../ProjectGanttChart';
import { ProjectTaskModal } from '../ProjectTaskModal';
import { PlanStatisticsHeader } from '../PlanStatisticsHeader';
import { PhaseProgressCard } from '../PhaseProgressCard';
import { MilestoneTimeline } from '../MilestoneTimeline';
import { TaskFilterBar, TaskFilter, TaskViewMode } from '../TaskFilterBar';
import { KanbanBoardView } from '../KanbanBoardView';
import { ResourceAllocationView } from '../ResourceAllocationView';
import { ProgressBadge } from '../ProgressSlider';
import { ProjectPlanWBSView } from './ProjectPlanWBSView';
import { TaskService } from '@/services/TaskService';
import type { DbTask } from '@/services/TaskService';
import { useSlidePanel } from '@/context/SlidePanelContext';
import { supabase } from '@/lib/supabase';
import { findByStepCode, buildTT24Key } from '@/utils/docStepMapping';
import { LegalReferenceLink } from '@/components/common/LegalReferenceLink';
import { useWorkflowPhases } from '../../hooks/useWorkflowPhases';
import type { PhaseItem } from '../../hooks/useWorkflowPhases';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { useStepAggregates } from '../../hooks/useStepAggregates';
import { usePlanPersist } from '../../hooks/usePlanPersist';
import { taskKeys } from '@/hooks/useWorkflowTasks';
import { PlanDateRangeModal, PlanDateRange } from '../PlanDateRangeModal';
import { StepDetailModal } from '../StepDetailModal';


interface ProjectPlanTabProps {
    workflowTasks: DbTask[] | any[];
    projectID?: string;
    onSaveTask?: (task: Task) => void;
    employees?: Employee[];
    currentUserId?: string;
    groupCode?: ProjectGroup;
    isODA?: boolean;
    project?: Project | null;
}

// getProjectPhases and getGroupLabel imported from @/utils/projectPhases

// ── Plan trigger type for date range modal ──
type PlanTrigger =
    | { type: 'all' }
    | { type: 'phase'; phaseId: string }
    | { type: 'step'; stepCode: string; stepTitle: string };

export const ProjectPlanTab: React.FC<ProjectPlanTabProps> = ({
    workflowTasks,
    projectID,
    onSaveTask,
    employees = [],
    currentUserId,
    groupCode = ProjectGroup.C,
    isODA = false,
    project,
}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // Dynamic phases from DB workflow templates
    const { phases: DECREE_175_PHASES, getGroupLabel, isLoading: isLoadingPhases } = useWorkflowPhases(groupCode, project);

    // Employee name lookup map
    const employeeNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        employees.forEach(e => { map[e.EmployeeID] = e.FullName; });
        return map;
    }, [employees]);

    // Helper: Map WorkflowTask to Task
    const mappedTasks = useMemo<Task[]>(() => {
        return workflowTasks.map((wt: any) => {
            // If already a Task object from useProjectTasks
            if (wt.TaskID) return wt as Task;

            const phase = wt.workflow_nodes?.metadata?.phase || wt.metadata?.phase || wt.metadata?.groupCode || 'KH';
            let mappedStatus = TaskStatus.Todo;
            if (wt.status === 'in_progress') mappedStatus = TaskStatus.InProgress;
            else if (wt.status === 'completed') mappedStatus = TaskStatus.Done;
            // Note: If overdue state exists in your legacy Tasks, map it here, otherwise keep as Todo or InProgress.
            else if (wt.status === 'overdue') mappedStatus = TaskStatus.InProgress;
            
            // Restore exact UI status if saved in metadata
            if (wt.metadata?.ui_status) {
                mappedStatus = wt.metadata.ui_status;
            }
            
            return {
                TaskID: wt.id,
                ProjectID: projectID || '',
                Title: wt.name || 'Untitled Task',
                Description: wt.comments || wt.metadata?.description || '',
                Status: mappedStatus,
                Priority: TaskPriority.Medium,
                StartDate: wt.start_date || wt.created_at,
                DueDate: wt.due_date || undefined,
                AssigneeID: wt.assignee_id || wt.metadata?.assignee_role || '',
                TimelineStep: wt.node_id || '',
                StepCode: wt.node_id || '',
                LegalBasis: wt.workflow_nodes?.metadata?.legalBasis || '',
                DurationDays: wt.metadata?.estimatedDays || 10,
                ActualStartDate: wt.metadata?.actualStartDate || wt.started_at,
                ActualEndDate: wt.metadata?.actualEndDate || wt.completed_at,
                ProgressPercent: wt.progress || 0,
                Phase: phase,
                SubTasks: wt.metadata?.sub_tasks || [],
                Attachments: wt.metadata?.attachments || [],
                Dependencies: wt.metadata?.dependencies || [],
                EstimatedCost: wt.metadata?.estimated_cost,
                ActualCost: wt.metadata?.actual_cost,
            } as Task;
        });
    }, [workflowTasks, projectID]);

    // 1. Local Tasks State (Optimistic UI)
    const [tasks, setTasks] = useState<Task[]>(mappedTasks);

    // Sync from props
    useEffect(() => {
        setTasks(mappedTasks);
    }, [mappedTasks]);

    // UI State — persisted to localStorage per project
    const { currentView, currentFilter, setView: setCurrentView, setFilter: setCurrentFilter } = usePlanPersist(projectID);
    const [searchQuery, setSearchQuery] = useState('');

    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
    
    // Subtask expansion state
    const [expandedMasterTasks, setExpandedMasterTasks] = useState<Record<string, boolean>>({});
    const toggleMasterTask = (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        setExpandedMasterTasks(p => ({ ...p, [taskId]: !p[taskId] }));
    };

    // Auto-expand logic: runs when phases load from DB
    useEffect(() => {
        if (DECREE_175_PHASES.length === 0) return;
        const initial: Record<string, boolean> = {};
        const phases = DECREE_175_PHASES;
        const today = new Date(); today.setHours(0, 0, 0, 0);

        phases.forEach(phase => {
            const phaseTasks = mappedTasks.filter(t =>
                phase.items.some(item => item.code === t.TimelineStep)
            );
            if (phaseTasks.length === 0) {
                initial[phase.id] = false;
                return;
            }
            const allDone = phaseTasks.every(t => t.Status === TaskStatus.Done);
            if (allDone) {
                initial[phase.id] = false;
                return;
            }
            const hasActive = phaseTasks.some(t =>
                t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review
            );
            const hasOverdue = phaseTasks.some(t => {
                if (t.Status === TaskStatus.Done || !t.DueDate) return false;
                const d = new Date(t.DueDate); d.setHours(0, 0, 0, 0);
                return d < today;
            });
            initial[phase.id] = hasActive || hasOverdue;
        });
        if (!Object.values(initial).some(v => v) && phases.length > 0) {
            const first = phases.find(p => {
                const pt = mappedTasks.filter(t => p.items.some(i => i.code === t.TimelineStep));
                return pt.length === 0 || !pt.every(t => t.Status === TaskStatus.Done);
            });
            if (first) initial[first.id] = true;
            else initial[phases[0].id] = true;
        }
        setExpandedPhases(initial);
    }, [DECREE_175_PHASES]); // Re-run when phases load from DB
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedStep, setSelectedStep] = useState<{ name: string; code: string } | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [bulkCreatingAll, setBulkCreatingAll] = useState(false);
    const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});
    const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [pendingUploadTaskId, setPendingUploadTaskId] = useState<string | null>(null);

    // ── Date Range Modal State ──
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [planModalLoading, setPlanModalLoading] = useState(false);
    const [planTrigger, setPlanTrigger] = useState<PlanTrigger | null>(null);
    const [planModalTitle, setPlanModalTitle] = useState('');
    const [planModalDesc, setPlanModalDesc] = useState('');
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

    // ── Step Detail Modal State ──
    const [stepDetailOpen, setStepDetailOpen] = useState(false);
    const [stepDetailItem, setStepDetailItem] = useState<PhaseItem | null>(null);
    const [stepDetailAgg, setStepDetailAgg] = useState<any>(null);
    const handleStepClick = (item: PhaseItem, agg: any) => {
        setStepDetailItem(item);
        setStepDetailAgg(agg);
        setStepDetailOpen(true);
    };

    // Slide Panel context
    const { openPanel, closePanel } = useSlidePanel();

    // Toast notifications
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Load attachment counts from documents table
    useEffect(() => {
        if (!projectID) return;
        const loadCounts = async () => {
            const taskIds = tasks.map(t => t.TaskID);
            if (taskIds.length === 0) return;
            const { data } = await (supabase as any)
                .from('documents')
                .select('task_id')
                .eq('source', 'task')
                .in('task_id', taskIds);
            if (data) {
                const counts: Record<string, number> = {};
                (data as any[]).forEach((row: { task_id: string }) => {
                    counts[row.task_id] = (counts[row.task_id] || 0) + 1;
                });
                setAttachmentCounts(counts);
            }
        };
        loadCounts();
    }, [tasks, projectID]);

    // Handle file upload for task → saves to documents table with cross-reference
    const handleFileUpload = async (taskId: string, file: File) => {
        setUploadingTaskId(taskId);
        try {
            const ext = file.name.split('.').pop();
            const path = `${projectID}/${taskId}/${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(path, file);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(path);

            // Find the task to get step_code and title for cross-referencing
            const task = tasks.find(t => t.TaskID === taskId);
            const stepCode = (task as any)?.StepCode || (task as any)?.step_code || task?.TimelineStep || '';
            const crossRef = stepCode ? findByStepCode(stepCode) : undefined;

            // Build enriched doc name for keyword matching in Hồ sơ tab
            const docName = task?.Title
                ? `${task.Title} - ${file.name}`
                : file.name;

            // Build tt24_field for TT24 cross-reference
            const tt24Field = crossRef?.tt24Stt
                ? buildTT24Key(crossRef.tt24Stt, crossRef.tt24Label)
                : undefined;

            // Insert into unified documents table with cross-reference fields
            await (supabase.from('documents') as any).insert({
                project_id: projectID,
                task_id: taskId,
                doc_name: docName,
                storage_path: urlData.publicUrl,
                size: `${(file.size / 1024).toFixed(0)} KB`,
                category: 0,
                source: 'task',
                is_digitized: true,
                ...(tt24Field && { tt24_field: tt24Field }),
            });

            setAttachmentCounts(prev => ({ ...prev, [taskId]: (prev[taskId] || 0) + 1 }));
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploadingTaskId(null);
        }
    };

    // 2. Filter Tasks + Counts (extracted to hook)
    const { filteredTasks, taskCounts } = useTaskFilters(tasks, currentFilter, searchQuery, currentUserId);

    // 4. Compute Parent Item Status & Dates (extracted to hook)
    const stepAggregates = useStepAggregates(filteredTasks, DECREE_175_PHASES);

    // 5. Prepare Gantt Data (Parents Only)
    const ganttTasks = useMemo(() => {
        const allItems = DECREE_175_PHASES.flatMap(p => p.items);
        return allItems
            .map(item => {
                const agg = stepAggregates.get(item.code);
                if (!agg || !agg.startDate || !agg.dueDate) return null;

                return {
                    TaskID: item.code,
                    Title: `${item.id}. ${item.title}`,
                    TaskType: 'project',
                    StartDate: agg.startDate,
                    DueDate: agg.dueDate,
                    Status: agg.status,
                    Priority: TaskPriority.Medium,
                    Description: 'Tổng hợp từ các công việc con',
                    AssigneeID: '',
                    TimelineStep: item.code,
                    ProjectID: projectID || 'SYNTHETIC',
                    ProgressPercent: agg.progress
                } as Task;
            })
            .filter((t): t is Task => t !== null);
    }, [stepAggregates, projectID]);

    // 6. Compute Milestone Dates for Timeline
    const milestoneData = useMemo(() => {
        const getCompletionDate = (code: string): string | undefined => {
            const allStepTasks = tasks.filter(t => t.TimelineStep === code || t.StepCode === code);
            if (allStepTasks.length === 0) return undefined;
            // ALL tasks in this step must be Done for the milestone to be considered complete
            const allDone = allStepTasks.every(t => t.Status === TaskStatus.Done);
            if (!allDone) return undefined;
            const dates = allStepTasks.map(t => new Date(t.DueDate).getTime()).filter(d => !isNaN(d));
            if (dates.length === 0) return undefined;
            return new Date(Math.max(...dates)).toISOString().split('T')[0];
        };

        return {
            policyApprovalDate: getCompletionDate('PREP_POLICY'),
            projectApprovalDate: getCompletionDate('PREP_DECISION'),
            constructionDesignDate: getCompletionDate('IMPL_DESIGN'),
            groundbreakingDate: getCompletionDate('IMPL_CONSTRUCTION'),
            completionDate: getCompletionDate('IMPL_ACCEPTANCE'),
            handoverDate: getCompletionDate('CLOSE_HANDOVER')
        };
    }, [tasks]);

    // Handlers
    const togglePhase = (id: string) => setExpandedPhases(prev => ({ ...prev, [id]: !prev[id] }));

    const handleAddTask = (stepName?: string, stepCode?: string) => {
        if (stepName && stepCode) {
            setSelectedStep({ name: stepName, code: stepCode });
        } else {
            setSelectedStep(null);
        }
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    const handleQuickStatusChange = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        const statusCycle: Record<TaskStatus, TaskStatus> = {
            [TaskStatus.Todo]: TaskStatus.InProgress,
            [TaskStatus.InProgress]: TaskStatus.Review,
            [TaskStatus.Review]: TaskStatus.Done,
            [TaskStatus.Done]: TaskStatus.Todo
        };
        const newStatus = statusCycle[task.Status] || TaskStatus.InProgress;
        // Auto-sync progress with status
        let newProgress = task.ProgressPercent || 0;
        if (newStatus === TaskStatus.Done) newProgress = 100;
        else if (newStatus === TaskStatus.Review && newProgress < 100) newProgress = 100;
        else if (newStatus === TaskStatus.InProgress && newProgress === 0) newProgress = 25;
        else if (newStatus === TaskStatus.Todo) newProgress = 0;

        // ── AUTO-FILL actual dates ──
        const now = new Date().toISOString();
        let actualStart = task.ActualStartDate || '';
        let actualEnd = task.ActualEndDate || '';

        if (newStatus === TaskStatus.InProgress && !actualStart) {
            actualStart = now; // Bắt đầu thực hiện → ghi ngày bắt đầu thực tế
        }
        if (newStatus === TaskStatus.Done) {
            if (!actualStart) actualStart = now;
            if (!actualEnd) actualEnd = now; // Hoàn thành → ghi ngày kết thúc thực tế
        }
        if (newStatus === TaskStatus.Todo) {
            actualStart = ''; // Reset khi quay về chưa bắt đầu
            actualEnd = '';
        }

        handleSaveTask({
            ...task,
            Status: newStatus,
            ProgressPercent: newProgress,
            ActualStartDate: actualStart,
            ActualEndDate: actualEnd,
        } as any);
    };

    const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
        const task = tasks.find(t => t.TaskID === taskId);
        if (task) {
            const now = new Date().toISOString();
            let actualStart = task.ActualStartDate || '';
            let actualEnd = task.ActualEndDate || '';
            let newProgress = task.ProgressPercent || 0;

            if (newStatus === TaskStatus.InProgress && !actualStart) actualStart = now;
            if (newStatus === TaskStatus.InProgress && newProgress === 0) newProgress = 25;
            if (newStatus === TaskStatus.Done) {
                if (!actualStart) actualStart = now;
                if (!actualEnd) actualEnd = now;
                newProgress = 100;
            }
            if (newStatus === TaskStatus.Todo) {
                actualStart = '';
                actualEnd = '';
                newProgress = 0;
            }

            handleSaveTask({
                ...task,
                Status: newStatus,
                ProgressPercent: newProgress,
                ActualStartDate: actualStart,
                ActualEndDate: actualEnd,
            } as any);
        }
    };

    const handleEditTask = (task: Task) => {
        // Đóng Step Modal nếu đang mở để tránh ghi đè z-index với Slide Panel
        setStepDetailOpen(false);
        
        openPanel({
            title: task.Title,
            icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
            url: `/tasks/${task.TaskID}`,
            component: (
                <ProjectTaskModal
                    isOpen={true}
                    onClose={() => {/* panel close handled by SlidePanelContext */}}
                    onSubmit={handleSaveTask}
                    initialData={{ ...task }}
                    allTasks={tasks}
                    asSlidePanel={true}
                />
            ),
        });
    };

    const handleUpdateStepMeta = (stepCode: string, updates: { assigneeRole?: string }) => {
        const masterTask = tasks.find(t => t.TimelineStep === stepCode && !t.ParentID);
        if (masterTask) {
             handleSaveTask({
                 ...masterTask,
                 AssigneeID: updates.assigneeRole || masterTask.AssigneeID,
             } as any);
        }
    };
    const handleSaveTask = async (taskData: Partial<Task>) => {
        // ── Auto-derive status from progress ──
        const progress = taskData.ProgressPercent ?? (taskData as any).Progress ?? 0;
        
        // ── Map back to DbTask schema ──
        let mappedDbStatus = 'todo';
        switch (taskData.Status) {
            case TaskStatus.Todo: mappedDbStatus = 'todo'; break;
            case TaskStatus.InProgress: mappedDbStatus = 'in_progress'; break;
            case TaskStatus.Review: mappedDbStatus = 'review'; break; 
            case TaskStatus.Done: mappedDbStatus = 'done'; break;
            default: mappedDbStatus = 'todo';
        }

        const dbTaskData: any = {
            id: taskData.TaskID && !taskData.TaskID.startsWith('NEW_') ? taskData.TaskID : undefined,
            title: taskData.Title,
            description: taskData.Description,
            status: mappedDbStatus,
            progress: progress,
            priority: (taskData.Priority || 'medium').toLowerCase(),
            start_date: taskData.StartDate,
            due_date: taskData.DueDate,
            actual_start_date: taskData.ActualStartDate,
            actual_end_date: taskData.ActualEndDate,
            assignee_id: (taskData.AssigneeID && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskData.AssigneeID)) ? taskData.AssigneeID : currentUserId,
            project_id: projectID,
            task_type: 'project',
            workflow_node_id: taskData.TimelineStep || taskData.StepCode || selectedStep?.code || null,
            step_code: taskData.TimelineStep || taskData.StepCode || selectedStep?.code || null,
            predecessor_task_id: taskData.PredecessorTaskID || null,
            estimated_cost: (taskData as any).EstimatedCost || null,
            actual_cost: (taskData as any).ActualCost || null,
            duration_days: taskData.DurationDays || null,
            metadata: {
                ui_status: taskData.Status,
                assignee_role: taskData.AssigneeID && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskData.AssigneeID) ? taskData.AssigneeID : undefined,
                sub_tasks: taskData.SubTasks,
                attachments: taskData.Attachments,
                dependencies: taskData.Dependencies,
            }
        };

        // Nếu là task mới được tạo từ nút "Thêm công việc" trong một Step
        if (!dbTaskData.id && selectedStep) {
            dbTaskData.task_type = 'project';
        }

        try {
            const savedTask = await TaskService.saveTask(dbTaskData);

            // ── Auto-propagate ActualEndDate → next task's ActualStartDate ──
            if (savedTask.actual_end_date) {
                const successorTasks = tasks.filter(t => t.PredecessorTaskID === savedTask.id && !t.ActualStartDate);
                for (const successor of successorTasks) {
                    await TaskService.updateTask(successor.TaskID, {
                        actual_start_date: savedTask.actual_end_date
                    } as any);
                }
            }

            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2', projectID] });
            queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2'] });
            
            const isNew = !taskData.TaskID || taskData.TaskID.startsWith('NEW_');
            showToast(isNew ? `✅ Tạo công việc "${savedTask.title}" thành công` : `💾 Đã lưu thay đổi "${savedTask.title}"`, 'success');
        } catch (err: any) {
            console.error('Failed to save task:', err);
            showToast(`❌ Lỗi: ${err.message || 'Không thể lưu công việc'}`, 'error');
        }

        setIsTaskModalOpen(false);
        closePanel(); // Automatically close slide panel on successful save
    };

    // ── Bulk create ALL tasks via Workflow Engine (Phương án 1) ──
    const handleBulkCreateAll = async (dateRange: PlanDateRange, workflowId: string) => {
        if (!projectID) return;
        setBulkCreatingAll(true);
        try {
            await TaskService.createTasksFromWorkflow(
                projectID,
                workflowId,
                dateRange.startDate
            );
            
            showToast(`✅ Đã thiết lập kế hoạch dựa trên quy trình mẫu`, 'success');
            // We fetch tasks directly from workflow_tasks based on this new instance
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2', projectID] });
            queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2'] });
        } catch (error) {
            console.error('Failed to bulk create framework tasks:', error);
            showToast('❌ Tạo kế hoạch thất bại', 'error');
        } finally {
            setBulkCreatingAll(false);
        }
    };

    // ── Open Date Range Modal (intercept triggers) ──
    const openPlanModal = (trigger: PlanTrigger, title: string, desc: string) => {
        setPlanTrigger(trigger);
        setPlanModalTitle(title);
        setPlanModalDesc(desc);
        setPlanModalOpen(true);
    };

    const handlePlanModalConfirm = async (range: PlanDateRange, workflowId?: string) => {
        if (!planTrigger) return;
        setPlanModalLoading(true);
        try {
            if (planTrigger.type === 'all') {
                if (!workflowId) {
                    showToast('❌ Vui lòng chọn quy trình', 'error');
                    return;
                }
                await handleBulkCreateAll(range, workflowId);
            } else {
                showToast('❌ Vui lòng lập kế hoạch từ cấp độ dự án đối với kiến trúc Workflow', 'error');
            }
            setPlanModalOpen(false);
        } finally {
            setPlanModalLoading(false);
        }
    };

    // ── Delete single task ──
    const handleDeleteTask = async (e: React.MouseEvent, taskId: string, taskTitle: string) => {
        e.stopPropagation();
        if (!confirm(`Xóa công việc "${taskTitle}"?`)) return;
        setDeletingTaskId(taskId);
        try {
            await TaskService.deleteTask(taskId);
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2', projectID] });
            queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2'] });
            showToast(`🗑️ Đã xóa "${taskTitle}"`, 'info');
        } catch (err) {
            console.error('Failed to delete task:', err);
            showToast('❌ Xóa thất bại', 'error');
        } finally {
            setDeletingTaskId(null);
        }
    };

    // ── Delete ALL tasks for current project ──
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [deleteConfirmStep, setDeleteConfirmStep] = useState<0 | 1>(0); // 0=idle, 1=confirming

    // Auto-reset confirm step after 3 seconds
    useEffect(() => {
        if (deleteConfirmStep === 1) {
            const timer = setTimeout(() => setDeleteConfirmStep(0), 3000);
            return () => clearTimeout(timer);
        }
    }, [deleteConfirmStep]);

    const handleDeleteAllTasks = async () => {
        if (!projectID) return;

        // Step 1: First click → show confirm state
        if (deleteConfirmStep === 0) {
            setDeleteConfirmStep(1);
            return;
        }

        // Step 2: Second click → actually delete
        setDeleteConfirmStep(0);
        setIsDeletingAll(true);
        try {
            // Xóa tất cả tasks của dự án này từ bảng tasks thống nhất
            await TaskService.deleteProjectTasks(projectID);

            console.log(`✅ Đã xoá toàn bộ kế hoạch cho dự án ${projectID}`);
            setTasks([]); // Xóa local state
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2', projectID] });
            queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2'] });
        } catch (err: any) {
            console.error('Failed to delete all tasks:', err);
            showToast(`❌ Lỗi khi xóa: ${err?.message || 'Không xác định'}`, 'error');
        } finally {
            setIsDeletingAll(false);
        }
    };

    // Removed Phase Bulk creation since it's now handled by Master Workflow engine

    // Priority color helper
    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'High': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700';
            case 'Medium': return 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700';
            case 'Low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
            default: return 'text-gray-600 dark:text-gray-400 bg-[#F5EFE6] dark:bg-slate-700 border-gray-200 dark:border-slate-600';
        }
    };

    // Check if task is overdue
    const isOverdue = (task: Task) => {
        if (task.Status === TaskStatus.Done) return false;
        if (!task.DueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.DueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    };


    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-6 py-4">

            {/* 1. Statistics Header — click card to filter */}
            <PlanStatisticsHeader tasks={tasks} onFilterChange={setCurrentFilter} />

            {/* 1.5 Smart Alerts */}
            {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const threeDays = new Date(today);
                threeDays.setDate(threeDays.getDate() + 3);

                const overdue = tasks.filter(t => {
                    if (t.Status === TaskStatus.Done) return false;
                    if (!t.DueDate) return false;
                    const d = new Date(t.DueDate); d.setHours(0, 0, 0, 0);
                    return d < today;
                });
                const upcoming = tasks.filter(t => {
                    if (t.Status === TaskStatus.Done) return false;
                    if (!t.DueDate) return false;
                    const d = new Date(t.DueDate); d.setHours(0, 0, 0, 0);
                    return d >= today && d <= threeDays;
                });
                const todayDone = tasks.filter(t => {
                    if (t.Status !== TaskStatus.Done) return false;
                    if (!t.ActualEndDate) return false;
                    const d = new Date(t.ActualEndDate); d.setHours(0, 0, 0, 0);
                    return d.getTime() === today.getTime();
                });

                const alerts: { icon: string; text: string; type: 'danger' | 'warn' | 'success' }[] = [];
                if (overdue.length > 0) alerts.push({ icon: '🔴', text: `${overdue.length} công việc đã quá hạn — cần xử lý ngay!`, type: 'danger' });
                if (upcoming.length > 0) alerts.push({ icon: '⚠️', text: `${upcoming.length} công việc sẽ đến hạn trong 3 ngày tới`, type: 'warn' });
                if (todayDone.length > 0) alerts.push({ icon: '✅', text: `${todayDone.length} công việc vừa hoàn thành hôm nay`, type: 'success' });

                if (alerts.length === 0) return null;

                const typeStyles = {
                    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
                    warn: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400',
                    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
                };

                return (
                    <div className="flex flex-wrap gap-2">
                        {alerts.map((a, i) => (
                            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${typeStyles[a.type]}`}>
                                <span>{a.icon}</span>
                                <span>{a.text}</span>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* 2. Filter Bar */}
            <TaskFilterBar
                currentFilter={currentFilter}
                currentView={currentView}
                onFilterChange={setCurrentFilter}
                onViewChange={setCurrentView}
                onAddTask={() => handleAddTask()}
                onSearch={setSearchQuery}
                searchQuery={searchQuery}
                taskCounts={taskCounts}
                currentUserId={currentUserId}
            />

            {/* 2.5 Overall Progress Bar */}
            {(() => {
                const total = tasks.length;
                const done = tasks.filter(t => t.Status === TaskStatus.Done).length;
                const inProgress = tasks.filter(t => t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                    <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wide">Tiến độ tổng thể</span>
                            <span className="text-sm font-black text-gray-800 dark:text-white">{pct}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{ background: 'linear-gradient(90deg, #fdba74, #fb923c, #4a90e2)', width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-medium">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Hoàn thành: {done}
                            </span>
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Đang thực hiện: {inProgress}
                            </span>
                            <span className="flex items-center gap-1 text-gray-400 dark:text-slate-500">
                                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                                Chưa bắt đầu: {total - done - inProgress}
                            </span>
                        </div>
                    </div>
                );
            })()}

            {/* 3. Main Layout: Content + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left: Main Content (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                    {currentView === 'wbs' && (
                        <ProjectPlanWBSView
                            phases={DECREE_175_PHASES}
                            tasks={tasks}
                            filteredTasks={filteredTasks}
                            projectID={projectID}
                            groupCode={groupCode}
                            getGroupLabel={getGroupLabel}
                            expandedPhases={expandedPhases}
                            stepAggregates={stepAggregates}
                            bulkCreatingAll={bulkCreatingAll}
                            isDeletingAll={isDeletingAll}
                            deleteConfirmStep={deleteConfirmStep}
                            employeeNameMap={employeeNameMap}
                            uploadingTaskId={uploadingTaskId}
                            attachmentCounts={attachmentCounts}
                            deletingTaskId={deletingTaskId}
                            onTogglePhase={togglePhase}
                            onSetExpandedPhases={setExpandedPhases}
                            onDeleteAllTasks={handleDeleteAllTasks}
                            onOpenPlanModal={(trigger, title, desc) => {
                                setPlanTrigger(trigger);
                                setPlanModalTitle(title);
                                setPlanModalDesc(desc);
                                setPlanModalOpen(true);
                            }}
                            onAddTask={(stepName, stepCode) => {
                                setSelectedStep({ name: stepName, code: stepCode });
                                setEditingTask({} as Task);
                                setIsTaskModalOpen(true);
                            }}
                            onEditTask={handleEditTask}
                            onQuickStatusChange={handleQuickStatusChange}
                            onDeleteTask={handleDeleteTask}
                            onSetPendingUploadTaskId={setPendingUploadTaskId}
                            onStepClick={handleStepClick}
                            expandedMasterTasks={expandedMasterTasks}
                            onToggleMasterTask={toggleMasterTask}
                            fileInputRef={fileInputRef}
                            navigate={navigate}
                            queryClient={queryClient}
                        />
                    )}

                    {currentView === 'gantt' && (
                        <div className="bg-[#FCF9F2] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-[#F5EFE6] dark:bg-slate-700 flex justify-between items-center">
                                <h4 className="font-bold text-gray-700 dark:text-slate-200 text-xs uppercase flex items-center gap-2">
                                    <Layers className="w-4 h-4" /> Tiến độ tổng thể (Gantt)
                                </h4>
                                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal normal-case">
                                    * Chỉ hiển thị các hạng mục lớn đã có công việc thành phần
                                </span>
                            </div>
                            <div className="p-4">
                                {ganttTasks.length > 0 ? (
                                    <ProjectGanttChart tasks={ganttTasks} />
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm italic">
                                        Chưa có công việc nào được cập nhật thời gian. Hãy thêm công việc bên dưới.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentView === 'kanban' && (
                        <KanbanBoardView
                            tasks={filteredTasks}
                            onTaskClick={handleEditTask}
                            onStatusChange={handleStatusChange}
                            onAddTask={(status) => {
                                setSelectedStep(null);
                                setEditingTask({ Status: status } as Task);
                                setIsTaskModalOpen(true);
                            }}
                        />
                    )}

                    {currentView === 'resource' && (
                        <ResourceAllocationView
                            tasks={filteredTasks}
                            employees={employees}
                            onTaskClick={handleEditTask}
                        />
                    )}
                </div>

                {/* Right: Sidebar (1 col) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 space-y-4">

                        {/* Project Health Score */}
                        {(() => {
                            const total = tasks.length;
                            if (total === 0) return null;

                            const done = tasks.filter(t => t.Status === TaskStatus.Done).length;
                            const today = new Date(); today.setHours(0, 0, 0, 0);
                            const overdue = tasks.filter(t => {
                                if (t.Status === TaskStatus.Done || !t.DueDate) return false;
                                const d = new Date(t.DueDate); d.setHours(0, 0, 0, 0);
                                return d < today;
                            }).length;
                            const assigned = tasks.filter(t => t.AssigneeID || (t.Assignees && t.Assignees.length > 0)).length;

                            // Score calculation (0-100)
                            const completionScore = (done / total) * 30;
                            const onTimeScore = ((total - overdue) / total) * 30;
                            const assignedScore = (assigned / total) * 20;
                            const hasProgress = tasks.filter(t => (t.ProgressPercent || 0) > 0 || t.Status === TaskStatus.Done).length;
                            const progressScore = (hasProgress / total) * 20;
                            const score = Math.round(completionScore + onTimeScore + assignedScore + progressScore);

                            const getScoreInfo = (s: number) => {
                                if (s >= 80) return { emoji: '🟢', label: 'Tốt', color: 'text-emerald-600', bg: 'bg-emerald-500' };
                                if (s >= 60) return { emoji: '🟡', label: 'Trung bình', color: 'text-primary-600', bg: 'bg-primary-500' };
                                if (s >= 40) return { emoji: '🟠', label: 'Cần cải thiện', color: 'text-orange-600', bg: 'bg-orange-500' };
                                return { emoji: '🔴', label: 'Rủi ro cao', color: 'text-red-600', bg: 'bg-red-500' };
                            };
                            const info = getScoreInfo(score);

                            return (
                                <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                        Sức khỏe dự án
                                    </h4>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">{info.emoji}</span>
                                        <div>
                                            <span className={`text-2xl font-black ${info.color}`}>{score}</span>
                                            <span className="text-sm text-gray-400">/100</span>
                                            <p className={`text-xs font-semibold ${info.color}`}>{info.label}</p>
                                        </div>
                                    </div>
                                    {/* Score bar */}
                                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                                        <div className={`h-full ${info.bg} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                                    </div>
                                    {/* Breakdown */}
                                    <div className="space-y-1.5 text-[10px] text-gray-500">
                                        <div className="flex justify-between"><span>Hoàn thành ({done}/{total})</span><span className="font-bold">{Math.round(completionScore)}/30</span></div>
                                        <div className="flex justify-between"><span>Đúng hạn ({total - overdue}/{total})</span><span className="font-bold">{Math.round(onTimeScore)}/30</span></div>
                                        <div className="flex justify-between"><span>Có tiến độ</span><span className="font-bold">{Math.round(progressScore)}/20</span></div>
                                        <div className="flex justify-between"><span>Đã phân công</span><span className="font-bold">{Math.round(assignedScore)}/20</span></div>
                                    </div>
                                </div>
                            );
                        })()}

                        <MilestoneTimeline milestoneData={milestoneData} />
                    </div>
                </div>
            </div>

            <ProjectTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSubmit={handleSaveTask}
                initialData={editingTask || {}}
                stepName={selectedStep?.name}
                stepCode={selectedStep?.code}
                allTasks={tasks}
            />

            {/* Hidden file input for attachments */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && pendingUploadTaskId) {
                        handleFileUpload(pendingUploadTaskId, file);
                        setPendingUploadTaskId(null);
                    }
                    e.target.value = '';
                }}
            />

            {/* Toast Notifications */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-sm text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${
                    toast.type === 'success' ? 'bg-emerald-600 text-white' :
                    toast.type === 'error' ? 'bg-red-600 text-white' :
                    'bg-gray-800 text-white'
                }`}>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white text-lg leading-none">&times;</button>
                </div>
            )}
            {/* Plan Date Range Modal */}
            <PlanDateRangeModal
                isOpen={planModalOpen}
                onClose={() => setPlanModalOpen(false)}
                onConfirm={handlePlanModalConfirm}
                title={planModalTitle}
                description={planModalDesc}
                defaultStartDate={project?.StartDate
                    ? new Date(project.StartDate).toISOString().split('T')[0]
                    : undefined}
                isLoading={planModalLoading}
                showWorkflowOption={planTrigger?.type === 'all'}
            />

            {/* Step Detail Modal */}
            {stepDetailItem && (
                <StepDetailModal
                    isOpen={stepDetailOpen}
                    onClose={() => setStepDetailOpen(false)}
                    item={stepDetailItem}
                    stepAgg={stepDetailAgg}
                    tasks={filteredTasks}
                    employeeNameMap={employeeNameMap}
                    onAddTask={(stepName, stepCode) => {
                        setSelectedStep({ name: stepName || '', code: stepCode || '' });
                        setEditingTask({} as Task);
                        setIsTaskModalOpen(true);
                    }}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onQuickStatusChange={handleQuickStatusChange}
                    onUpdateStepMeta={handleUpdateStepMeta}
                />
            )}
        </div>

    );
};

