import { supabase } from '../../lib/supabase';
import type { CDEPermission, CDETransmittal, CDEStats } from '../../features/cde/types';

const cde: any = supabase;

export class CDEPermissionService {
    /**
     * Get current user's CDE permission for a project.
     * Returns null if no permission found (treat as viewer).
     */
    static async getUserPermission(projectId: string, userId: string): Promise<CDEPermission | null> {
        const { data } = await cde
            .from('cde_permissions')
            .select('*')
            .eq('project_id', projectId)
            .eq('user_id', userId)
            .maybeSingle();

        return data as CDEPermission | null;
    }

    /**
     * Check if a user can perform a specific workflow step.
     * Maps CDE roles to workflow step roles.
     */
    static canPerformStep(userRole: string | undefined, stepRole: string): boolean {
        // Admin can do everything
        if (userRole === 'admin' || userRole === 'director') return true;
        // Map CDE permission roles to workflow step roles
        const roleMapping: Record<string, string[]> = {
            'contributor': ['contractor'],
            'reviewer': ['contractor', 'consultant'],
            'approver': ['contractor', 'consultant', 'staff', 'manager'],
            'admin': ['contractor', 'consultant', 'staff', 'manager', 'director'],
        };
        // Also allow by exact match (e.g. staff user can do staff step)
        if (userRole === stepRole) return true;
        return roleMapping[userRole || '']?.includes(stepRole) || false;
    }

    /**
     * Log an audit entry. Called automatically by upload/workflow/move operations.
     */
    static async logAudit(params: {
        projectId: string;
        entityType: string;
        entityId: string;
        action: string;
        actorId: string;
        actorName: string;
        details?: Record<string, any>;
    }): Promise<void> {
        try {
            await cde.from('cde_audit_log').insert({
                project_id: params.projectId,
                entity_type: params.entityType,
                entity_id: params.entityId,
                action: params.action,
                actor_id: params.actorId,
                actor_name: params.actorName,
                details: params.details || {},
            });
        } catch {
            // Audit log failures should not block main operations
            console.warn('Audit log insert failed silently');
        }
    }

    /**
     * Get all transmittals for a project.
     */
    static async getTransmittals(projectId: string): Promise<CDETransmittal[]> {
        const { data, error } = await cde
            .from('cde_transmittals')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch transmittals: ${error.message}`);
        return (data || []) as CDETransmittal[];
    }

    /**
     * Get stats for a project's CDE.
     */
    static async getStats(projectId: string): Promise<CDEStats> {
        const { data, error } = await (supabase as any)
            .from('cde_project_stats_view')
            .select('*')
            .eq('project_id', projectId)
            .maybeSingle();

        if (error) throw new Error(`Failed to fetch stats: ${error.message}`);

        return {
            total: data?.total || 0,
            wip: data?.wip || 0,
            shared: data?.shared || 0,
            published: data?.published || 0,
            archived: data?.archived || 0,
        };
    }
}
