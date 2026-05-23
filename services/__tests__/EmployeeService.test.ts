import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmployeeService from '../EmployeeService';
import { supabase } from '../../lib/supabase';
import { EmployeeStatus, Role } from '../../types';

// Mock DB Mappers
vi.mock('../../lib/dbMappers', () => ({
    dbToEmployee: vi.fn().mockImplementation((x) => ({
        EmployeeID: x.employee_id,
        FullName: x.full_name,
        Role: x.role,
        Department: x.department,
        Position: x.position,
        Email: x.email,
        Phone: x.phone,
        JoinDate: x.join_date,
        Status: x.status === 1 ? 'Active' : 'Inactive',
        Username: x.user_accounts?.username || '',
        Password: '',
    })),
    employeeToDb: vi.fn().mockImplementation((x) => ({
        employee_id: x.EmployeeID,
        full_name: x.FullName,
        role: x.Role,
        department: x.Department,
        position: x.Position,
        email: x.Email,
        phone: x.Phone,
        join_date: x.JoinDate,
        status: x.Status === 'Active' ? 1 : 0
    })),
}));

// Helper mock chain
function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
    const chain: Record<string, any> = {};
    const methods = ['select', 'eq', 'neq', 'or', 'insert', 'update', 'delete', 'single'];
    for (const m of methods) {
        chain[m] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (resolve: Function) => {
        resolve(resolvedValue);
        return Promise.resolve(resolvedValue);
    };
    return chain;
}

const mockFrom = vi.fn();
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: (...args: any[]) => mockFrom(...args),
    },
}));

describe('EmployeeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('getAll', () => {
        it('returns sorted employee list', async () => {
            const mockDbEmployees = [
                { employee_id: 'EMP-01', full_name: 'Nguyễn Quang Linh', position: 'Giám đốc Ban', department: 'Ban Giám đốc', role: 'Manager', status: 1 },
                { employee_id: 'EMP-02', full_name: 'Trần Ngọc Bảo', position: 'Phó Giám đốc Ban', department: 'Ban Giám đốc', role: 'Manager', status: 1 },
                { employee_id: 'EMP-03', full_name: 'Nguyễn Văn A', position: 'Chuyên viên', department: 'Kế hoạch', role: 'Staff', status: 1 }
            ];

            const chain = createChainMock({ data: mockDbEmployees, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await EmployeeService.getAll();

            expect(result).toHaveLength(3);
            expect(result[0].FullName).toBe('Nguyễn Quang Linh'); // Giám đốc Ban (priority 1)
            expect(result[1].FullName).toBe('Trần Ngọc Bảo');     // Phó Giám đốc Ban (priority 2)
            expect(result[2].FullName).toBe('Nguyễn Văn A');       // Chuyên viên (priority 8)
        });
    });

    describe('getById', () => {
        it('returns employee if found', async () => {
            const empData = { employee_id: 'EMP-01', full_name: 'Nguyễn Quang Linh', role: 'Manager', department: 'Ban Giám đốc' };
            const chain = createChainMock({ data: empData, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await EmployeeService.getById('EMP-01');
            expect(result).toBeDefined();
            expect(result?.EmployeeID).toBe('EMP-01');
        });

        it('returns undefined if PGRST116 (not found) error occurs', async () => {
            const chain = createChainMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
            mockFrom.mockReturnValue(chain);

            const result = await EmployeeService.getById('EMP-X');
            expect(result).toBeUndefined();
        });
    });

    describe('create', () => {
        it('creates a new employee and optional user account', async () => {
            const newEmp = { FullName: 'New Emp', Role: Role.Staff, Department: 'Kỹ thuật', Username: 'newemp', Status: EmployeeStatus.Active };
            const dbReturn = { employee_id: 'EMP-99', full_name: 'New Emp', role: 'Staff', department: 'Kỹ thuật', status: 1 };

            // Mock employees insert
            const empChain = createChainMock({ data: dbReturn, error: null });
            // Mock user_accounts insert
            const accChain = createChainMock({ data: {}, error: null });

            let callCount = 0;
            mockFrom.mockImplementation((table) => {
                callCount++;
                if (table === 'employees') return empChain;
                if (table === 'user_accounts') return accChain;
                return createChainMock({ data: null, error: null });
            });

            const result = await EmployeeService.create(newEmp);

            expect(result.FullName).toBe('New Emp');
            expect(mockFrom).toHaveBeenCalledWith('employees');
            expect(mockFrom).toHaveBeenCalledWith('user_accounts');
        });
    });

    describe('delete', () => {
        it('deletes related records and the employee', async () => {
            const projectMembersChain = createChainMock({ data: null, error: null });
            const userAccountsChain = createChainMock({ data: null, error: null });
            const employeesChain = createChainMock({ data: null, error: null });

            let callCount = 0;
            mockFrom.mockImplementation((table) => {
                callCount++;
                if (table === 'project_members') return projectMembersChain;
                if (table === 'user_accounts') return userAccountsChain;
                if (table === 'employees') return employeesChain;
                return createChainMock({ data: null, error: null });
            });

            await EmployeeService.delete('EMP-01');

            expect(mockFrom).toHaveBeenCalledWith('project_members');
            expect(mockFrom).toHaveBeenCalledWith('user_accounts');
            expect(mockFrom).toHaveBeenCalledWith('employees');
        });

        it('throws friendly error if deletion violates foreign key constraint', async () => {
            const projectMembersChain = createChainMock({ data: null, error: null });
            const userAccountsChain = createChainMock({ data: null, error: null });
            const employeesChain = createChainMock({ data: null, error: { code: '23503', message: 'FK violation' } });

            let callCount = 0;
            mockFrom.mockImplementation((table) => {
                callCount++;
                if (table === 'project_members') return projectMembersChain;
                if (table === 'user_accounts') return userAccountsChain;
                if (table === 'employees') return employeesChain;
                return createChainMock({ data: null, error: null });
            });

            await expect(EmployeeService.delete('EMP-01')).rejects.toThrow('Không thể xoá nhân sự vì đã phát sinh dữ liệu liên quan');
        });
    });

    describe('getStatistics', () => {
        it('computes correctly by department, role, and gender', async () => {
            const mockDbEmployees = [
                { employee_id: 'EMP-01', full_name: 'Nguyễn Văn A', position: 'Giám đốc Ban', department: 'Ban Giám đốc', role: Role.Manager, status: 1 },
                { employee_id: 'EMP-02', full_name: 'Lê Thị B', position: 'Kế toán trưởng', department: 'Tài chính', role: Role.Manager, status: 1 },
                { employee_id: 'EMP-03', full_name: 'Trần Văn C', position: 'Chuyên viên', department: 'Kế hoạch', role: Role.Staff, status: 1 }
            ];

            const chain = createChainMock({ data: mockDbEmployees, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await EmployeeService.getStatistics();

            expect(result.total).toBe(3);
            expect(result.male).toBe(2); // Nguyễn Văn A, Trần Văn C (inferred male)
            expect(result.female).toBe(1); // Lê Thị B (inferred female due to 'Thị')
            expect(result.byDepartment['Ban Giám đốc']).toBe(1);
            expect(result.byDepartment['Tài chính']).toBe(1);
            expect(result.byRole[Role.Manager]).toBe(2);
            expect(result.byRole[Role.Staff]).toBe(1);
        });
    });
});
