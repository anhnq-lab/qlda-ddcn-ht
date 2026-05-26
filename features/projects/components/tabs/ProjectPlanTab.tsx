import React, { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority, Employee, ProjectGroup, Project } from '@/types';
import {
    Layers, CheckCircle2, Circle, Clock, ChevronDown, ChevronRight,
    FileText, AlertCircle, Plus, Calendar, User, Flag, Zap, Building2, Scale, Info, ExternalLink, ListPlus, Paperclip, Upload, X, Trash2
} from 'lucide-react';
import { isDepartmentCode } from '@/services/task/helpers';
import { ProjectGanttChart } from '../ProjectGanttChart';
import { ProjectTaskModal } from '../ProjectTaskModal';
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
import { useProjectSteps, projectStepsKey } from '../../hooks/useProjectSteps';
import { ProjectStepsService } from '@/services/ProjectStepsService';
import type { PhaseItem } from '../../hooks/useProjectSteps';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { useStepAggregates } from '../../hooks/useStepAggregates';
import { usePlanPersist } from '../../hooks/usePlanPersist';
import { taskKeys } from '@/hooks/useWorkflowTasks';
import { workflowTaskToTask, taskToDbTask } from '@/lib/mappers/workflowTaskMappers';
import { calcProgress, isTaskInStep } from '@/lib/progressCalculator';
import { CreateMasterPlanPanel } from '../CreateMasterPlanPanel';
import { StepDetailModal } from '../StepDetailModal';
import { PlanDateRange } from '../PlanDateRangeModal';
import { ProjectRaciMatrixView } from './ProjectRaciMatrixView';
import { HorizontalMilestoneTimeline } from '../HorizontalMilestoneTimeline';


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

    // Phases từ MPI steps (sau khi user đã tạo KH tổng thể)
    const {
        phases: DECREE_175_PHASES,
        steps: projectSteps,
        isLoading: isLoadingPhases,
        invalidate: invalidateProjectSteps,
        unscheduledCount,
    } = useProjectSteps(projectID);

    const getGroupLabel = (g?: string) => {
        switch (g) {
            case 'QN': return 'Quan trọng QG';
            case 'A': return 'Nhóm A';
            case 'B': return 'Nhóm B';
            case 'C': return 'Nhóm C';
            default: return 'Nhóm C';
        }
    };

    // Employee name lookup map
    const employeeNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        employees.forEach(e => { map[e.EmployeeID] = e.FullName; });
        return map;
    }, [employees]);

    // Map DbTask[] → Task[] sử dụng canonical mapper (single source of truth)
    const mappedTasks = useMemo<Task[]>(() => {
        return workflowTasks.map((wt: any) => {
            if (wt.TaskID) return wt as Task; // already mapped
            return workflowTaskToTask(wt, projectID);
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
                phase.items.some(item => isTaskInStep(t, { id: item.code, code: item.stepCode ?? item.code }))
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
                const pt = mappedTasks.filter(t => p.items.some(i => isTaskInStep(t, { id: i.code, code: i.stepCode ?? i.code })));
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
    const fileInputRef = React.useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
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

    const handleOpenPlanPanel = () => {
        openPanel({
            title: 'Thiết lập kế hoạch tổng thể',
            icon: <ListPlus className="w-5 h-5 text-emerald-500" />,
            width: '98%',
            component: (
                <CreateMasterPlanPanel
                    project={project}
                    hasExistingTasks={DECREE_175_PHASES.some(p => p.items.length > 0)}
                    onClose={() => closePanel()}
                    onSuccess={() => {
                        showToast('✅ Đã thiết lập kế hoạch tổng thể thành công', 'success');
                        queryClient.invalidateQueries({ queryKey: taskKeys.all });
                        queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2', projectID] });
                        queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2'] });
                        if (projectID) queryClient.invalidateQueries({ queryKey: projectStepsKey(projectID) });
                        closePanel();
                    }}
                />
            )
        });
    };

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
            const stepCode = (task as any)?.StepCode || (task as any)?.step_code || '';
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
                const sDate = item.startDate || agg?.startDate;
                const dDate = item.dueDate || agg?.dueDate;
                if (!sDate || !dDate) return null;

                return {
                    TaskID: item.code,
                    Title: `${item.id}. ${item.title}`,
                    TaskType: 'project',
                    StartDate: sDate,
                    DueDate: dDate,
                    Status: agg?.status || TaskStatus.Todo,
                    Priority: TaskPriority.Medium,
                    Description: 'Kế hoạch thực hiện bước quy trình',
                    AssigneeID: '',
                    TimelineStep: item.code,
                    ProjectID: projectID || 'SYNTHETIC',
                    ProgressPercent: agg?.progress || 0
                } as Task;
            })
            .filter((t): t is Task => t !== null);
    }, [DECREE_175_PHASES, stepAggregates, projectID]);

    // 6. Compute Milestone Dates for Timeline
    const milestoneData = useMemo(() => {
        const getMilestoneDates = (code: string) => {
            const allStepTasks = tasks.filter(t => {
                const tStepCode = (t.StepCode || '').toLowerCase().trim();
                const sCode = (code || '').toLowerCase().trim();
                return tStepCode === sCode || t.ProjectPlanItemID === code || t.MonthlyPlanItemID === code;
            });
            if (allStepTasks.length === 0) return { actual: undefined, target: undefined };

            // Ngày dự kiến (DueDate lớn nhất trong các task của bước này)
            const targetDates = allStepTasks.map(t => new Date(t.DueDate).getTime()).filter(d => !isNaN(d));
            const target = targetDates.length > 0 ? new Date(Math.max(...targetDates)).toISOString().split('T')[0] : undefined;

            // Kiểm tra xem tất cả các task đã hoàn thành chưa
            const allDone = allStepTasks.every(t => t.Status === TaskStatus.Done);
            let actual: string | undefined = undefined;
            if (allDone && targetDates.length > 0) {
                // Lấy ngày hoàn thành thực tế lớn nhất, hoặc lấy target nếu không có ActualEndDate
                const actualDates = allStepTasks.map(t => t.ActualEndDate ? new Date(t.ActualEndDate).getTime() : new Date(t.DueDate).getTime()).filter(d => !isNaN(d));
                actual = actualDates.length > 0 ? new Date(Math.max(...actualDates)).toISOString().split('T')[0] : undefined;
            }

            return { actual, target };
        };

        const policy = getMilestoneDates('PREP_POLICY');
        const decision = getMilestoneDates('PREP_DECISION');
        const design = getMilestoneDates('IMPL_DESIGN');
        const construction = getMilestoneDates('IMPL_CONSTRUCTION');
        const acceptance = getMilestoneDates('IMPL_ACCEPTANCE');
        const handover = getMilestoneDates('CLOSE_HANDOVER');

        return {
            policyApprovalDate: policy.actual,
            policyApprovalTargetDate: policy.target,
            projectApprovalDate: decision.actual,
            projectApprovalTargetDate: decision.target,
            constructionDesignDate: design.actual,
            constructionDesignTargetDate: design.target,
            groundbreakingDate: construction.actual,
            groundbreakingTargetDate: construction.target,
            completionDate: acceptance.actual,
            completionTargetDate: acceptance.target,
            handoverDate: handover.actual,
            handoverTargetDate: handover.target,
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
        // Chu kỳ nhanh cho dự án: Todo → InProgress → Done → Todo (không dùng Incomplete ở project plan)
        const statusCycle: Partial<Record<TaskStatus, TaskStatus>> = {
            [TaskStatus.Todo]: TaskStatus.InProgress,
            [TaskStatus.InProgress]: TaskStatus.Done,
            [TaskStatus.Done]: TaskStatus.Todo,
            [TaskStatus.Incomplete]: TaskStatus.Todo,
            [TaskStatus.Review]: TaskStatus.Done, // Legacy
        };
        const newStatus = statusCycle[task.Status] || TaskStatus.InProgress;
        // Auto-sync progress with status
        let newProgress = task.ProgressPercent || 0;
        if (newStatus === TaskStatus.Done) newProgress = 100;
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
        const masterTask = tasks.find(t => {
            const tStepCode = (t.StepCode || '').toLowerCase().trim();
            const sCode = (stepCode || '').toLowerCase().trim();
            return tStepCode === sCode && !(t as any).ParentID;
        });
        if (masterTask) {
             handleSaveTask({
                 ...masterTask,
                 AssigneeID: updates.assigneeRole || masterTask.AssigneeID,
             } as any);
        }
    };
    const handleSaveTask = async (taskData: Partial<Task>) => {
        // Dùng canonical mapper — single source of truth cho UI→DB conversion.
        // Khi task tạo mới từ 1 step, bổ sung monthly_plan_item_id = selectedStep.code (MPI step ID).
        const dbTaskData: any = {
            ...taskToDbTask(taskData, projectID),
            // Tasks tạo từ bước KH dự án → project_plan_item_id (không dùng monthly_plan_item_id)
            project_plan_item_id: taskData.ProjectPlanItemID || selectedStep?.code || null,
            monthly_plan_item_id: taskData.MonthlyPlanItemID || null,
            // predecessor_task_id không có trong taskToDbTask mapper
            predecessor_task_id: (taskData as any).PredecessorTaskID || null,
        };

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
                dateRange.startDate,
                dateRange.endDate
            );
            
            showToast(`✅ Đã thiết lập kế hoạch dựa trên quy trình mẫu`, 'success');
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2', projectID] });
            queryClient.invalidateQueries({ queryKey: ['project-task-progress-v2'] });
            if (projectID) queryClient.invalidateQueries({ queryKey: projectStepsKey(projectID) });
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

            // Successfully deleted all plan tasks
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

    // ── Xóa toàn bộ KH dự án (project_plan_items) ──
    const handleDeletePlan = async () => {
        if (!projectID) return;
        try {
            await ProjectStepsService.deleteAllByProject(projectID);
            queryClient.invalidateQueries({ queryKey: projectStepsKey(projectID) });
            showToast('🗑️ Đã xóa toàn bộ kế hoạch dự án', 'info');
        } catch (err: any) {
            console.error('Failed to delete project plan:', err);
            showToast(`❌ Lỗi: ${err?.message || 'Không thể xóa kế hoạch'}`, 'error');
        }
    };

    // Priority color helper
    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'High': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'Medium': return 'text-primary-500 bg-primary-500/10 border-primary-500/20';
            case 'Low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-txt-muted bg-bg-muted border-border';
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
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-3.5 py-2">

            {/* 1. Overall Dashboard Header: Progress & Milestones */}
            <div className="w-full">
                
                {/* Overall Progress & Horizontal Milestones (Full Width) */}
                {(() => {
                    const stats = calcProgress(tasks);
                    const { total, done, inProgress, overdue: overdueCount, completionPercent: pct } = stats;

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const threeDays = new Date(today);
                    threeDays.setDate(threeDays.getDate() + 3);

                    const overdue = tasks.filter(t => {
                        if (t.Status === TaskStatus.Done || !t.DueDate) return false;
                        const d = new Date(t.DueDate); d.setHours(0, 0, 0, 0);
                        return d < today;
                    });
                    const upcoming = tasks.filter(t => {
                        if (t.Status === TaskStatus.Done || !t.DueDate) return false;
                        const d = new Date(t.DueDate); d.setHours(0, 0, 0, 0);
                        return d >= today && d <= threeDays;
                    });
                    const todayDone = tasks.filter(t => {
                        if (t.Status !== TaskStatus.Done || !t.ActualEndDate) return false;
                        const d = new Date(t.ActualEndDate); d.setHours(0, 0, 0, 0);
                        return d.getTime() === today.getTime();
                    });

                    const alerts: { icon: string; text: string; type: 'danger' | 'warn' | 'success'; filterVal?: TaskFilter }[] = [];
                    if (overdue.length > 0) alerts.push({ icon: '🔴', text: `${overdue.length} công việc đã quá hạn`, type: 'danger', filterVal: 'overdue' });
                    if (upcoming.length > 0) alerts.push({ icon: '⚠️', text: `${upcoming.length} công việc sắp tới hạn`, type: 'warn', filterVal: 'this-week' });
                    if (todayDone.length > 0) alerts.push({ icon: '✅', text: `${todayDone.length} hoàn thành hôm nay`, type: 'success', filterVal: 'completed' });

                    const typeStyles = {
                        danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40',
                        warn: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40',
                        success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
                    };

                    return (
                        <div className="w-full bg-bg-surface rounded-xl border border-border p-3 px-4 shadow-sm space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-[10px] font-bold">
                                {/* Left side: Title and Alerts */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-black text-txt-primary uppercase tracking-wide">Tiến độ tổng thể</span>
                                    {alerts.map((a, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => a.filterVal && setCurrentFilter(a.filterVal)}
                                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold cursor-pointer transition-colors shadow-sm ${typeStyles[a.type]}`}
                                        >
                                            <span>{a.icon}</span>
                                            <span>{a.text}</span>
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Right side: Filters, total and percent */}
                                <div className="flex flex-wrap items-center gap-3 text-txt-secondary">
                                    <button 
                                        onClick={() => setCurrentFilter('completed')}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${currentFilter === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200' : 'hover:bg-bg-muted'} text-emerald-600 dark:text-emerald-400`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Hoàn thành: {done}
                                    </button>
                                    <button 
                                        onClick={() => setCurrentFilter('in-progress')}
                                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${currentFilter === 'in-progress' ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-200' : 'hover:bg-bg-muted'} text-blue-600 dark:text-blue-400`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Đang thực hiện: {inProgress}
                                    </button>
                                    <button 
                                        onClick={() => setCurrentFilter('all')}
                                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${currentFilter === 'all' ? 'bg-bg-muted ring-1 ring-border' : 'hover:bg-bg-muted'} text-txt-muted`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                        Chưa bắt đầu: {total - done - inProgress}
                                    </button>
                                    
                                    <span className="text-gray-300 dark:text-slate-700">|</span>
                                    
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-txt-primary">
                                        Tổng cộng: {total}
                                    </div>
                                    
                                    <span className="text-gray-300 dark:text-slate-700">|</span>
                                    
                                    <span className="text-xs font-black text-txt-primary bg-slate-50 dark:bg-slate-800 border border-border px-2 py-0.5 rounded-lg">{pct}%</span>
                                </div>
                            </div>
                            
                            <div className="pt-1 pb-1">
                                <HorizontalMilestoneTimeline progressPercent={pct} milestoneData={milestoneData} />
                            </div>
                        </div>
                    );
                })()}

            </div>

            {/* 2. Filter Bar */}
            <TaskFilterBar
                currentFilter={currentFilter}
                currentView={currentView}
                onFilterChange={setCurrentFilter}
                onViewChange={setCurrentView}
                onAdjustPlan={handleOpenPlanPanel}
                onSearch={setSearchQuery}
                searchQuery={searchQuery}
                taskCounts={taskCounts}
                currentUserId={currentUserId}
            />

            {/* 3. Main Layout: Full Width Content */}
            <div className="w-full space-y-4">
                {currentView === 'wbs' && (
                    <ProjectPlanWBSView
                        phases={DECREE_175_PHASES}
                        tasks={tasks}
                        filteredTasks={filteredTasks}
                        projectID={projectID ?? ''}
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
                        onDeletePlan={handleDeletePlan}
                        onOpenPlanModal={(trigger, title, desc) => {
                            handleOpenPlanPanel();
                        }}
                        onAddTask={(stepName, stepCode) => {
                            setSelectedStep({ name: stepName ?? '', code: stepCode ?? '' });
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
                    <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-border bg-bg-muted flex justify-between items-center">
                            <h4 className="font-bold text-txt-primary text-xs uppercase flex items-center gap-2">
                                <Layers className="w-4 h-4" /> Tiến độ tổng thể (Gantt)
                            </h4>
                            <span className="text-[10px] text-txt-muted font-normal normal-case">
                                * Hiển thị tiến độ theo các bước quy trình và công việc tương ứng
                            </span>
                        </div>
                        <div className="p-4">
                            {DECREE_175_PHASES.some(p => p.items.length > 0) || tasks.length > 0 ? (
                                <ProjectGanttChart
                                    tasks={tasks}
                                    phases={DECREE_175_PHASES}
                                    projectStartDate={project?.StartDate}
                                />
                            ) : (
                                <div className="h-32 flex items-center justify-center text-txt-muted text-sm italic">
                                    Chưa có kế hoạch tổng thể. Hãy tạo kế hoạch dự án trước.
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

                {currentView === 'raci' && (
                    <ProjectRaciMatrixView
                        steps={projectSteps}
                        onRefresh={invalidateProjectSteps}
                    />
                )}
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

