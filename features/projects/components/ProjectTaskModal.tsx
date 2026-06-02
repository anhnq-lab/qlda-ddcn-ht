import React, { useState, useEffect, useRef } from 'react';
import {
    X, Calendar, User, AlignLeft, CheckSquare, Clock, Flag, Link2, BarChart3,
    Plus, Trash2, CheckCircle2, Scale, Paperclip, Upload, Download, FileText,
    AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Layers, Zap, FileSpreadsheet, File, Folder, Tag, Users, ShieldCheck, MessageSquare
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskDependency, TaskAttachment } from '@/types';
import { TASK_CATEGORIES, TASK_CATEGORY_LABELS, type TaskCategory, type ResponsibilityLevel } from '@/types/task.types';
import { useAuth } from '@/context/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { ProgressSlider } from './ProgressSlider';
import { TaskDependencyManager } from './TaskDependencyManager';
import { getTimelineStepLabel, getPhaseColor } from '@/utils/timelineStepUtils';
import { getTaskTemplates, getFileTypeColor, TaskTemplate } from '@/utils/taskTemplates';
import { getTemplateConfig } from '@/utils/templateRegistry';
import { TemplateExportModal } from './TemplateExportModal';
import { useSlidePanel } from '@/context/SlidePanelContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUpdateTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { DEPARTMENT_NAMES } from '@/types/plan.types';
import {
    todayISO,
    toYMD,
    toDMY,
    DateInputVN,
    getStatusConfig,
    getPriorityConfig,
} from './ProjectTaskModal.helpers';

// Custom Multi-select component for employee selection
const MultiSelectEmployees: React.FC<{
    label: string;
    icon?: React.ReactNode;
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    employees: any[];
    placeholder?: string;
}> = ({ label, icon, selectedIds, onChange, employees, placeholder = '-- Chọn --' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = employees.filter(emp =>
        emp.FullName.toLowerCase().includes(search.toLowerCase()) ||
        (emp.Department || '').toLowerCase().includes(search.toLowerCase())
    );

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(x => x !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const removeTag = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedIds.filter(x => x !== id));
    };

    return (
        <div className="space-y-1.5 text-left" ref={containerRef}>
            <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                {icon} {label}
            </label>
            <div className="relative">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="min-h-[42px] w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary cursor-pointer flex flex-wrap gap-1.5 items-center justify-between text-sm"
                >
                    <div className="flex flex-wrap gap-1">
                        {selectedIds.length === 0 ? (
                            <span className="text-gray-400">{placeholder}</span>
                        ) : (
                            selectedIds.map(id => {
                                const emp = employees.find(e => e.EmployeeID === id);
                                if (!emp) return null;
                                return (
                                    <span
                                        key={id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold border border-primary-200 dark:border-primary-800"
                                    >
                                        {emp.FullName}
                                        <button
                                            type="button"
                                            onClick={(e) => removeTag(id, e)}
                                            className="hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-full p-0.5 text-primary-500"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                );
                            })
                        )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-bg-surface border border-border shadow-lg rounded-lg overflow-hidden max-h-60 flex flex-col animate-in fade-in duration-100">
                        <div className="p-2 border-b border-border shrink-0 bg-bg-subtle">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Tìm kiếm cán bộ..."
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="overflow-y-auto flex-1 p-1 space-y-0.5">
                            {filtered.length === 0 ? (
                                <div className="p-3 text-xs text-gray-400 text-center italic">Không tìm thấy cán bộ</div>
                            ) : (
                                filtered.map(emp => {
                                    const isSelected = selectedIds.includes(emp.EmployeeID);
                                    return (
                                        <div
                                            key={emp.EmployeeID}
                                            onClick={() => toggleSelect(emp.EmployeeID)}
                                            className={`flex items-center justify-between px-3 py-2 text-xs rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold' : 'hover:bg-bg-subtle text-txt-primary'}`}
                                        >
                                            <div className="flex flex-col">
                                                <span>{emp.FullName}</span>
                                                <span className="text-[10px] text-gray-400">{emp.Department}</span>
                                            </div>
                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ProjectTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Partial<Task>) => Promise<void> | void;
    initialData?: Partial<Task>;
    stepName?: string;
    stepCode?: string;
    allTasks?: Task[];
    asSlidePanel?: boolean;
}

export const ProjectTaskModal: React.FC<ProjectTaskModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    stepName,
    stepCode,
    allTasks = [],
    asSlidePanel = false
}) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { data: employees = [] } = useEmployees();
    const { projects = [] } = useProjects();
    const [planMonth, setPlanMonth] = useState(new Date().getMonth() + 1);
    const [planYear, setPlanYear] = useState(new Date().getFullYear());
    const updateTaskMutation = useUpdateTask();

    const [formData, setFormData] = useState<Partial<Task>>(() => {
        const initAssigneeIDs = initialData?.Metadata?.assignee_ids || (initialData?.AssigneeID ? [initialData.AssigneeID] : []);
        const initCollaboratorIDs = initialData?.CollaboratorIDs || [];
        return {
            Title: '', Description: '', Status: TaskStatus.Todo, Priority: TaskPriority.Medium,
            StartDate: '', DueDate: '', AssigneeID: '', ProgressPercent: 0, Dependencies: [],
            ...initialData,
            AssigneeIDs: initAssigneeIDs,
            CollaboratorIDs: initCollaboratorIDs
        };
    });

    // Đồng bộ tháng/năm kế hoạch theo hạn hoàn thành công việc
    useEffect(() => {
        if (formData.DueDate) {
            const d = new Date(formData.DueDate);
            if (!isNaN(d.getTime())) {
                setPlanMonth(d.getMonth() + 1);
                setPlanYear(d.getFullYear());
            }
        }
    }, [formData.DueDate]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeSection, setActiveSection] = useState<string>('basic');
    const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
    const [editingSubTask, setEditingSubTask] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeExportTemplate, setActiveExportTemplate] = useState<TaskTemplate | null>(null);
    const [projectMemberIds, setProjectMemberIds] = useState<string[]>([]);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load project members to filter employee dropdown
    useEffect(() => {
        const projectId = initialData?.ProjectID;
        if (!projectId || !isOpen) { setProjectMemberIds([]); return; }
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('project_members')
                    .select('employee_id')
                    .eq('project_id', projectId);
                if (!error && data) {
                    setProjectMemberIds(data.map((r: any) => r.employee_id));
                }
            } catch { /* ignore */ }
        })();
    }, [initialData?.ProjectID, isOpen]);

    // Filter: only project members (fallback to all if no members configured)
    const availableEmployees = projectMemberIds.length > 0
        ? employees.filter(e => projectMemberIds.includes(e.EmployeeID))
        : employees;

    const normalizeDept = (name: string | null | undefined): string => {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/phòng\s+/g, '')
            .replace(/phong\s+/g, '')
            .replace(/[\s\-\–\—]/g, '')
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    const isEmployeeInDepartment = (emp: any, deptCode: string): boolean => {
        if (!deptCode) return false;
        const empDept = emp.Department || '';
        const normEmpDept = normalizeDept(empDept);
        
        const normDeptCode = normalizeDept(deptCode);
        if (normEmpDept === normDeptCode) return true;
        
        const deptName = (DEPARTMENT_NAMES as any)[deptCode.toUpperCase()] || '';
        const normDeptName = normalizeDept(deptName);
        if (normEmpDept === normDeptName) return true;
        
        if (deptName && (empDept.toLowerCase().includes(deptName.toLowerCase()) || deptName.toLowerCase().includes(empDept.toLowerCase()))) {
            return true;
        }
        return false;
    };

    const currentStepCode = stepCode || formData.StepCode;
    const parentStepTask = allTasks.find(t =>
        t.StepCode === currentStepCode &&
        (t.Metadata?.assignee_role || (t as any)?.metadata?.assignee_role)
    );
    const parentDeptCode = parentStepTask
        ? (parentStepTask.Metadata?.assignee_role || (parentStepTask as any)?.metadata?.assignee_role)
        : null;

    const filteredEmployees = parentDeptCode
        ? availableEmployees.filter(emp => isEmployeeInDepartment(emp, parentDeptCode))
        : [];

    // Fallback: nếu không filter được theo phòng ban, dùng tất cả nhân viên
    const dropdownEmployees = filteredEmployees.length > 0
        ? filteredEmployees
        : availableEmployees.length > 0
        ? availableEmployees
        : employees;

    const isEditMode = !!initialData?.TaskID;
    const project = projects.find(p => p.ProjectID === formData.ProjectID);
    const { openPanel } = useSlidePanel();

    // Multi-month warning (Quy chế KHCV Điều 8.5)
    const isMultiMonth = (() => {
        if (!formData.StartDate || !formData.DueDate) return false;
        const start = new Date(formData.StartDate);
        const end = new Date(formData.DueDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) > 0;
    })();

    // Step info for template export
    const timelineStep = formData.StepCode;

    useEffect(() => {
        if (isOpen) {
            const initAssigneeIDs = initialData?.Metadata?.assignee_ids || (initialData?.AssigneeID ? [initialData.AssigneeID] : []);
            const initCollaboratorIDs = initialData?.CollaboratorIDs || [];
            setFormData({
                Title: '', Description: '', Status: TaskStatus.Todo, Priority: TaskPriority.Medium,
                StartDate: '', DueDate: '', AssigneeID: '', ProgressPercent: 0, Dependencies: [],
                ...initialData,
                AssigneeIDs: initAssigneeIDs,
                CollaboratorIDs: initCollaboratorIDs
            });
            setActiveSection('basic');
            setIsSubTaskModalOpen(false);
            setEditingSubTask(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const [saveError, setSaveError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSaveError(null);
        try {
            const assigneeIds = formData.AssigneeIDs || [];
            const primaryAssigneeId = assigneeIds.length > 0 ? assigneeIds[0] : '';

            const finalData = {
                ...formData,
                AssigneeID: primaryAssigneeId,
                CollaboratorIDs: formData.CollaboratorIDs || [],
                StepCode: stepCode || formData.StepCode,
                Metadata: {
                    ...formData.Metadata,
                    assignee_ids: assigneeIds
                }
            };
            // Self-proposed auto-flag (Điều 9.3) cho nhân viên thường khi tạo mới
            if (!isEditMode && currentUser) {
                const userRole = (currentUser.Role as string) || 'User';
                const isDirector = userRole === 'Director' || userRole === 'DeputyDirector' || userRole === 'Admin';
                const isDeptHead = userRole === 'DepartmentHead';
                if (!isDirector && !isDeptHead) {
                    finalData.IsSelfProposed = true;
                    finalData.ProposalStatus = 'pending';
                }
            }
            await onSubmit(finalData);
            if (isEditMode) {
                // Stay open in edit mode, show save feedback
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
            } else {
                onClose(); // Close only when creating new task
            }
        } catch (err: any) {
            console.error('Task save failed:', err);
            setSaveError(err?.message || 'Lưu thất bại. Vui lòng thử lại.');
            setTimeout(() => setSaveError(null), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDependencyUpdate = (dependencies: TaskDependency[]) => {
        setFormData({ ...formData, Dependencies: dependencies });
    };

    const statusCfg = getStatusConfig(formData.Status as TaskStatus);
    const priorityCfg = getPriorityConfig(formData.Priority as TaskPriority);
    const progress = formData.ProgressPercent || (formData.Status === TaskStatus.Done ? 100 : 0);
    const isOverdue = formData.Status !== TaskStatus.Done && formData.DueDate && new Date(formData.DueDate) < new Date();
    const stepLabel = getTimelineStepLabel(formData.StepCode);
    const phaseColor = getPhaseColor(formData.StepCode);
    const templates = isEditMode ? getTaskTemplates(formData.StepCode, formData.Title) : [];
    const assignee = employees.find(e => e.EmployeeID === formData.AssigneeID);

    // ── File upload ──
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !formData.TaskID) return;
        setIsUploading(true);
        try {
            const newAttachments: TaskAttachment[] = [...(formData.Attachments || [])];
            for (const file of Array.from(files) as File[]) {
                const ext = file.name.split('.').pop();
                const path = `${formData.ProjectID}/tasks/${formData.TaskID}/${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('task-attachments').upload(path, file);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('task-attachments').getPublicUrl(path);
                newAttachments.push({
                    id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    name: file.name, url: urlData.publicUrl,
                    size: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                    uploadDate: new Date().toLocaleDateString('vi-VN'), type: 'uploaded',
                });
            }
            const updatedData = { ...formData, Attachments: newAttachments };
            setFormData(updatedData);
            if (isEditMode) updateTaskMutation.mutate(updatedData as Task);
        } catch (err) { console.error('Upload failed:', err); }
        finally { setIsUploading(false); e.target.value = ''; }
    };

    const handleRemoveAttachment = (id: string) => {
        if (!confirm('Xóa tài liệu này?')) return;
        const updated = (formData.Attachments || []).filter(a => a.id !== id);
        const updatedData = { ...formData, Attachments: updated };
        setFormData(updatedData);
        if (isEditMode) updateTaskMutation.mutate(updatedData as Task);
    };

    // ── Subtask save ──
    const handleSubTaskSave = (title: string, assigneeId: string, dueDate: string) => {
        let subs = [...(formData.SubTasks || [])];
        if (editingSubTask) {
            subs = subs.map(s => s.SubTaskID === editingSubTask.SubTaskID ? { ...s, Title: title, AssigneeID: assigneeId, DueDate: dueDate } : s);
        } else {
            subs.push({ SubTaskID: `SUB-${Date.now()}`, Title: title, AssigneeID: assigneeId, DueDate: dueDate, Status: 'todo' as any });
        }
        const updatedData = { ...formData, SubTasks: subs };
        setFormData(updatedData);
        if (isEditMode) updateTaskMutation.mutate(updatedData as Task);
        setIsSubTaskModalOpen(false);
        setEditingSubTask(null);
    };

    const toggleSubTaskDone = (idx: number) => {
        const subs = [...(formData.SubTasks || [])];
        subs[idx].Status = (subs[idx].Status as any) === 'Done' ? 'todo' as any : 'done' as any;
        const updatedData = { ...formData, SubTasks: subs };
        setFormData(updatedData);
        if (isEditMode) updateTaskMutation.mutate(updatedData as Task);
    };

    const deleteSubTask = (idx: number) => {
        if (!confirm('Xóa công việc thuộc bước này?')) return;
        const subs = (formData.SubTasks || []).filter((_, i) => i !== idx);
        const updatedData = { ...formData, SubTasks: subs };
        setFormData(updatedData);
        if (isEditMode) updateTaskMutation.mutate(updatedData as Task);
    };

    const sections = [
        { id: 'basic', label: 'Thông tin cơ bản', icon: <CheckSquare className="w-4 h-4" /> },
        { id: 'schedule', label: 'Lịch & Tiến độ', icon: <Calendar className="w-4 h-4" /> },
        ...(isEditMode ? [
            { id: 'subtasks', label: `Công việc thuộc bước (${(formData.SubTasks || []).length})`, icon: <Layers className="w-4 h-4" /> },
            { id: 'documents', label: `Tài liệu (${(formData.Attachments || []).length + templates.length})`, icon: <Paperclip className="w-4 h-4" /> },
        ] : []),
        { id: 'advanced', label: 'Nâng cao', icon: <Flag className="w-4 h-4" /> },
    ];

    // When used as slide panel content, skip the if (!isOpen) guard
    if (!asSlidePanel && !isOpen) return null;

    return (
        <>
            {/* Backdrop — only in modal mode */}
            {!asSlidePanel && <div className="fixed inset-0 z-50 bg-black/20 animate-in fade-in duration-200" onClick={onClose} />}

            {/* Main Container */}
            <div className={asSlidePanel
                ? 'flex flex-col h-full bg-bg-surface relative'
                : 'fixed inset-y-0 right-0 z-50 w-full max-w-4xl flex flex-col bg-bg-surface shadow-sm border-l border-border animate-in slide-in-from-right duration-300'
            }>

                {/* ══════════ HEADER ══════════ */}
                <div className="shrink-0 border-b border-border">
                    {/* Status accent bar */}
                    <div className={`h-1 ${statusCfg.bg}`} />

                    <div className="px-6 py-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusCfg.light} ${statusCfg.text} ring-1 ${statusCfg.ring}`}>
                                        {statusCfg.label}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${priorityCfg.color}`}>
                                        {priorityCfg.label}
                                    </span>
                                    {formData.IsCritical && (
                                        <span className="text-[10px] font-black text-red-600 bg-red-50 ring-1 ring-red-200 px-2 py-1 rounded-md flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> ĐƯỜNG GĂNG
                                        </span>
                                    )}
                                    {isOverdue && (
                                        <span className="text-[10px] font-bold text-red-600 bg-red-50 ring-1 ring-red-200 px-2 py-1 rounded-md animate-pulse flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> QUÁ HẠN
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-lg font-black text-txt-primary truncate">
                                    {isEditMode ? (formData.Title || 'Công việc') : 'Thêm công việc mới'}
                                </h2>
                                {stepName && (
                                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-0.5 flex items-center gap-1">
                                        <Layers className="w-3 h-3" /> {stepName}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {/* ── Workflow Action Buttons ── */}
                                {isEditMode && (() => {
                                    const status = formData.Status as TaskStatus;
                                    const prog = formData.ProgressPercent || 0;
                                    const buttons: React.ReactNode[] = [];

                                    // Back button (revert to previous state)
                                    if (status === TaskStatus.InProgress) {
                                        buttons.push(
                                            <button key="back" type="button" onClick={() => {
                                                const updates: Partial<Task> = { ...formData, Status: TaskStatus.Todo, ProgressPercent: 0, ActualStartDate: '', ActualEndDate: '' };
                                                setFormData(updates);
                                                onSubmit({ ...updates, StepCode: stepCode || updates.StepCode });
                                            }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-slate-600 hover:bg-bg-subtle dark:hover:bg-slate-700 text-txt-muted rounded-lg transition-all">
                                                ← Chưa bắt đầu
                                            </button>
                                        );
                                    }
                                    if (status === TaskStatus.Review) {
                                        buttons.push(
                                            <button key="back" type="button" onClick={() => {
                                                const updates: Partial<Task> = { ...formData, Status: TaskStatus.InProgress, ProgressPercent: 90, ActualEndDate: '' };
                                                setFormData(updates);
                                                onSubmit({ ...updates, StepCode: stepCode || updates.StepCode });
                                            }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-slate-600 hover:bg-bg-subtle dark:hover:bg-slate-700 text-txt-muted rounded-lg transition-all">
                                                ← Trả lại
                                            </button>
                                        );
                                    }

                                    // Forward buttons based on workflow
                                    if (status === TaskStatus.Todo) {
                                        // Todo → InProgress
                                        buttons.push(
                                            <button key="start" type="button" onClick={() => {
                                                const updates: Partial<Task> = { ...formData, Status: TaskStatus.InProgress, ProgressPercent: 25, ActualStartDate: todayISO() };
                                                setFormData(updates);
                                                onSubmit({ ...updates, StepCode: stepCode || updates.StepCode });
                                            }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm shadow-primary-500/25 transition-all active:scale-[0.97]">
                                                Bắt đầu thực hiện →
                                            </button>
                                        );
                                    } else if (status === TaskStatus.InProgress && prog >= 100) {
                                        // InProgress + 100% → Review (report completion)
                                        buttons.push(
                                            <button key="report" type="button" onClick={() => {
                                                const updates: Partial<Task> = { ...formData, Status: TaskStatus.Review, ProgressPercent: 100 };
                                                setFormData(updates);
                                                onSubmit({ ...updates, StepCode: stepCode || updates.StepCode });
                                            }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-warning-500 hover:bg-warning-600 rounded-lg shadow-sm shadow-warning-500/25 transition-all active:scale-[0.97] animate-pulse">
                                                📋 Báo cáo hoàn thành →
                                            </button>
                                        );
                                    } else if (status === TaskStatus.Review) {
                                        // Review → Done (approver confirms)
                                        buttons.push(
                                            <button key="approve" type="button" onClick={() => {
                                                const updates: Partial<Task> = { ...formData, Status: TaskStatus.Done, ProgressPercent: 100, ActualEndDate: todayISO() };
                                                if (!formData.ActualStartDate) updates.ActualStartDate = todayISO();
                                                setFormData(updates);
                                                onSubmit({ ...updates, StepCode: stepCode || updates.StepCode });
                                            }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm shadow-emerald-500/25 transition-all active:scale-[0.97]">
                                                ✅ Duyệt hoàn thành
                                            </button>
                                        );
                                    }
                                    // Done → show text only
                                    if (status === TaskStatus.Done) {
                                        buttons.push(
                                            <span key="done" className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg ring-1 ring-emerald-200 dark:ring-emerald-700">
                                                ✅ Đã hoàn thành
                                            </span>
                                        );
                                    }

                                    return buttons;
                                })()}

                                {isEditMode && (
                                    <button type="button"
                                        onClick={() => { onClose(); navigate(`/tasks/${formData.TaskID}`); }}
                                        className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl text-primary-500 transition-colors"
                                        title="Mở trang chi tiết"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                )}
                                <button type="button"
                                    onClick={onClose}
                                    className="p-2 hover:bg-bg-muted rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Progress bar */}
                        {isEditMode && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tiến độ</span>
                                    <span className={`text-xs font-black ${progress >= 100 ? 'text-emerald-600' : progress >= 50 ? 'text-primary-600' : 'text-gray-500'}`}>{progress}%</span>
                                </div>
                                <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-primary-500' : 'bg-primary-400'}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section tabs */}
                    <div className="flex overflow-x-auto px-4 gap-1 pb-0">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setActiveSection(s.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${activeSection === s.id
                                    ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                                    : 'text-txt-muted border-transparent hover:text-gray-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {s.icon} {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ══════════ SCROLLABLE BODY ══════════ */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-5">

                        {/* ── BASIC ── */}
                        {activeSection === 'basic' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                        <CheckSquare className="w-4 h-4 text-gray-400" /> Tên công việc <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" required
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="VD: Lập tờ trình thẩm định..."
                                        value={formData.Title}
                                        onChange={e => setFormData({ ...formData, Title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                        <AlignLeft className="w-4 h-4 text-gray-400" /> Diễn giải chi tiết
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none"
                                        placeholder="Nhập ghi chú, yêu cầu kỹ thuật..."
                                        value={formData.Description}
                                        onChange={e => setFormData({ ...formData, Description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                            <Folder className="w-4 h-4 text-gray-400" /> Dự án liên kết
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none bg-bg-surface text-txt-primary text-sm"
                                            value={formData.ProjectID || ''}
                                            onChange={e => setFormData({ ...formData, ProjectID: e.target.value })}
                                        >
                                            <option value="">-- Thuộc dự án (Tùy chọn) --</option>
                                            {projects.map(p => (
                                                <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-gray-400" /> Phân loại
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none bg-bg-surface text-txt-primary text-sm"
                                            value={formData.Category || ''}
                                            onChange={e => setFormData({ ...formData, Category: (e.target.value || undefined) as TaskCategory | undefined })}
                                        >
                                            <option value="">-- Chọn phân loại --</option>
                                            {TASK_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{TASK_CATEGORY_LABELS[cat]}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <MultiSelectEmployees
                                        label="Người thực hiện chính"
                                        icon={<User className="w-4 h-4 text-gray-400" />}
                                        selectedIds={formData.AssigneeIDs || []}
                                        onChange={ids => setFormData({ ...formData, AssigneeIDs: ids })}
                                        employees={dropdownEmployees}
                                        placeholder="-- Chọn người thực hiện chính --"
                                    />
                                    <MultiSelectEmployees
                                        label="Người phối hợp thực hiện"
                                        icon={<Users className="w-4 h-4 text-gray-400" />}
                                        selectedIds={formData.CollaboratorIDs || []}
                                        onChange={ids => setFormData({ ...formData, CollaboratorIDs: ids })}
                                        employees={employees}
                                        placeholder="-- Chọn người phối hợp (tùy chọn) --"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-txt-secondary">Trạng thái</label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none bg-bg-surface text-txt-primary text-sm"
                                            value={formData.Status}
                                            onChange={e => {
                                                const newStatus = e.target.value as TaskStatus;
                                                let newProgress = formData.ProgressPercent || 0;
                                                if (newStatus === TaskStatus.Done) newProgress = 100;
                                                else if (newStatus === TaskStatus.Todo) newProgress = 0;
                                                else if (newStatus === TaskStatus.InProgress && newProgress === 0) newProgress = 25;
                                                else if (newStatus === TaskStatus.Review && newProgress < 100) newProgress = 100;
                                                const updates: Partial<Task> = { ...formData, Status: newStatus, ProgressPercent: newProgress };
                                                if (newStatus === TaskStatus.InProgress && !formData.ActualStartDate) updates.ActualStartDate = todayISO();
                                                if (newStatus === TaskStatus.Done) {
                                                    if (!formData.ActualStartDate) updates.ActualStartDate = todayISO();
                                                    if (!formData.ActualEndDate) updates.ActualEndDate = todayISO();
                                                }
                                                if (newStatus === TaskStatus.Todo) { updates.ActualStartDate = ''; updates.ActualEndDate = ''; }
                                                setFormData(updates);
                                            }}
                                        >
                                            <option value={TaskStatus.Todo}>Chưa bắt đầu</option>
                                            <option value={TaskStatus.InProgress}>Đang thực hiện</option>
                                            <option value={TaskStatus.Done}>Hoàn thành</option>
                                            <option value={TaskStatus.Incomplete}>Chưa hoàn thành</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                            <Flag className="w-4 h-4 text-gray-400" /> Ưu tiên
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none bg-bg-surface text-txt-primary text-sm"
                                            value={formData.Priority}
                                            onChange={e => setFormData({ ...formData, Priority: e.target.value as TaskPriority })}
                                        >
                                            <option value="Low">Thấp</option>
                                            <option value="Medium">Trung bình</option>
                                            <option value="High">Cao</option>
                                            <option value="Urgent">Khẩn cấp</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-gray-400" /> Người phê duyệt
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none bg-bg-surface text-txt-primary text-sm"
                                            value={formData.ApproverID || ''}
                                            onChange={e => setFormData({ ...formData, ApproverID: e.target.value })}
                                        >
                                            <option value="">-- Chọn người duyệt --</option>
                                            {employees
                                                .filter(emp => emp.Position?.includes('Trưởng') || emp.Position?.includes('Giám đốc') || emp.Position?.includes('Phó'))
                                                .map(emp => (
                                                    <option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.FullName} - {emp.Position}</option>
                                                ))}
                                            {/* Nếu người phê duyệt hiện tại không nằm trong danh sách lọc, vẫn hiển thị */}
                                            {formData.ApproverID && !employees.some(e =>
                                                e.EmployeeID === formData.ApproverID &&
                                                (e.Position?.includes('Trưởng') || e.Position?.includes('Giám đốc') || e.Position?.includes('Phó'))
                                            ) && (() => {
                                                const approver = employees.find(e => e.EmployeeID === formData.ApproverID);
                                                return approver ? <option key={approver.EmployeeID} value={approver.EmployeeID}>{approver.FullName} - {approver.Position}</option> : null;
                                            })()}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" /> Cấp thực hiện
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none bg-bg-surface text-txt-primary text-sm"
                                            value={formData.ResponsibilityLevel || 'individual'}
                                            onChange={e => setFormData({ ...formData, ResponsibilityLevel: e.target.value as ResponsibilityLevel })}
                                        >
                                            <option value="individual">Cá nhân</option>
                                            <option value="team">Tập thể phòng</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Kết quả thực hiện — hiện khi Done, InProgress hoặc Incomplete */}
                                {(formData.Status === TaskStatus.Done || formData.Status === TaskStatus.InProgress || formData.Status === TaskStatus.Incomplete) && (
                                    <div className={`p-4 rounded-xl border ${formData.Status === TaskStatus.Done ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-bg-subtle border-border'}`}>
                                        <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2 mb-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kết quả thực hiện {formData.Status === TaskStatus.Done && <span className="text-red-500">*</span>}
                                        </label>
                                        <textarea
                                            required={formData.Status === TaskStatus.Done}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 outline-none h-20 resize-none text-sm"
                                            placeholder="Mô tả kết quả đạt được: VD Đã phê duyệt tại QĐ số..."
                                            value={formData.CompletionResult || ''}
                                            onChange={e => setFormData({ ...formData, CompletionResult: e.target.value })}
                                        />
                                    </div>
                                )}

                                {/* Lý do chưa hoàn thành — hiện khi Incomplete */}
                                {formData.Status === TaskStatus.Incomplete && (
                                    <div className="p-4 rounded-xl border bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800">
                                        <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2 mb-1.5">
                                            <AlertTriangle className="w-4 h-4 text-rose-500" /> Lý do chưa hoàn thành <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            required
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 outline-none h-20 resize-none text-sm"
                                            placeholder="Lý do chưa hoàn thành, vướng mắc cần giải quyết..."
                                            value={formData.IncompleteReason || ''}
                                            onChange={e => setFormData({ ...formData, IncompleteReason: e.target.value })}
                                        />
                                    </div>
                                )}

                                {/* Ghi chú */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-gray-400" /> Ghi chú
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 outline-none h-16 resize-none text-sm"
                                        placeholder="Ghi chú bổ sung (tùy chọn)..."
                                        value={formData.Notes || ''}
                                        onChange={e => setFormData({ ...formData, Notes: e.target.value })}
                                    />
                                </div>

                                {/* Khó khăn / Vướng mắc */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Khó khăn / Vướng mắc
                                        <span className="text-xs font-normal text-slate-400">(hiển thị trong báo cáo giao ban)</span>
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10 text-txt-primary focus:ring-2 focus:ring-amber-400/30 outline-none h-20 resize-none text-sm"
                                        placeholder="Mô tả các khó khăn, vướng mắc cần tháo gỡ trong quá trình thực hiện..."
                                        value={formData.Obstacles || ''}
                                        onChange={e => setFormData({ ...formData, Obstacles: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        {/* ── SCHEDULE ── */}
                        {activeSection === 'schedule' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" /> Ngày bắt đầu
                                        </label>
                                        <DateInputVN value={formData.StartDate} onChange={v => setFormData({ ...formData, StartDate: v })} borderClass="border-gray-300 dark:border-slate-600 focus-within:ring-2 focus-within:ring-primary-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-txt-secondary flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" /> Hạn hoàn thành
                                        </label>
                                        <DateInputVN value={formData.DueDate} onChange={v => setFormData({ ...formData, DueDate: v })} borderClass="border-gray-300 dark:border-slate-600 focus-within:ring-2 focus-within:ring-primary-500" />
                                    </div>
                                </div>

                                {/* Multi-month warning (Điều 8.5) */}
                                {isMultiMonth && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2 text-amber-800 dark:text-amber-300 text-xs leading-relaxed animate-in fade-in duration-200">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                                        <div>
                                            <span className="font-bold">Cảnh báo:</span> Theo Quy chế KHCV (Điều 8.5), công việc không nên kéo dài nhiều tháng. Vui lòng chia nhỏ thành các công việc theo từng tháng tương ứng.
                                        </div>
                                    </div>
                                )}

                                {/* Actual dates */}
                                <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg border ${(formData.ActualStartDate || formData.ActualEndDate) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' : 'bg-bg-subtle border-border'}`}>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-emerald-500" /> Bắt đầu thực tế
                                        </label>
                                        <DateInputVN value={formData.ActualStartDate} onChange={v => setFormData({ ...formData, ActualStartDate: v })} borderClass="border-emerald-300 dark:border-emerald-700" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                            <CheckSquare className="w-4 h-4 text-emerald-500" /> Hoàn thành thực tế
                                        </label>
                                        <DateInputVN value={formData.ActualEndDate} onChange={v => setFormData({ ...formData, ActualEndDate: v })} borderClass="border-emerald-300 dark:border-emerald-700" />
                                    </div>
                                </div>

                                {/* Progress slider */}
                                <ProgressSlider
                                    value={formData.ProgressPercent || 0}
                                    onChange={(value) => {
                                        let newStatus = formData.Status;
                                        // Keep InProgress at 100% — user must click "Báo cáo hoàn thành" to move to Review
                                        if (value >= 1) newStatus = TaskStatus.InProgress;
                                        else newStatus = TaskStatus.Todo;
                                        // Don't change status if already Review or Done
                                        if (formData.Status === TaskStatus.Review || formData.Status === TaskStatus.Done) newStatus = formData.Status;
                                        const updates: Partial<Task> = { ...formData, ProgressPercent: value, Status: newStatus };
                                        if (value > 0 && !formData.ActualStartDate) updates.ActualStartDate = todayISO();
                                        if (value === 0) { updates.ActualStartDate = ''; updates.ActualEndDate = ''; }
                                        setFormData(updates);
                                    }}
                                />
                            </>
                        )}

                        {/* ── SUBTASKS ── */}
                        {activeSection === 'subtasks' && isEditMode && (
                            <>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black text-txt-muted uppercase tracking-widest">Công việc thuộc bước</h3>
                                    <button type="button" onClick={() => { setIsSubTaskModalOpen(true); setEditingSubTask(null); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Thêm
                                    </button>
                                </div>

                                {/* Parent deadline banner */}
                                {formData.DueDate && (
                                    <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${new Date(formData.DueDate) < new Date() ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200'}`}>
                                        <Calendar className={`w-4 h-4 ${new Date(formData.DueDate) < new Date() ? 'text-red-500' : 'text-primary-500'}`} />
                                        <span className="text-xs text-gray-500">Hạn công việc cha:</span>
                                        <span className={`text-xs font-bold ${new Date(formData.DueDate) < new Date() ? 'text-red-600' : 'text-primary-700'}`}>
                                            {new Date(formData.DueDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {(formData.SubTasks || []).length === 0 && (
                                        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                                            <Layers className="w-8 h-8 text-gray-200 dark:text-slate-600 mx-auto mb-2" />
                                            <p className="text-xs text-gray-400 italic">Chưa có công việc thuộc bước</p>
                                        </div>
                                    )}
                                    {(formData.SubTasks || []).map((sub, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-bg-subtle rounded-xl group/sub border border-transparent hover:border-gray-200 dark:hover:border-slate-600 hover:bg-bg-surface dark:hover:bg-slate-700 transition-all">
                                            <div
                                                onClick={() => toggleSubTaskDone(idx)}
                                                className={`mt-0.5 w-5 h-5 rounded-lg border-2 cursor-pointer flex items-center justify-center transition-all ${(sub.Status as any) === 'Done' || sub.Status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-gray-300 bg-bg-surface hover:border-primary-400'}`}
                                            >
                                                {(sub.Status as any) === 'Done' || sub.Status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                                            </div>
                                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingSubTask(sub); setIsSubTaskModalOpen(true); }}>
                                                <p className={`text-xs font-semibold ${(sub.Status as any) === 'Done' || sub.Status === 'done' ? 'text-gray-400' : 'text-txt-secondary'}`}>{sub.Title}</p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-[10px] text-gray-400 bg-bg-surface px-2 py-0.5 rounded-md ring-1 ring-gray-100 dark:ring-slate-600 flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {sub.AssigneeID ? employees.find(e => e.EmployeeID === sub.AssigneeID)?.FullName : 'Chưa gán'}
                                                    </span>
                                                    {sub.DueDate && (
                                                        <span className="text-[10px] text-gray-400 bg-bg-surface px-2 py-0.5 rounded-md ring-1 ring-gray-100 dark:ring-slate-600 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> {sub.DueDate}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => deleteSubTask(idx)}
                                                className="opacity-0 group-hover/sub:opacity-100 transition-opacity text-gray-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── DOCUMENTS ── */}
                        {activeSection === 'documents' && isEditMode && (
                            <>
                                {/* Template documents */}
                                {templates.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-warning-600 dark:text-warning-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                            <Scale className="w-3 h-3" /> Tài liệu mẫu theo quy định
                                        </p>
                                        <div className="space-y-1.5">
                                            {templates.map((tpl, idx) => {
                                                const ftc = getFileTypeColor(tpl.fileType);
                                                const FileIcon = tpl.fileType === 'xlsx' ? FileSpreadsheet : tpl.fileType === 'pdf' ? File : FileText;
                                                return (
                                                    <div key={idx} className="flex items-center gap-3 p-3 bg-bg-subtle rounded-xl ring-1 ring-gray-100 dark:ring-slate-700 hover:ring-warning-200 transition-all">
                                                        <div className={`p-2 rounded-xl ${ftc.bg}`}>
                                                            <FileIcon className={`w-4 h-4 ${ftc.text}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-txt-secondary flex items-center gap-2">
                                                                {tpl.name}
                                                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${ftc.bg} ${ftc.text}`}>{tpl.fileType}</span>
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{tpl.description}</p>
                                                        </div>
                                                        {tpl.templatePath && getTemplateConfig(tpl.templatePath) && (
                                                            <button type="button" onClick={() => setActiveExportTemplate(tpl)}
                                                                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-warning-500 text-white text-[10px] font-bold shadow-sm hover:shadow-md transition-all active:scale-95">
                                                                <Download className="w-3 h-3" /> Xuất DOCX
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Uploaded */}
                                {(formData.Attachments || []).length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                            <Upload className="w-3 h-3" /> Tài liệu đã tải lên
                                        </p>
                                        <div className="space-y-1.5">
                                            {(formData.Attachments || []).map(att => (
                                                <div key={att.id} className="flex items-center gap-3 p-3 bg-emerald-50/40 dark:bg-emerald-900/10 rounded-xl ring-1 ring-emerald-100 dark:ring-emerald-900/30 group/att">
                                                    <div className="p-2 bg-bg-surface rounded-xl shadow-sm ring-1 ring-emerald-100 shrink-0">
                                                        <FileText className="w-4 h-4 text-emerald-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-txt-secondary hover:text-primary-600 truncate block">{att.name}</a>
                                                        <p className="text-[10px] text-gray-400">{att.size} • {att.uploadDate}</p>
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveAttachment(att.id)}
                                                        className="opacity-0 group-hover/att:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-all">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Upload button */}
                                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.zip,.rar" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                                    className="w-full text-center py-3.5 text-xs font-bold text-primary-600 hover:bg-primary-50 rounded-xl transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-primary-200 hover:border-primary-300 disabled:opacity-50">
                                    {isUploading ? (<><div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> Đang tải...</>) : (<><Upload className="w-4 h-4" /> Thêm tài liệu</>)}
                                </button>
                            </>
                        )}

                        {/* ── ADVANCED ── */}
                        {activeSection === 'advanced' && (
                            <>
                                {timelineStep && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-subtle border border-border">
                                        <Layers className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bước quy trình</p>
                                            <p className="text-xs text-txt-muted">{stepLabel || timelineStep}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 bg-bg-subtle rounded-xl border border-border">
                                    <TaskDependencyManager task={formData as Task} allTasks={allTasks} onUpdate={handleDependencyUpdate} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-txt-secondary">Căn cứ pháp lý</label>
                                        <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 outline-none" placeholder="VD: Điều 24 Luật ĐTC" value={formData.LegalBasis || ''} onChange={e => setFormData({ ...formData, LegalBasis: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-txt-secondary">Sản phẩm đầu ra</label>
                                        <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 outline-none" placeholder="VD: Quyết định phê duyệt" value={formData.OutputDocument || ''} onChange={e => setFormData({ ...formData, OutputDocument: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-txt-secondary">Thời gian (ngày)</label>
                                    <input type="number" min="1" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 outline-none" placeholder="15" value={formData.DurationDays || ''} onChange={e => setFormData({ ...formData, DurationDays: parseInt(e.target.value) || undefined })} />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-txt-secondary">Người phê duyệt</label>
                                    <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none bg-bg-surface text-txt-primary" value={formData.ApproverID || ''} onChange={e => setFormData({ ...formData, ApproverID: e.target.value })}>
                                        <option value="">-- Chọn --</option>
                                        {employees.filter(emp => emp.Position?.includes('Trưởng') || emp.Position?.includes('Giám đốc') || emp.Position?.includes('Phó')).map(emp => (
                                            <option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.FullName} - {emp.Position}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-700">
                                    <input type="checkbox" id="isCritical" className="w-4 h-4 text-warning-600 border-warning-300 rounded focus:ring-warning-500" checked={formData.IsCritical || false} onChange={e => setFormData({ ...formData, IsCritical: e.target.checked })} />
                                    <label htmlFor="isCritical" className="text-sm font-medium text-warning-700 dark:text-warning-300">Critical Path (ảnh hưởng tiến độ dự án)</label>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ══════════ FOOTER ══════════ */}
                    <div className="sticky bottom-0 px-6 py-4 border-t border-border bg-bg-surface flex items-center justify-between shrink-0">
                        {saveSuccess && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in duration-200">
                                ✅ Đã lưu thành công
                            </span>
                        )}
                        {saveError && (
                            <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-200">
                                ❌ {saveError}
                            </span>
                        )}
                        {!saveSuccess && !saveError && <div />}
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 text-txt-muted font-medium hover:bg-bg-muted rounded-lg transition-colors disabled:opacity-50">
                                {isEditMode ? 'Đóng' : 'Hủy bỏ'}
                            </button>
                            <button type="submit" disabled={isSubmitting} className={`px-6 py-2.5 font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${saveSuccess ? 'bg-emerald-500 text-white shadow-emerald-500/25' : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-primary-500/25 hover:from-primary-600 hover:to-primary-700'}`}>
                                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {isEditMode ? (saveSuccess ? '✅ Đã lưu' : 'Lưu thay đổi') : 'Tạo công việc'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* ══════════ SUBTASK INLINE MODAL ══════════ */}
            {isSubTaskModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-bg-surface rounded-2xl shadow-sm w-full max-w-md overflow-hidden ring-1 ring-black/5">
                        <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center">
                            <h3 className="text-base font-bold text-txt-primary">{editingSubTask ? 'Sửa công việc thuộc bước' : 'Thêm công việc thuộc bước'}</h3>
                            <button type="button" onClick={() => { setIsSubTaskModalOpen(false); setEditingSubTask(null); }} className="p-2 hover:bg-bg-muted rounded-xl text-gray-400">✕</button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            handleSubTaskSave(fd.get('title') as string, fd.get('assignee') as string, fd.get('dueDate') as string);
                        }} className="p-4 space-y-4">
                            {formData.DueDate && (
                                <div className={`flex items-center gap-3 p-3 rounded-xl border ${new Date(formData.DueDate) < new Date() ? 'bg-red-50 border-red-200' : 'bg-primary-50 border-primary-200'}`}>
                                    <AlertTriangle className={`w-4 h-4 ${new Date(formData.DueDate) < new Date() ? 'text-red-500' : 'text-primary-500'}`} />
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase text-gray-500">Hạn công việc cha</p>
                                        <p className={`text-sm font-black ${new Date(formData.DueDate) < new Date() ? 'text-red-600' : 'text-primary-700'}`}>
                                            {new Date(formData.DueDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Nội dung</label>
                                <input defaultValue={editingSubTask?.Title || ''} name="title" required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" placeholder="Nhập tên công việc..." />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Người thực hiện</label>
                                <select defaultValue={editingSubTask?.AssigneeID || ''} name="assignee" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                                    <option value="">-- Chọn --</option>
                                    {dropdownEmployees.filter(e => e.Status === 1 || e.Status === 'active' as any).map(e => (
                                        <option key={e.EmployeeID} value={e.EmployeeID}>{e.FullName} - {e.Department}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Hạn hoàn thành</label>
                                <input defaultValue={editingSubTask?.DueDate || ''} type="date" name="dueDate" max={formData.DueDate ? toYMD(formData.DueDate) : undefined} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                                <button type="button" onClick={() => { setIsSubTaskModalOpen(false); setEditingSubTask(null); }} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Hủy</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-sm active:scale-[0.98]">
                                    {editingSubTask ? 'Lưu' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Template Export Modal */}
            {activeExportTemplate?.templatePath && (
                <TemplateExportModal
                    isOpen={!!activeExportTemplate}
                    onClose={() => setActiveExportTemplate(null)}
                    templatePath={activeExportTemplate.templatePath}
                    templateLabel={activeExportTemplate.name}
                    project={project || null}
                    stepTitle={formData.StepCode ? getTimelineStepLabel(formData.StepCode) : undefined}
                    stepCode={formData.StepCode}
                />
            )}
        </>
    );
};
