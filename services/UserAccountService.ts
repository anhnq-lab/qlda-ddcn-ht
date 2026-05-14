/**
 * UserAccountService — CRUD tài khoản đăng nhập
 * 
 * Login hỗ trợ: username, email, hoặc phone
 * Password hash: SHA-256 (client-side)
 */
import { supabase, supabaseAdmin } from '../lib/supabase';
import { toServiceError, ServiceError } from './ServiceError';

// ============================================================
// Types
// ============================================================

export interface UserAccount {
    account_id: string;
    employee_id: string;
    username: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    last_login: string | null;
    // Joined from employees
    full_name?: string;
    email?: string;
    phone?: string;
    department?: string;
    role?: string;
    avatar_url?: string;
}

export interface CreateAccountInput {
    employee_id: string;
    username: string;
    password: string;
    email: string;
}

// ============================================================
// Helpers
// ============================================================

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// Service
// ============================================================

export class UserAccountService {
    /**
     * Get all user accounts with employee info
     */
    static async getAll(): Promise<UserAccount[]> {
        const { data, error } = await supabase
            .from('user_accounts')
            .select(`
                *,
                employees!inner (
                    full_name,
                    email,
                    phone,
                    department,
                    role,
                    avatar_url
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw toServiceError(error, 'UserAccountService.getAll');

        return (data || []).map((row: any) => ({
            account_id: row.account_id,
            employee_id: row.employee_id,
            username: row.username,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by: row.created_by,
            last_login: row.last_login,
            full_name: row.employees?.full_name,
            email: row.employees?.email,
            phone: row.employees?.phone,
            department: row.employees?.department,
            role: row.employees?.role,
            avatar_url: row.employees?.avatar_url,
        }));
    }

    /**
     * Create a new user account
     */
    static async create(input: CreateAccountInput, createdBy?: string): Promise<UserAccount> {
        if (!input.email) throw new Error("Bắt buộc phải có email để tạo tài khoản");
        const password_hash = await hashPassword(input.password);

        let authUserId: string | null = null;
        try {
            // Get employee full name
            const { data: empData } = await supabase.from('employees').select('full_name').eq('employee_id', input.employee_id).single();
            
            const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                email: input.email,
                password: input.password,
                email_confirm: true,
                user_metadata: { employee_id: input.employee_id, full_name: empData?.full_name || input.username },
            });
            authUserId = authData?.user?.id || null;

            if (authErr) {
                console.warn('[UserAccountService] Admin Auth user creation failed, throwing error', authErr);
                throw authErr; // Don't fallback to signUp as it will log the current admin out or leave unconfirmed accounts
            }
        } catch (e: any) {
            console.error('[UserAccountService] Auth user creation failed', e);
            throw new Error(`Không thể tạo tài khoản xác thực: ${e.message}`);
        }

        const { data, error } = await supabase
            .from('user_accounts')
            .insert({
                employee_id: input.employee_id,
                username: input.username,
                password_hash,
                auth_user_id: authUserId
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                if (error.message.includes('username')) {
                    throw new ServiceError('Username đã tồn tại', 'UserAccountService.create', error);
                }
                if (error.message.includes('employee')) {
                    throw new ServiceError('Nhân viên này đã có tài khoản', 'UserAccountService.create', error);
                }
            }
            throw toServiceError(error, 'UserAccountService.create');
        }

        return data as any;
    }

    /**
     * Reset password for account
     */
    static async resetPassword(id: string, newPassword: string): Promise<void> {
        const password_hash = await hashPassword(newPassword);

        // Attempt to update Supabase Auth password
        try {
            const { data: accountData } = await supabase.from('user_accounts').select('auth_user_id').eq('account_id', id).single();
            if (accountData?.auth_user_id) {
                await supabaseAdmin.auth.admin.updateUserById(accountData.auth_user_id, { password: newPassword });
            }
        } catch (e) {
            console.warn('[UserAccountService] Failed to reset Supabase Auth password', e);
        }

        const client: any = supabase;
        const { error } = await (client.from('user_accounts') as any)
            .update({ password_hash, updated_at: new Date().toISOString() })
            .eq('account_id', id);

        if (error) throw toServiceError(error, 'UserAccountService.resetPassword');
    }

    /**
     * Toggle account active status
     */
    static async toggleActive(id: string, is_active: boolean): Promise<void> {
        const client: any = supabase;
        const { error } = await (client.from('user_accounts') as any)
            .update({ is_active, updated_at: new Date().toISOString() })
            .eq('account_id', id);

        if (error) throw toServiceError(error, 'UserAccountService.toggleActive');
    }

    /**
     * Delete account
     */
    static async delete(id: string): Promise<void> {
        // Fetch auth_user_id first to delete from Supabase Auth
        try {
            const { data: account } = await supabase.from('user_accounts').select('auth_user_id').eq('account_id', id).single();
            if (account?.auth_user_id) {
                const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(account.auth_user_id);
                if (authErr) console.warn('[UserAccountService] Could not delete Auth user:', authErr);
            }
        } catch (e) {
            console.warn('[UserAccountService] Failed to fetch or delete Supabase Auth user', e);
        }

        const client: any = supabase;
        const { error } = await client
            .from('user_accounts')
            .delete()
            .eq('account_id', id);

        if (error) throw toServiceError(error, 'UserAccountService.delete');
    }

    /**
     * Validate login credentials — supports username, email, or phone
     * Returns employee_id if valid, null otherwise
     */
    static async validateLogin(identifier: string, password: string): Promise<string | null> {
        const password_hash = await hashPassword(password);

        // 1) Try matching by username
        const { data: byUsername } = await supabase
            .from('user_accounts')
            .select('employee_id, is_active')
            .eq('username', identifier)
            .eq('password_hash', password_hash)
            .single();

        if (byUsername) {
            if (!byUsername.is_active) return null;
            const client: any = supabase;
            await (client.from('user_accounts') as any)
                .update({ last_login: new Date().toISOString() })
                .eq('employee_id', byUsername.employee_id);
            return byUsername.employee_id;
        }

        // 2) Try matching by email (look up employee by email, then check account)
        const { data: empByEmail } = await supabase
            .from('employees')
            .select('employee_id')
            .eq('email', identifier)
            .single();

        if (empByEmail) {
            const { data: acctByEmail } = await supabase
                .from('user_accounts')
                .select('employee_id, is_active')
                .eq('employee_id', empByEmail.employee_id)
                .eq('password_hash', password_hash)
                .single();

            if (acctByEmail && acctByEmail.is_active) {
                const client: any = supabase;
                await (client.from('user_accounts') as any)
                    .update({ last_login: new Date().toISOString() })
                    .eq('employee_id', acctByEmail.employee_id);
                return acctByEmail.employee_id;
            }
        }

        // 3) Try matching by phone
        const { data: empByPhone } = await supabase
            .from('employees')
            .select('employee_id')
            .eq('phone', identifier)
            .single();

        if (empByPhone) {
            const { data: acctByPhone } = await supabase
                .from('user_accounts')
                .select('employee_id, is_active')
                .eq('employee_id', empByPhone.employee_id)
                .eq('password_hash', password_hash)
                .single();

            if (acctByPhone && acctByPhone.is_active) {
                const client: any = supabase;
                await (client.from('user_accounts') as any)
                    .update({ last_login: new Date().toISOString() })
                    .eq('employee_id', acctByPhone.employee_id);
                return acctByPhone.employee_id;
            }
        }

        return null;
    }

    /**
     * Verify current password for an employee
     */
    static async verifyPassword(employeeId: string, currentPassword: string): Promise<boolean> {
        const password_hash = await hashPassword(currentPassword);
        const { data } = await supabase
            .from('user_accounts')
            .select('account_id')
            .eq('employee_id', employeeId)
            .eq('password_hash', password_hash)
            .single();

        return !!data;
    }

    /**
     * Change password for an employee
     */
    static async changePassword(employeeId: string, newPassword: string): Promise<void> {
        const password_hash = await hashPassword(newPassword);

        // Update Supabase Auth if auth_user_id exists
        try {
            const { data: accountData } = await supabase.from('user_accounts').select('auth_user_id').eq('employee_id', employeeId).single();
            if (accountData?.auth_user_id) {
                await supabaseAdmin.auth.admin.updateUserById(accountData.auth_user_id, { password: newPassword });
            }
        } catch (e) {
            console.warn('[UserAccountService] Failed to update Supabase Auth password', e);
        }

        const client: any = supabase;
        const { error } = await (client.from('user_accounts') as any)
            .update({ password_hash, updated_at: new Date().toISOString() })
            .eq('employee_id', employeeId);

        if (error) throw toServiceError(error, 'UserAccountService.changePassword');
    }

    /**
     * Update email for an employee in Supabase Auth
     */
    static async updateAuthEmail(employeeId: string, newEmail: string): Promise<void> {
        try {
            const { data: accountData } = await supabase.from('user_accounts').select('auth_user_id').eq('employee_id', employeeId).single();
            if (accountData?.auth_user_id) {
                await supabaseAdmin.auth.admin.updateUserById(accountData.auth_user_id, { email: newEmail, email_confirm: true });
            }
        } catch (e) {
            console.warn('[UserAccountService] Failed to update Supabase Auth email', e);
            throw new Error(`Không thể cập nhật email xác thực: ${(e as Error).message}`);
        }
    }

    /**
     * Get employees that don't have accounts yet
     */
    static async getEmployeesWithoutAccount(): Promise<{ employee_id: string; full_name: string; email: string; phone: string; department: string }[]> {
        // Get all employee IDs that already have accounts
        const { data: accounts } = await supabase
            .from('user_accounts')
            .select('employee_id');

        const existingIds = (accounts || []).map((a: any) => a.employee_id);

        // Get employees without accounts
        let query = supabase
            .from('employees')
            .select('employee_id, full_name, email, phone, department')
            .eq('status', 1); // Active only

        if (existingIds.length > 0) {
            // Filter out employees that already have accounts
            query = query.not('employee_id', 'in', `(${existingIds.join(',')})`);
        }

        const { data, error } = await query.order('full_name');

        if (error) throw toServiceError(error, 'UserAccountService.getEmployeesWithoutAccount');
        return data || [];
    }

    /**
     * Generate a random password (8 chars)
     */
    static generatePassword(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}

export default UserAccountService;
