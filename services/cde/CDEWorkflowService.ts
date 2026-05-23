import { supabase } from '../../lib/supabase';
import type { CDEWorkflowEntry } from '../../features/cde/types';
import { CDE_WORKFLOW_STEPS, getContainerFromStatus } from '../../features/cde/constants';
import { CDEPermissionService } from './CDEPermissionService';

const cde: any = supabase;

export class CDEWorkflowService {
    /**
     * Get workflow history for a document.
     */
    static async getWorkflowHistory(docId: number): Promise<CDEWorkflowEntry[]> {
        const { data, error } = await cde
            .from('cde_workflow_history')
            .select('*')
            .eq('doc_id', docId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(`Failed to fetch workflow history: ${error.message}`);
        return (data || []) as CDEWorkflowEntry[];
    }

    /**
     * Process a workflow step (approve/reject/return).
     * Now includes automatic audit logging.
     */
    static async processWorkflowStep(params: {
        docId: number;
        stepName: string;
        stepCode: string;
        actorId: string;
        actorName: string;
        actorRole: string;
        status: 'Approved' | 'Rejected' | 'Returned';
        comment?: string;
    }): Promise<void> {
        const { docId, stepName, stepCode, actorId, actorName, actorRole, status, comment } = params;

        // Insert workflow history
        const { error: wfError } = await cde
            .from('cde_workflow_history')
            .insert({
                doc_id: docId,
                step_name: stepName,
                step_code: stepCode,
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                status,
                comment: comment || '',
            });

        if (wfError) throw new Error(`Failed to record workflow: ${wfError.message}`);

        // Get project_id for audit log
        const { data: docData } = await supabase
            .from('documents')
            .select('project_id, doc_name')
            .eq('doc_id', docId)
            .single();

        // Update document status
        if (status === 'Approved') {
            const step = CDE_WORKFLOW_STEPS.find(s => s.name === stepName);
            if (step) {
                const newStatus = step.nextStatus;
                const newContainer = getContainerFromStatus(newStatus);
                const newIsoStatus = newContainer;

                // If container changes, find a matching folder
                const { data: currentDoc } = await cde
                    .from('documents')
                    .select('project_id, cde_folder_id')
                    .eq('doc_id', docId)
                    .single();

                let updateData: any = { cde_status: newStatus, iso_status: newIsoStatus };

                if (currentDoc && step.containerFrom !== step.containerTo) {
                    // Find first subfolder in target container
                    const { data: targetFolders } = await cde
                        .from('cde_folders')
                        .select('id')
                        .eq('project_id', currentDoc.project_id)
                        .eq('container_type', step.containerTo)
                        .not('parent_id', 'is', null)
                        .order('sort_order')
                        .limit(1);

                    if (targetFolders && targetFolders.length > 0) {
                        updateData.cde_folder_id = targetFolders[0].id;
                    }
                }

                const { error: updateError } = await supabase
                    .from('documents')
                    .update(updateData)
                    .eq('doc_id', docId);

                if (updateError) throw new Error(`Failed to update status: ${updateError.message}`);
            }
        } else if (status === 'Rejected') {
            await supabase
                .from('documents')
                .update({ cde_status: 'S0', iso_status: 'WIP' })
                .eq('doc_id', docId);
        } else if (status === 'Returned') {
            // Returned = keep in WIP but reset to S0
            await supabase
                .from('documents')
                .update({ cde_status: 'S0', iso_status: 'WIP' })
                .eq('doc_id', docId);
        }

        // Auto audit log
        if (docData?.project_id) {
            const actionMap: Record<string, string> = { Approved: 'approve', Rejected: 'reject', Returned: 'return' };
            await CDEPermissionService.logAudit({
                projectId: docData.project_id,
                entityType: 'document',
                entityId: String(docId),
                action: actionMap[status] || status.toLowerCase(),
                actorId,
                actorName,
                details: { step: stepName, step_code: stepCode, status, comment: comment || '', doc_name: docData.doc_name },
            });
        }
    }
}
