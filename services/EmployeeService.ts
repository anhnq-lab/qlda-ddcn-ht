// Employee Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';
import { dbToEmployee, employeeToDb } from '../lib/dbMappers';
import { Employee, EmployeeStatus, Role } from '../types';
import type { QueryParams } from '../types/api';
import { ServiceError, toServiceError } from './ServiceError';
import { UserAccountService } from './UserAccountService';

export class EmployeeService {
    /**
     * Get all employees with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Employee[]> {
        let query = supabase.from('employees').select('*, user_accounts(username)');

        if (params?.search) {
            const s = params.search;
            query = query.or(`full_name.ilike.%${s}%,department.ilike.%${s}%,email.ilike.%${s}%`);
        }

        if (params?.filters?.department) {
            query = query.eq('department', params.filters.department);
        }

        if (params?.filters?.status !== undefined) {
            query = query.eq('status', params.filters.status);
        }

        if (params?.filters?.role) {
            query = query.eq('role', params.filters.role);
        }

        const { data, error } = await query;

        if (error) throw toServiceError(error, 'EmployeeService.getAll');

        // Sort by position hierarchy
        const positionOrder: Record<string, number> = {
            'Giám đốc Ban': 1, 'Trưởng Ban': 1, 'Giám đốc Ban QLDA': 1,
            'Phó Giám đốc Ban': 2, 'Phó Trưởng Ban': 2,
            'Kế toán trưởng': 3, 'Kế Toán trưởng': 3,
            'Chánh Văn phòng': 4,
            'Trưởng phòng': 5, 'Trưởng ban': 5, 'Giám đốc Trung tâm': 5,
            'Phó Văn phòng': 6, 'Phó phòng': 6, 'Phó ban': 6,
            'Chuyên viên chính': 7, 'Kỹ sư chính': 7,
            'Chuyên viên': 8, 'Kỹ sư': 8, 'Kế toán viên': 8, 'Tư vấn giám sát': 8,
            'Nhân viên': 9,
            'Quản trị hệ thống': 99,
        };
        const employees = (data || []).map(dbToEmployee);
        employees.sort((a, b) => {
            const oA = positionOrder[a.Position] ?? 99;
            const oB = positionOrder[b.Position] ?? 99;
            if (oA !== oB) return oA - oB;
            return a.FullName.localeCompare(b.FullName, 'vi');
        });
        return employees;
    }

    /**
     * Get a single employee by ID
     */
    static async getById(id: string): Promise<Employee | undefined> {
        const { data, error } = await supabase
            .from('employees')
            .select('*, user_accounts(username)')
            .eq('employee_id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined; // Not found
            throw toServiceError(error, 'EmployeeService.getById');
        }
        return data ? dbToEmployee(data) : undefined;
    }

    /**
     * Get employees by department
     */
    static async getByDepartment(department: string): Promise<Employee[]> {
        return this.getAll({ filters: { department } });
    }

    /**
     * Get employee name by ID (async version for Supabase)
     */
    static getNameById(id: string): string {
        // Keep sync fallback for UI compatibility — use cached data
        const cached = localStorage.getItem('cached_employees');
        if (cached) {
            try {
                const employees: Employee[] = JSON.parse(cached);
                const found = employees.find(e => e.EmployeeID === id);
                if (found) return found.FullName;
            } catch { /* ignore */ }
        }
        return id || 'Unknown';
    }

    static async create(employeeData: Partial<Employee>): Promise<Employee> {
        // Prepare payload with default JoinDate and Status
        const payload = {
            ...employeeData,
            Status: employeeData.Status ?? EmployeeStatus.Active,
            JoinDate: employeeData.JoinDate || new Date().toISOString().split('T')[0],
        };

        try {
            // Generate a random ID for the new employee
            const newEmpId = `EMP-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;
            
            const dbData = employeeToDb({
                ...payload,
                EmployeeID: newEmpId
            });

            // Fallback: If edge function fails or is not available, insert directly to DB
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .insert(dbData as any)
                .select()
                .single();

            if (empError) {
                console.error('[EmployeeService] DB Insert error:', empError);
                throw toServiceError(empError, 'EmployeeService.create');
            }

            // Create user account if username provided
            if (payload.Username) {
                const { error: accError } = await supabase
                    .from('user_accounts')
                    .insert({
                        employee_id: newEmpId,
                        username: payload.Username,
                        password_hash: payload.Password || '123456',
                        is_active: payload.Status === EmployeeStatus.Active
                    });
                
                if (accError) {
                    console.error('[EmployeeService] Failed to create user account:', accError);
                    // Do not throw here, employee was already created
                }
            }

            return dbToEmployee(empData);
        } catch (err: any) {
            console.error('[EmployeeService] create failed:', err);
            throw toServiceError(err, 'EmployeeService.create');
        }
    }

    /**
     * Update an existing employee
     */
    static async update(id: string, data: Partial<Employee>): Promise<Employee> {
        const updateData = employeeToDb(data);

        const { data: updated, error } = await supabase
            .from('employees')
            .update(updateData)
            .eq('employee_id', id)
            .select('*, user_accounts(username)')
            .single();

        if (error) throw toServiceError(error, 'EmployeeService.update');

        // Update user_account username if provided
        if (data.Username) {
            const { error: accError } = await supabase
                .from('user_accounts')
                .update({ username: data.Username })
                .eq('employee_id', id);
            
            if (accError) {
                console.error('[EmployeeService] Failed to update user account username:', accError);
                // Non-fatal, proceed
            } else {
                // Manually update the returned employee's username since the select might have fetched the old one
                // depending on race conditions, or we just rely on dbToEmployee if we want, but it's safer:
                if (updated.user_accounts && Array.isArray(updated.user_accounts) && updated.user_accounts.length > 0) {
                    updated.user_accounts[0].username = data.Username;
                } else if (updated.user_accounts && !Array.isArray(updated.user_accounts)) {
                    (updated.user_accounts as any).username = data.Username;
                }
            }
        }

        // Update auth email if Email is changed
        if (data.Email) {
            try {
                await UserAccountService.updateAuthEmail(id, data.Email);
            } catch (err) {
                console.error('[EmployeeService] Failed to update auth email:', err);
                // Non-fatal, let the DB update succeed but log it
            }
        }

        const employee = dbToEmployee(updated);

        // Update current user in localStorage if it's the same user
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const parsed = JSON.parse(currentUser);
                if (parsed.EmployeeID === id) {
                    localStorage.setItem('currentUser', JSON.stringify(employee));
                }
            } catch { /* ignore */ }
        }

        return employee;
    }

    /**
     * Delete an employee
     */
    static async delete(id: string): Promise<void> {
        // Clean up related data first to avoid FK constraint errors for simple dependencies
        await supabase.from('project_members').delete().eq('employee_id', id);
        await supabase.from('user_accounts').delete().eq('employee_id', id);

        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('employee_id', id);

        if (error) {
            console.error('[EmployeeService] Delete error:', error);
            if (error.code === '23503') {
                throw new Error('Không thể xoá nhân sự vì đã phát sinh dữ liệu liên quan (công việc, hợp đồng...). Hãy chỉnh sửa và chuyển trạng thái thành "Đã nghỉ" thay vì xoá.');
            }
            throw toServiceError(error, 'EmployeeService.delete');
        }
    }

    /**
     * Get unique departments
     */
    static async getDepartments(): Promise<string[]> {
        const employees = await this.getAll();
        return [...new Set(employees.map(e => e.Department))];
    }

    /**
     * Infer gender from Vietnamese full name heuristic
     */
    private static inferGender(fullName: string): 'male' | 'female' {
        const parts = fullName.trim().split(/\s+/);
        const firstName = parts[parts.length - 1]?.toLowerCase() || '';
        const middleName = parts.length >= 3 ? parts[parts.length - 2]?.toLowerCase() : '';

        // Common female first names in Vietnamese
        const femaleNames = new Set([
            'anh', 'chi', 'dung', 'giang', 'ha', 'hà', 'hang', 'hằng', 'hanh', 'hạnh',
            'hien', 'hiền', 'hoa', 'hong', 'hồng', 'huong', 'hương', 'huyen', 'huyền',
            'lan', 'le', 'lệ', 'linh', 'loan', 'ly', 'lý', 'mai', 'my', 'mỹ',
            'nga', 'ngoc', 'ngọc', 'nhi', 'nhung', 'nương', 'oanh',
            'phuong', 'phương', 'quyen', 'quyên', 'sen', 'suong', 'sương',
            'tam', 'tâm', 'thanh', 'thao', 'thảo', 'thi', 'thu', 'thuy', 'thuý', 'thủy',
            'tien', 'tiên', 'trang', 'truc', 'trúc', 'tuyet', 'tuyết',
            'uyen', 'uyên', 'van', 'vân', 'vy', 'xuan', 'xuân', 'yen', 'yên',
            'dao', 'đào', 'dieu', 'diệu', 'duyen', 'duyên', 'em', 'hạ',
            'khanh', 'khánh', 'lien', 'liên', 'nhàn', 'nhan', 'như', 'nhu',
            'phượng', 'phuợng', 'quynh', 'quỳnh', 'thúy', 'tram', 'trâm', 'trinh', 'trinh'
        ]);

        // Female middle name indicator (Thị)
        if (middleName === 'thị' || middleName === 'thi') return 'female';

        // Male middle name indicator (Văn)
        if (middleName === 'văn' || middleName === 'van') return 'male';

        if (femaleNames.has(firstName)) return 'female';

        return 'male'; // Default assumption
    }

    /**
     * Get employee statistics
     */
    static async getStatistics(): Promise<{
        total: number;
        active: number;
        male: number;
        female: number;
        byDepartment: Record<string, number>;
        byRole: Record<Role, number>;
    }> {
        const employees = await this.getAll();

        const byDepartment: Record<string, number> = {};
        const byRole = {
            [Role.Admin]: 0,
            [Role.Manager]: 0,
            [Role.Staff]: 0,
        };

        let active = 0;
        let male = 0;
        let female = 0;

        employees.forEach(e => {
            if (e.Status === EmployeeStatus.Active) active++;
            byDepartment[e.Department] = (byDepartment[e.Department] || 0) + 1;
            byRole[e.Role]++;

            // Gender from DB field or infer from name
            const gender = e.Gender?.toLowerCase() || this.inferGender(e.FullName);
            if (gender === 'female') female++;
            else male++;
        });

        // Cache employees for getNameById sync fallback
        localStorage.setItem('cached_employees', JSON.stringify(employees));

        return {
            total: employees.length,
            active,
            male,
            female,
            byDepartment,
            byRole,
        };
    }

    /**
     * Update the manual system role for an employee
     */
    static async updateSystemRole(employeeId: string, systemRole: string | null): Promise<void> {
        const { error } = await supabase
            .from('employees')
            .update({ system_role: systemRole } as any)
            .eq('employee_id', employeeId);

        if (error) {
            throw toServiceError(error, 'EmployeeService.updateSystemRole');
        }
    }
}

export default EmployeeService;
