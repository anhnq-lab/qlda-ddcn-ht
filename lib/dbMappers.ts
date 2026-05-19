/**
 * Database Mappers — Barrel Re-export
 * 
 * Individual mapper files are in ./mappers/ for tree-shaking.
 * This file re-exports everything for backward compatibility.
 */

// Employee
export { dbToEmployee, employeeToDb } from './mappers/employeeMappers';

// Contractor
export { dbToContractor, contractorToDb } from './mappers/contractorMappers';

// Project, BiddingPackage, ProcurementPlan, CapitalAllocation
export {
    dbToProject, projectToDb,
    dbToBiddingPackage, biddingPackageToDb,
    dbToCapitalAllocation,
} from './mappers/projectMappers';

// Contract & Variation Orders
export { dbToContract, contractToDb } from './mappers/contractMappers';
export { dbToVariationOrder, variationOrderToDb } from './mappers/variationOrderMappers';

// Payment
export { dbToPayment, paymentToDb } from './mappers/paymentMappers';

// Task
export { dbToTask, taskToDb } from './mappers/taskMappers';

// WorkflowTask ↔ UI Task (unified)
export { workflowTaskToTask, taskToDbTask } from './mappers/workflowTaskMappers';
