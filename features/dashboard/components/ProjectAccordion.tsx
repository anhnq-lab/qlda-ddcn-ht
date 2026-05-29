import React from 'react';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import type { ProjectBriefingData } from '../../../services/DashboardService';

import { SectionHeader, StatusBadge, ProgressBar, TaskCountBadges } from './project_accordion/ProjectAccordionHeader';
import { ProjectStatusColumn } from './project_accordion/ProjectStatusColumn';
import { CompletedTasksColumn } from './project_accordion/CompletedTasksColumn';
import { IssuesColumn } from './project_accordion/IssuesColumn';
import { NextMonthColumn } from './project_accordion/NextMonthColumn';
import { LeaderCommentSection } from './project_accordion/LeaderCommentSection';

interface ProjectAccordionProps {
    projects: ProjectBriefingData[];
    expandedProjects: Set<string>;
    expandAll: boolean;
    onToggleProject: (id: string) => void;
    onToggleAll: () => void;
    // Comment editing
    isLeader: boolean;
    editingProjectId: string | null;
    commentText: string;
    onCommentChange: (text: string) => void;
    isSavingComment: boolean;
    onStartEditComment: (projectId: string, existing: string) => void;
    onCancelEditComment: () => void;
    onSaveComment: (projectId: string) => void;
    // Inline task creation
    currentUser: any;
    addingTaskProjectId: string | null;
    newTaskTitle: string;
    onNewTaskTitleChange: (title: string) => void;
    newTaskAssigneeId: string;
    onNewTaskAssigneeChange: (id: string) => void;
    isCreatingTask: boolean;
    onStartAddTask: (projectId: string) => void;
    onCancelAddTask: () => void;
    onCreateTask: (projectId: string) => void;
    employees: Array<{ employee_id: string; full_name: string; department?: string }>;
}

export const ProjectAccordion: React.FC<ProjectAccordionProps> = React.memo(({
    projects,
    expandedProjects,
    expandAll,
    onToggleProject,
    onToggleAll,
    isLeader,
    editingProjectId,
    commentText,
    onCommentChange,
    isSavingComment,
    onStartEditComment,
    onCancelEditComment,
    onSaveComment,
    currentUser,
    addingTaskProjectId,
    newTaskTitle,
    onNewTaskTitleChange,
    newTaskAssigneeId,
    onNewTaskAssigneeChange,
    isCreatingTask,
    onStartAddTask,
    onCancelAddTask,
    onCreateTask,
    employees,
}) => {
    if (projects.length === 0) {
        return (
            <div className="space-y-4">
                <SectionHeader expandAll={expandAll} onToggleAll={onToggleAll} />
                <div className="bg-bg-surface rounded-xl border border-dashed border-border p-10 text-center">
                    <p className="text-txt-muted text-sm italic">Không có dữ liệu dự án tháng này.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <SectionHeader expandAll={expandAll} onToggleAll={onToggleAll} />

            <div className="space-y-2">
                {projects.map(proj => {
                    const isExpanded = expandedProjects.has(proj.projectId);
                    const hasIssues = proj.issues.length > 0;

                    return (
                        <div
                            key={proj.projectId}
                            className={`bg-bg-surface border rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.01)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-200 ${isExpanded ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-border hover:border-slate-300 dark:hover:border-slate-700'}`}
                        >
                            {/* ── Accordion Header ── */}
                            <button
                                onClick={() => onToggleProject(proj.projectId)}
                                className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center py-2 px-3.5 gap-2 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors text-left"
                                aria-expanded={isExpanded}
                                aria-controls={`proj-content-${proj.projectId}`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <ChevronRight
                                        className={`w-4 h-4 text-txt-placeholder shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-primary-500' : ''}`}
                                        aria-hidden="true"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-txt-primary text-sm leading-snug hover:text-primary-600 transition-colors truncate">
                                            {proj.projectName}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                            <StatusBadge proj={proj} />
                                            {proj.projectId !== 'internal_admin' && <ProgressBar progress={proj.progress} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Summary badges */}
                                <div className="flex flex-wrap items-center gap-1.5 lg:gap-2 shrink-0 w-full lg:w-auto pl-6 lg:pl-0">
                                    {proj.disbursedAmount > 0 && (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            +{formatCurrency(proj.disbursedAmount)}
                                        </span>
                                    )}
                                    <TaskCountBadges proj={proj} hasIssues={hasIssues} />
                                </div>
                            </button>

                            {/* ── Accordion Content ── */}
                            {isExpanded && (
                                <div
                                    id={`proj-content-${proj.projectId}`}
                                    className="border-t border-border-subtle bg-slate-50/30 dark:bg-slate-900/10 p-3 lg:p-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                                        {/* Col 1: Status & Disbursement */}
                                        <ProjectStatusColumn proj={proj} />

                                        {/* Col 2: Completed tasks */}
                                        <CompletedTasksColumn tasks={proj.completedTasks} />

                                        {/* Col 3: Issues */}
                                        <IssuesColumn
                                            incompleteTasks={proj.incompleteTasks}
                                            inProgressTasks={proj.inProgressTasks}
                                            issues={proj.issues}
                                        />

                                        {/* Col 4: Next month plan */}
                                        <NextMonthColumn
                                            proj={proj}
                                            currentUser={currentUser}
                                            addingTaskProjectId={addingTaskProjectId}
                                            newTaskTitle={newTaskTitle}
                                            onNewTaskTitleChange={onNewTaskTitleChange}
                                            newTaskAssigneeId={newTaskAssigneeId}
                                            onNewTaskAssigneeChange={onNewTaskAssigneeChange}
                                            isCreatingTask={isCreatingTask}
                                            onStartAddTask={onStartAddTask}
                                            onCancelAddTask={onCancelAddTask}
                                            onCreateTask={onCreateTask}
                                            employees={employees}
                                        />
                                    </div>

                                    {/* Leader Comment */}
                                    <LeaderCommentSection
                                        proj={proj}
                                        isLeader={isLeader}
                                        editingProjectId={editingProjectId}
                                        commentText={commentText}
                                        onCommentChange={onCommentChange}
                                        isSavingComment={isSavingComment}
                                        onStartEdit={onStartEditComment}
                                        onCancel={onCancelEditComment}
                                        onSave={onSaveComment}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

ProjectAccordion.displayName = 'ProjectAccordion';
