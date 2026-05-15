// Auth Service - Authentication operations using Supabase Auth
import { Employee } from '../types';
import { supabase } from '../lib/supabase';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: Employee;
}

export class AuthService {
    /**
     * Get current Supabase Auth session user
     */
    static async getCurrentUser(): Promise<Employee | null> {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return null;

        // Get employee profile via auth_user_id link
        const { data: account } = await supabase
            .from('user_accounts')
            .select('employee_id, username')
            .eq('auth_user_id', authUser.id)
            .single();

        if (!account) return null;

        const { data: emp } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', account.employee_id ?? '')
            .single();

        if (!emp) return null;

        return {
            EmployeeID: emp.employee_id,
            FullName: emp.full_name,
            Role: emp.role as any,
            Department: emp.department || '',
            Position: emp.position || '',
            Email: emp.email || '',
            Phone: emp.phone || '',
            AvatarUrl: emp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}&background=0D8ABC&color=fff`,
            JoinDate: emp.join_date || '',
            Status: emp.status as any || 'Active',
            Username: account.username,
            Password: '',
        };
    }

    /**
     * Logout current user via Supabase Auth
     */
    static async logout(): Promise<void> {
        await supabase.auth.signOut();
        localStorage.removeItem('currentUser'); // Clean up legacy
    }

    /**
     * Check if user is authenticated via Supabase session
     */
    static async isAuthenticated(): Promise<boolean> {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    }

    /**
     * Change password via Supabase Auth
     */
    static async changePassword(
        _currentPassword: string,
        newPassword: string
    ): Promise<{ success: boolean; message: string }> {
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            return { success: false, message: error.message };
        }
        return { success: true, message: 'Đổi mật khẩu thành công' };
    }

    /**
     * Request password reset via Supabase Auth
     */
    static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            return { success: false, message: error.message };
        }
        return { success: true, message: 'Đã gửi email hướng dẫn đặt lại mật khẩu' };
    }

    /**
     * Check if current user has admin role
     */
    static isAdmin(): boolean {
        try {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
                const user = JSON.parse(saved);
                return user?.Role === 'Admin';
            }
        } catch { /* ignore */ }
        return false;
    }

    /**
     * Check if current user has specific permission
     */
    static hasPermission(permission: string): boolean {
        try {
            const saved = localStorage.getItem('currentUser');
            if (!saved) return false;
            const user = JSON.parse(saved);

            switch (user.Role) {
                case 'Admin': return true; // Admin has all permissions
                case 'Manager': return ['read', 'write', 'manage_team'].includes(permission);
                default: return ['read', 'write'].includes(permission);
            }
        } catch { return false; }
    }
}

export default AuthService;
