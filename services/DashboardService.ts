import { DashboardMetricsService, DashboardOverviewMetrics, DirectorDashboardData, DepartmentDashboardData } from './DashboardMetricsService';
import { DashboardCapitalService, DashboardProjectRow } from './DashboardCapitalService';
import { DashboardBriefingService, MonthlyBriefingStats, ProjectBriefingData, TaskBriefingItem, TaskBriefingCategoryGroup, TaskBriefingSummary } from './DashboardBriefingService';

export type {
    DashboardOverviewMetrics,
    DirectorDashboardData,
    DepartmentDashboardData,
    DashboardProjectRow,
    MonthlyBriefingStats,
    ProjectBriefingData,
    TaskBriefingItem,
    TaskBriefingCategoryGroup,
    TaskBriefingSummary
};

export const DashboardService = {
    // 1. Metrics & RPCs
    getDirectorDashboardData: DashboardMetricsService.getDirectorDashboardData,
    getDepartmentDashboardData: DashboardMetricsService.getDepartmentDashboardData,
    getOverviewMetrics: DashboardMetricsService.getOverviewMetrics,
    getTaskCompletion: DashboardMetricsService.getTaskCompletion,
    getRisks: DashboardMetricsService.getRisks,
    getMaterialMines: DashboardMetricsService.getMaterialMines,

    // 2. Capital & Projects
    getProjectSummary: DashboardCapitalService.getProjectSummary,
    getCapitalVsDisbursement: DashboardCapitalService.getCapitalVsDisbursement,
    getYearlyCapitalVsDisbursement: DashboardCapitalService.getYearlyCapitalVsDisbursement,

    // 3. Briefings & Comments
    getMonthlyBriefingStats: DashboardBriefingService.getMonthlyBriefingStats,
    getTaskBriefingSummary: DashboardBriefingService.getTaskBriefingSummary,
    getProjectBriefingData: DashboardBriefingService.getProjectBriefingData,
    updateProjectLeaderComment: DashboardBriefingService.updateProjectLeaderComment,
};
