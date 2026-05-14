/**
 * Employee Mappers — snake_case (DB) ↔ PascalCase (Frontend)
 */
import type { Employee, EmployeeStatus, Role, Gender } from '../../types';

export const dbToEmployee = (row: any): Employee => ({
    EmployeeID: row.employee_id,
    FullName: row.full_name,
    Role: row.role as Role,
    Department: row.department || '',
    Position: row.position || '',
    Email: row.email || '',
    Phone: row.phone || '',
    AvatarUrl: row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.full_name || 'NV')}&background=4a90e2&color=fff&bold=true&size=128`,
    Status: row.status as EmployeeStatus,
    JoinDate: row.join_date || '',
    Username: Array.isArray(row.user_accounts) && row.user_accounts.length > 0 ? row.user_accounts[0].username : (row.user_accounts?.username || row.employee_id),
    Password: '',
    Gender: row.gender as Gender || undefined,
    JobContent: row.job_content || undefined,
    CompletionCriteria: row.completion_criteria || undefined,
});

export const employeeToDb = (emp: Partial<Employee>) => ({
    ...(emp.EmployeeID !== undefined && { employee_id: emp.EmployeeID }),
    ...(emp.FullName !== undefined && { full_name: emp.FullName }),
    ...(emp.Role !== undefined && { role: emp.Role }),
    ...(emp.Department !== undefined && { department: emp.Department }),
    ...(emp.Position !== undefined && { position: emp.Position }),
    ...(emp.Email !== undefined && { email: emp.Email }),
    ...(emp.Phone !== undefined && { phone: emp.Phone }),
    ...(emp.AvatarUrl !== undefined && { avatar_url: emp.AvatarUrl }),
    ...(emp.Status !== undefined && { status: emp.Status }),
    ...(emp.JoinDate !== undefined && { join_date: emp.JoinDate ? emp.JoinDate : null }),
    ...(emp.Gender !== undefined && { gender: emp.Gender }),
    ...(emp.JobContent !== undefined && { job_content: emp.JobContent }),
    ...(emp.CompletionCriteria !== undefined && { completion_criteria: emp.CompletionCriteria }),
});

