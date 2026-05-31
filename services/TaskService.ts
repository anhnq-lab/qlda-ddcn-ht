// TaskService — public facade for the unified `tasks` table.
// Implementation is split into focused modules under ./task/* for testability:
//
//   task/helpers.ts          — shared types + dept-code utilities + date helpers
//   task/taskCrud.ts         — read / create / update / delete / sub-tasks
//   task/taskCollaboration.ts— comments + activity log
//   task/taskWorkflowSeed.ts — createTasksFromWorkflow / FromCustomPlan
//
// Consumers keep importing `TaskService.<method>` exactly as before — this
// object is just a re-aggregation. If you add a method, add it both to its
// implementation module and to this object.
import * as crud from './task/taskCrud';
import * as collab from './task/taskCollaboration';
import * as weekly from './task/taskWeeklyUpdates';
import * as seed from './task/taskWorkflowSeed';

export type {
  TaskType,
  DbTaskStatus,
  DbTaskPriority,
  DbTask,
  DbSubTask,
} from './task/helpers';

export type { CustomPlanStep } from './task/taskWorkflowSeed';
export type { WeeklyUpdate, WeeklyUpdateInput } from './task/taskWeeklyUpdates';

export const TaskService = {
  // ── Read ────────────────────────────────────────────────
  getAllTasks: crud.getAllTasks,
  getProjectTasks: crud.getProjectTasks,
  getInternalTasks: crud.getInternalTasks,
  getTasksByEmployeeAndMonth: crud.getTasksByEmployeeAndMonth,
  getTasksByDepartmentAndMonth: crud.getTasksByDepartmentAndMonth,
  getTaskById: crud.getTaskById,
  countByProject: crud.countByProject,

  // ── Write ───────────────────────────────────────────────
  createTask: crud.createTask,
  updateTask: crud.updateTask,
  saveTask: crud.saveTask,
  deleteTask: crud.deleteTask,
  deleteProjectTasks: crud.deleteProjectTasks,
  proposeTask: crud.proposeTask,
  approveProposal: crud.approveProposal,
  rejectProposal: crud.rejectProposal,
  deferToNextMonth: crud.deferToNextMonth,

  // ── Collaboration ───────────────────────────────────────
  getTaskComments: collab.getTaskComments,
  getTaskActivities: collab.getTaskActivities,
  addComment: collab.addComment,

  // ── Weekly Updates ──────────────────────────────────────
  getTaskWeeklyUpdates: weekly.getTaskWeeklyUpdates,
  addWeeklyUpdate: weekly.addWeeklyUpdate,
  updateWeeklyUpdate: weekly.updateWeeklyUpdate,
  getCurrentWeekUpdate: weekly.getCurrentWeekUpdate,

  // ── Workflow seed ───────────────────────────────────────
  createTasksFromWorkflow: seed.createTasksFromWorkflow,
  createTasksFromCustomPlan: seed.createTasksFromCustomPlan,
};
