/**
 * Permission Service — QLDA ĐDCN TP.HCM
 *
 * CRUD operations on the user_permissions table.
 * Pattern follows cic-erp-contract/services/permissionService.ts
 */
import { supabase } from '../lib/supabase';
import {
    UserPermission,
    PermissionAction,
    PermissionResource,
    SystemRole,
    DEFAULT_ROLE_PERMISSIONS
} from '../types/permission.types';

// Use `as any` for .from() since user_permissions may not yet be in the generated DB types.
// This is the same pattern used in cic-erp-contract.
const db = () => (supabase as any).from('user_permissions');
const auditDb = () => (supabase as any).from('audit_logs');

// Helper to convert snake_case DB response to camelCase
const mapDbToPermission = (row: any): UserPermission => ({
    id: row.id,
    userId: row.user_id,
    resource: row.resource,
    actions: row.actions || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

/**
 * Log permission change to audit_logs table
 */
async function logPermissionChange(
    targetUserId: string,
    resource: string,
    oldActions: PermissionAction[],
    newActions: PermissionAction[],
    changedBy: string
): Promise<void> {
    try {
        await auditDb().insert({
            action: 'permission_update',
            target_entity: 'user_permissions',
            target_id: targetUserId,
            changed_by: changedBy,
            details: JSON.stringify({
                resource,
                before: oldActions,
                after: newActions,
                added: newActions.filter(a => !oldActions.includes(a)),
                removed: oldActions.filter(a => !newActions.includes(a)),
            }),
        });
    } catch (err) {
        console.warn('[PermService] Audit log failed:', err);
    }
}

export const PermissionService = {
    /**
     * Get all permissions for a user
     */
    async getByUserId(userId: string): Promise<UserPermission[]> {
        const { data, error } = await db()
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return (data || []).map(mapDbToPermission);
    },

    /**
     * Get permissions for all users (for admin view)
     */
    async getAll(): Promise<UserPermission[]> {
        const { data, error } = await db()
            .select('*');

        if (error) throw error;
        return (data || []).map(mapDbToPermission);
    },

    /**
     * Update or create permission for a user on a resource.
     * Optionally logs the change to audit_logs.
     */
    async upsert(
        userId: string,
        resource: PermissionResource,
        actions: PermissionAction[],
        changedBy?: string
    ): Promise<UserPermission> {
        // Fetch old actions for audit trail
        let oldActions: PermissionAction[] = [];
        if (changedBy) {
            try {
                const { data: existing } = await db()
                    .select('actions')
                    .eq('user_id', userId)
                    .eq('resource', resource)
                    .single();
                if (existing) oldActions = existing.actions || [];
            } catch { /* new record, old = [] */ }
        }

        const { data, error } = await db()
            .upsert({
                user_id: userId,
                resource,
                actions,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,resource'
            })
            .select()
            .single();

        if (error) throw error;

        // Log the change
        if (changedBy) {
            await logPermissionChange(userId, resource, oldActions, actions, changedBy);
        }

        return mapDbToPermission(data);
    },

    /**
     * Initialize default permissions for a user based on their role
     */
    async initializeForUser(userId: string, role: SystemRole): Promise<void> {
        const defaultPerms = await this.getDefaultPermissions(role);
        if (!defaultPerms || Object.keys(defaultPerms).length === 0) return;

        const permissions = Object.entries(defaultPerms).map(([resource, actions]) => ({
            user_id: userId,
            resource,
            actions: actions || [],
            updated_at: new Date().toISOString(),
        }));

        if (permissions.length === 0) return;

        const { error } = await db()
            .upsert(permissions, { onConflict: 'user_id,resource' });

        if (error) throw error;
    },

    /**
     * Check if user has a specific permission (server-side check)
     */
    async hasPermission(userId: string, resource: PermissionResource, action: PermissionAction): Promise<boolean> {
        const { data, error } = await db()
            .select('actions')
            .eq('user_id', userId)
            .eq('resource', resource)
            .single();

        if (error || !data) return false;
        return ((data as any).actions || []).includes(action);
    },

    /**
     * Delete all permissions for a user
     */
    async deleteByUserId(userId: string): Promise<void> {
        const { error } = await db()
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    },

    /**
     * Get default permissions for a role from DB (fallback to constants)
     */
    async getDefaultPermissions(role: SystemRole): Promise<Partial<Record<PermissionResource, PermissionAction[]>>> {
        try {
            const { data, error } = await (supabase as any).from('role_permission_defaults')
                .select('resource, actions')
                .eq('role', role);

            if (error) throw error;
            
            if (data && data.length > 0) {
                const perms: Partial<Record<PermissionResource, PermissionAction[]>> = {};
                data.forEach((row: any) => {
                    perms[row.resource as PermissionResource] = row.actions;
                });
                return perms;
            }
        } catch (err) {
            console.warn('[PermService] Failed to fetch role defaults from DB (migration not applied?), using hardcoded constants.', err);
        }
        
        return DEFAULT_ROLE_PERMISSIONS[role] || {};
    },

    /**
     * Initialize default permissions for ALL users in bulk.
     * Only initializes users that don't already have DB records.
     */
    async initializeAllUsers(users: { id: string; role: SystemRole }[]): Promise<number> {
        let count = 0;
        for (const user of users) {
            try {
                // Check if user already has permissions
                const { data } = await db()
                    .select('id')
                    .eq('user_id', user.id)
                    .limit(1);

                if (!data || data.length === 0) {
                    await this.initializeForUser(user.id, user.role);
                    count++;
                }
            } catch (err) {
                console.warn(`[PermService] Failed to init for ${user.id}:`, err);
            }
        }
        return count;
    },
};
