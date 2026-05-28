import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardService } from '../../../services/DashboardService';
import { RegulationScoringService } from '../../regulation-scoring/services/scoringService';
import { TaskService } from '../../../services/TaskService';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

export type { TaskBriefingSummary, ProjectBriefingData } from '../../../services/DashboardService';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMonthlyBriefing(selectedYear: number, selectedBoard: string = 'all') {
    const { currentUser, supabaseUser } = useAuth();
    const queryClient = useQueryClient();

    // ─── Role Check ──────────────────────────────────────────────────────────
    const pos = currentUser?.Position?.toLowerCase() || '';
    const isLeader = useMemo(() =>
        pos.includes('giám đốc') ||
        (currentUser?.Role as string) === 'Admin' ||
        (currentUser?.Role as string) === 'director' ||
        (currentUser?.Role as string) === 'admin' ||
        (currentUser as any)?.SystemRole === 'admin',
        [pos, currentUser]
    );

    // ─── Local UI State ───────────────────────────────────────────────────────
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['internal_admin']));
    const [expandAll, setExpandAll] = useState(false);

    // Comment editing
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState<string>('');
    const [isSavingComment, setIsSavingComment] = useState<boolean>(false);

    // Inline task creation
    const [addingTaskProjectId, setAddingTaskProjectId] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState<string>('');
    const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>('');
    const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);

    // ─── React Query Hooks ────────────────────────────────────────────────────
    const {
        data: stats,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['dashboard', 'monthlyBriefing', selectedMonth, selectedYear],
        queryFn: () => DashboardService.getMonthlyBriefingStats(selectedMonth, selectedYear),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const { data: taskBriefing = [] } = useQuery({
        queryKey: ['dashboard', 'taskBriefing', selectedMonth, selectedYear],
        queryFn: () => DashboardService.getTaskBriefingSummary(selectedMonth, selectedYear),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const { data: projectBriefing = [], isLoading: isProjectLoading } = useQuery({
        queryKey: ['dashboard', 'projectBriefing', selectedMonth, selectedYear],
        queryFn: () => DashboardService.getProjectBriefingData(selectedMonth, selectedYear),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const { data: deptScores = [] } = useQuery({
        queryKey: ['dashboard', 'deptScores', selectedMonth, selectedYear],
        queryFn: () => RegulationScoringService.getDeptScores(selectedMonth, selectedYear),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    // Employees — only needed for task creation, use long staleTime
    const { data: employees = [] } = useQuery({
        queryKey: ['dashboard', 'employeesList'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('employee_id, full_name, department')
                .order('full_name', { ascending: true });
            if (error) {
                console.error('Error fetching employees:', error);
                return [];
            }
            // Normalize null department to undefined for consistent typing
            return (data || []).map(e => ({
                ...e,
                department: e.department ?? undefined,
            }));
        },
        staleTime: 10 * 60 * 1000,
    });

    // ─── Derived / Memoized Data ──────────────────────────────────────────────
    const filteredProjectBriefing = useMemo(() => {
        if (!selectedBoard || selectedBoard === 'all') return projectBriefing;
        return projectBriefing.filter(p => {
            if (p.projectId === 'internal_admin') return true;
            return p.managementBoard?.toString() === selectedBoard;
        });
    }, [projectBriefing, selectedBoard]);

    const disbursementRate = useMemo(() =>
        stats?.disbursedTarget && stats.disbursedTarget > 0
            ? Math.round((stats.disbursedThisMonth / stats.disbursedTarget) * 100)
            : 0,
        [stats]
    );

    // ─── Callbacks ────────────────────────────────────────────────────────────
    const toggleProject = useCallback((projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId);
            else next.add(projectId);
            return next;
        });
    }, []);

    const handleToggleAll = useCallback(() => {
        if (expandAll) {
            setExpandedProjects(new Set());
        } else {
            setExpandedProjects(new Set(filteredProjectBriefing.map(p => p.projectId)));
        }
        setExpandAll(prev => !prev);
    }, [expandAll, filteredProjectBriefing]);

    const toggleCategory = useCallback((key: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const handleSaveComment = useCallback(async (projectId: string) => {
        setIsSavingComment(true);
        try {
            const success = await DashboardService.updateProjectLeaderComment(
                projectId, commentText.trim(), selectedMonth, selectedYear
            );
            if (success) {
                queryClient.invalidateQueries({
                    queryKey: ['dashboard', 'projectBriefing', selectedMonth, selectedYear],
                });
                setEditingProjectId(null);
            } else {
                console.error('Failed to save comment');
            }
        } catch (e) {
            console.error('Error saving comment:', e);
        } finally {
            setIsSavingComment(false);
        }
    }, [commentText, selectedMonth, selectedYear, queryClient]);

    const handleCreateTask = useCallback(async (projectId: string) => {
        if (!newTaskTitle.trim() || !newTaskAssigneeId) return;

        setIsCreatingTask(true);
        try {
            const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
            const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
            const lastDay = new Date(nextYear, nextMonth, 0).getDate();
            const nextEndDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            const nextStartDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

            await TaskService.createTask({
                title: newTaskTitle.trim(),
                project_id: projectId === 'internal_admin' ? null : projectId,
                assignee_id: newTaskAssigneeId,
                due_date: nextEndDate,
                start_date: nextStartDate,
                status: 'todo',
                priority: 'medium',
                task_type: projectId === 'internal_admin' ? 'internal' : 'project',
                progress: 0,
                created_by: supabaseUser?.id || null,
            } as any);

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ['dashboard', 'projectBriefing', selectedMonth, selectedYear],
                }),
                queryClient.invalidateQueries({
                    queryKey: ['dashboard', 'taskBriefing', selectedMonth, selectedYear],
                }),
            ]);

            setAddingTaskProjectId(null);
            setNewTaskTitle('');
            setNewTaskAssigneeId('');
        } catch (e) {
            console.error('Error creating task:', e);
        } finally {
            setIsCreatingTask(false);
        }
    }, [newTaskTitle, newTaskAssigneeId, selectedMonth, selectedYear, supabaseUser, queryClient]);

    const startEditComment = useCallback((projectId: string, existingComment: string) => {
        setEditingProjectId(projectId);
        setCommentText(existingComment || '');
    }, []);

    const cancelEditComment = useCallback(() => {
        setEditingProjectId(null);
        setCommentText('');
    }, []);

    const startAddTask = useCallback((projectId: string) => {
        setAddingTaskProjectId(projectId);
        setNewTaskTitle('');
        setNewTaskAssigneeId('');
    }, []);

    const cancelAddTask = useCallback(() => {
        setAddingTaskProjectId(null);
    }, []);

    // ─── Return ───────────────────────────────────────────────────────────────
    return {
        // Auth
        currentUser,
        isLeader,
        // Month state
        selectedMonth,
        setSelectedMonth,
        // Modal state
        showReportModal,
        setShowReportModal,
        // UI state — department filter
        selectedDept,
        setSelectedDept,
        expandedCategories,
        toggleCategory,
        // UI state — project accordion
        expandedProjects,
        expandAll,
        toggleProject,
        handleToggleAll,
        // Comment state
        editingProjectId,
        commentText,
        setCommentText,
        isSavingComment,
        handleSaveComment,
        startEditComment,
        cancelEditComment,
        // Task creation state
        addingTaskProjectId,
        newTaskTitle,
        setNewTaskTitle,
        newTaskAssigneeId,
        setNewTaskAssigneeId,
        isCreatingTask,
        handleCreateTask,
        startAddTask,
        cancelAddTask,
        // Data queries
        stats,
        isLoading,
        isProjectLoading,
        error,
        refetch,
        taskBriefing,
        filteredProjectBriefing,
        deptScores,
        employees,
        // Computed
        disbursementRate,
    };
}
