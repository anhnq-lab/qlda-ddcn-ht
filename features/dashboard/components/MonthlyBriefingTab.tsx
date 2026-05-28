/**
 * MonthlyBriefingTab — Tab "Báo cáo giao ban tháng" trong Dashboard.
 *
 * Refactored từ monolith 997 dòng → orchestrator ~130 dòng:
 *   - Logic & state  → useMonthlyBriefing hook
 *   - Toolbar        → BriefingToolbar
 *   - KPI cards      → BriefingKPICards
 *   - Dept tasks     → DeptTaskSummary
 *   - QCKHCV rank   → DeptRankingSection
 *   - Project detail → ProjectAccordion
 */
import React from 'react';
import { MonthlyReportModal } from './MonthlyReportModal';
import { BriefingToolbar } from './BriefingToolbar';
import { BriefingKPICards } from './BriefingKPICards';
import { DeptTaskSummary } from './DeptTaskSummary';

import { ProjectAccordion } from './ProjectAccordion';
import { useMonthlyBriefing } from '../hooks/useMonthlyBriefing';

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const BriefingSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-bg-subtle rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-bg-subtle rounded-xl" />
            ))}
        </div>
        <div className="h-64 bg-bg-subtle rounded-xl" />
        <div className="h-48 bg-bg-subtle rounded-xl" />
        <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-bg-subtle rounded-xl" />
            ))}
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const MonthlyBriefingTab: React.FC<{ selectedYear: number; selectedBoard?: string }> = ({
    selectedYear,
    selectedBoard = 'all',
}) => {
    const briefing = useMonthlyBriefing(selectedYear, selectedBoard);

    const {
        selectedMonth, setSelectedMonth,
        showReportModal, setShowReportModal,
        selectedDept, setSelectedDept,
        expandedCategories, toggleCategory,
        expandedProjects, expandAll,
        toggleProject, handleToggleAll,
        editingProjectId, commentText, setCommentText,
        isSavingComment, handleSaveComment,
        startEditComment, cancelEditComment,
        addingTaskProjectId, newTaskTitle, setNewTaskTitle,
        newTaskAssigneeId, setNewTaskAssigneeId,
        isCreatingTask, handleCreateTask,
        startAddTask, cancelAddTask,
        stats, isLoading, isProjectLoading, error, refetch,
        taskBriefing, filteredProjectBriefing, deptScores,
        employees, disbursementRate,
        currentUser, isLeader,
    } = briefing;

    // ── Loading ─────────────────────────────────────────────────────────────
    if (isLoading || isProjectLoading) {
        return <BriefingSkeleton />;
    }

    // ── Error ───────────────────────────────────────────────────────────────
    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
                <p className="text-sm font-medium text-red-500">
                    {error instanceof Error ? error.message : 'Không thể tải dữ liệu'}
                </p>
                <button
                    onClick={() => refetch()}
                    className="btn btn-outline text-sm"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6 animate-fade-in fade-in-up">
                {/* ── Toolbar ── */}
                <BriefingToolbar
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    onOpenReportModal={() => setShowReportModal(true)}
                />

                {/* ── KPI Cards ── */}
                <BriefingKPICards
                    stats={stats}
                    disbursementRate={disbursementRate}
                />

                {/* ── Department Task Summary ── */}
                <DeptTaskSummary
                    taskBriefing={taskBriefing}
                    selectedDept={selectedDept}
                    onSelectDept={setSelectedDept}
                    expandedCategories={expandedCategories}
                    onToggleCategory={toggleCategory}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                />

                {/* ── Project Accordion ── */}
                <ProjectAccordion
                    projects={filteredProjectBriefing}
                    expandedProjects={expandedProjects}
                    expandAll={expandAll}
                    onToggleProject={toggleProject}
                    onToggleAll={handleToggleAll}
                    isLeader={isLeader}
                    editingProjectId={editingProjectId}
                    commentText={commentText}
                    onCommentChange={setCommentText}
                    isSavingComment={isSavingComment}
                    onStartEditComment={startEditComment}
                    onCancelEditComment={cancelEditComment}
                    onSaveComment={handleSaveComment}
                    currentUser={currentUser}
                    addingTaskProjectId={addingTaskProjectId}
                    newTaskTitle={newTaskTitle}
                    onNewTaskTitleChange={setNewTaskTitle}
                    newTaskAssigneeId={newTaskAssigneeId}
                    onNewTaskAssigneeChange={setNewTaskAssigneeId}
                    isCreatingTask={isCreatingTask}
                    onStartAddTask={startAddTask}
                    onCancelAddTask={cancelAddTask}
                    onCreateTask={handleCreateTask}
                    employees={employees}
                />
            </div>

            {/* ── Modal (mounted outside layout flow) ── */}
            {showReportModal && stats && (
                <MonthlyReportModal
                    month={selectedMonth}
                    year={selectedYear}
                    stats={stats}
                    onClose={() => setShowReportModal(false)}
                />
            )}
        </>
    );
};
