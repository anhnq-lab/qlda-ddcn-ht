import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '../AuthService';
import { supabase } from '../../lib/supabase';

// Mock localStorage
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
});

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.clear();
        (supabase.auth as any).updateUser = vi.fn();
        (supabase.auth as any).resetPasswordForEmail = vi.fn();
    });

    describe('getCurrentUser', () => {
        it('returns null if there is no authenticated user', async () => {
            vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({ data: { user: null }, error: null } as any);
            const result = await AuthService.getCurrentUser();
            expect(result).toBeNull();
        });

        it('returns profile details if user exists in auth and profile table', async () => {
            const mockAuthUser = { id: 'auth-123', email: 'test@example.com' };
            vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({ data: { user: mockAuthUser as any }, error: null });

            // Mock user_accounts query
            const mockAccount = { employee_id: 'EMP-01', username: 'testuser' };
            const mockEmployee = {
                employee_id: 'EMP-01',
                full_name: 'Test User',
                role: 'Manager',
                department: 'Kỹ thuật',
                position: 'Trưởng phòng',
                email: 'test@example.com',
                phone: '0123456789',
                join_date: '2026-01-01',
                status: 1
            };

            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockImplementation(async () => {
                    // Decide return based on dynamic call or count
                    return { data: mockAccount, error: null };
                })
            };

            const mockEmployeeQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockImplementation(async () => {
                    return { data: mockEmployee, error: null };
                })
            };

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                if (table === 'user_accounts') return mockQueryBuilder as any;
                if (table === 'employees') return mockEmployeeQueryBuilder as any;
                return {} as any;
            });

            const result = await AuthService.getCurrentUser();

            expect(result).not.toBeNull();
            expect(result?.EmployeeID).toBe('EMP-01');
            expect(result?.FullName).toBe('Test User');
            expect(result?.Role).toBe('Manager');
            expect(result?.Username).toBe('testuser');
        });
    });

    describe('logout', () => {
        it('signs out via supabase auth and clears localStorage', async () => {
            const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({ error: null });
            mockLocalStorage.setItem('currentUser', 'some-user');

            await AuthService.logout();

            expect(signOutSpy).toHaveBeenCalled();
            expect(mockLocalStorage.getItem('currentUser')).toBeNull();
        });
    });

    describe('isAuthenticated', () => {
        it('returns true if session is present', async () => {
            vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
                data: { session: { user: {} } as any },
                error: null
            });

            const result = await AuthService.isAuthenticated();
            expect(result).toBe(true);
        });

        it('returns false if session is absent', async () => {
            vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
                data: { session: null },
                error: null
            });

            const result = await AuthService.isAuthenticated();
            expect(result).toBe(false);
        });
    });

    describe('changePassword', () => {
        it('returns success on valid password change', async () => {
            vi.spyOn(supabase.auth, 'updateUser').mockResolvedValueOnce({
                data: { user: {} as any },
                error: null
            });

            const result = await AuthService.changePassword('old', 'new');
            expect(result.success).toBe(true);
            expect(result.message).toContain('Đổi mật khẩu thành công');
        });

        it('returns failure message on error', async () => {
            vi.spyOn(supabase.auth, 'updateUser').mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Mật khẩu quá yếu' } as any
            });

            const result = await AuthService.changePassword('old', 'new');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Mật khẩu quá yếu');
        });
    });

    describe('isAdmin', () => {
        it('returns true if localStorage user has Admin role', () => {
            mockLocalStorage.setItem('currentUser', JSON.stringify({ Role: 'Admin' }));
            expect(AuthService.isAdmin()).toBe(true);
        });

        it('returns false if localStorage user has other role', () => {
            mockLocalStorage.setItem('currentUser', JSON.stringify({ Role: 'Manager' }));
            expect(AuthService.isAdmin()).toBe(false);
        });
    });

    describe('hasPermission', () => {
        it('returns true for Admin role for any permission', () => {
            mockLocalStorage.setItem('currentUser', JSON.stringify({ Role: 'Admin' }));
            expect(AuthService.hasPermission('any_random_permission')).toBe(true);
        });

        it('validates specific permissions for Manager', () => {
            mockLocalStorage.setItem('currentUser', JSON.stringify({ Role: 'Manager' }));
            expect(AuthService.hasPermission('manage_team')).toBe(true);
            expect(AuthService.hasPermission('delete_all')).toBe(false);
        });
    });
});
