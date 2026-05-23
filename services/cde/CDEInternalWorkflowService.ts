import { supabase } from '../../lib/supabase';
import type { InternalWorkflowInstance, InternalWorkflowStepRecord, InternalDepartment } from '../../features/cde/types';

export class CDEInternalWorkflowService {
    private static get db() { return supabase as any; }

    static async getInternalWorkflowInstances(projectId: string): Promise<InternalWorkflowInstance[]> {
        const { data, error } = await CDEInternalWorkflowService.db
            .from('cde_internal_workflow_instances')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(`Failed to fetch workflow instances: ${error.message}`);
        return (data || []) as InternalWorkflowInstance[];
    }

    static async getInternalWorkflowStepRecords(instanceId: string): Promise<InternalWorkflowStepRecord[]> {
        const { data, error } = await CDEInternalWorkflowService.db
            .from('cde_internal_workflow_step_records')
            .select('*')
            .eq('instance_id', instanceId)
            .order('step_no', { ascending: true });
        if (error) throw new Error(`Failed to fetch step records: ${error.message}`);
        return (data || []) as InternalWorkflowStepRecord[];
    }

    static async createInternalWorkflowInstance(params: {
        projectId: string;
        templateId: string;
        templateCode: string;
        templateName: string;
        title: string;
        createdBy: string;
        createdByName: string;
        docId?: number;
        dueDate?: string;
        firstStepDef: { step_no: number; code: string; name: string; department: InternalDepartment; department_label: string };
    }): Promise<InternalWorkflowInstance> {
        const { data, error } = await CDEInternalWorkflowService.db
            .from('cde_internal_workflow_instances')
            .insert({
                project_id: params.projectId,
                doc_id: params.docId || null,
                template_id: params.templateId,
                template_code: params.templateCode,
                template_name: params.templateName,
                title: params.title,
                current_step_no: params.firstStepDef.step_no,
                status: 'in_progress',
                created_by: params.createdBy,
                created_by_name: params.createdByName,
                due_date: params.dueDate || null,
            })
            .select()
            .single();
        if (error) throw new Error(`Failed to create workflow instance: ${error.message}`);

        await CDEInternalWorkflowService.db.from('cde_internal_workflow_step_records').insert({
            instance_id: data.id,
            step_no: params.firstStepDef.step_no,
            step_code: params.firstStepDef.code,
            step_name: params.firstStepDef.name,
            department: params.firstStepDef.department,
            department_label: params.firstStepDef.department_label,
            status: 'pending',
        });

        return data as InternalWorkflowInstance;
    }

    static async processInternalWorkflowStep(params: {
        instanceId: string;
        stepNo: number;
        stepCode: string;
        stepName: string;
        department: InternalDepartment;
        departmentLabel: string;
        action: 'done' | 'rejected';
        comment: string;
        actorId: string;
        actorName: string;
        nextStepDef?: { step_no: number; code: string; name: string; department: InternalDepartment; department_label: string };
    }): Promise<void> {
        const newStepStatus = params.action === 'done' ? 'done' : 'rejected';

        const { data: existing } = await CDEInternalWorkflowService.db
            .from('cde_internal_workflow_step_records')
            .select('id')
            .eq('instance_id', params.instanceId)
            .eq('step_no', params.stepNo)
            .maybeSingle();

        if (existing) {
            await CDEInternalWorkflowService.db
                .from('cde_internal_workflow_step_records')
                .update({
                    status: newStepStatus,
                    actor_id: params.actorId,
                    actor_name: params.actorName,
                    comment: params.comment,
                    acted_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
        } else {
            await CDEInternalWorkflowService.db.from('cde_internal_workflow_step_records').insert({
                instance_id: params.instanceId,
                step_no: params.stepNo,
                step_code: params.stepCode,
                step_name: params.stepName,
                department: params.department,
                department_label: params.departmentLabel,
                status: newStepStatus,
                actor_id: params.actorId,
                actor_name: params.actorName,
                comment: params.comment,
                acted_at: new Date().toISOString(),
            });
        }

        if (params.action === 'done' && params.nextStepDef) {
            await CDEInternalWorkflowService.db
                .from('cde_internal_workflow_instances')
                .update({ current_step_no: params.nextStepDef.step_no })
                .eq('id', params.instanceId);

            await CDEInternalWorkflowService.db.from('cde_internal_workflow_step_records').insert({
                instance_id: params.instanceId,
                step_no: params.nextStepDef.step_no,
                step_code: params.nextStepDef.code,
                step_name: params.nextStepDef.name,
                department: params.nextStepDef.department,
                department_label: params.nextStepDef.department_label,
                status: 'pending',
            });
        } else if (params.action === 'done' && !params.nextStepDef) {
            await CDEInternalWorkflowService.db
                .from('cde_internal_workflow_instances')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', params.instanceId);
        } else if (params.action === 'rejected') {
            await CDEInternalWorkflowService.db
                .from('cde_internal_workflow_instances')
                .update({ status: 'rejected' })
                .eq('id', params.instanceId);
        }
    }
}
