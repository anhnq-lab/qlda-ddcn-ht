/**
 * Schemas — Barrel Export
 * 
 * Centralized Zod validation schemas for all ERP entities.
 * Import from 'schemas' to validate form inputs before Supabase.
 * 
 * Usage:
 * ```ts
 * import { ProjectCreateSchema } from '../schemas';
 * const result = ProjectCreateSchema.safeParse(formData);
 * ```
 */
export {
    ProjectCreateSchema,
    ProjectUpdateSchema,
    ProjectGroupSchema,
    type ProjectCreateInput,
    type ProjectUpdateInput,
} from './project.schema';

export {
    PaymentFormSchema,
    type PaymentFormValues,
} from './payment.schema';

export {
    BiddingPackageFormSchema,
    type BiddingPackageFormValues,
} from './biddingPackage.schema';

export {
    CDESubmitFormSchema,
    type CDESubmitFormValues,
} from './cdeSubmit.schema';

export {
    EmployeeCreateSchema,
    EmployeeUpdateSchema,
    GenderSchema,
    RoleSchema,
    type EmployeeCreateInput,
    type EmployeeUpdateInput,
} from './employee.schema';

export {
    AnnualPlanItemFormSchema,
    type AnnualPlanItemFormValues,
} from './annualPlan.schema';

export {
    MonthlyPlanItemFormSchema,
    type MonthlyPlanItemFormValues,
} from './monthlyPlan.schema';

export {
    ContractCreateSchema,
    ContractUpdateSchema,
    PaymentCreateSchema,
    PaymentUpdateSchema,
    PaymentTypeSchema,
    PaymentStatusSchema,
    ContractFormSchema,
    type ContractCreateInput,
    type ContractUpdateInput,
    type PaymentCreateInput,
    type PaymentUpdateInput,
    type ContractFormValues,
} from './contract.schema';
