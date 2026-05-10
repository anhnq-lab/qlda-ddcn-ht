// ═══════════════════════════════════════════════════════════════
// CDE Service — Supabase CRUD for CDE Module
// ISO 19650 + VN Construction QLDA
// Phase 4 — Full-featured with Audit, Revisions, Permissions
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabase';
import type { CDEFolder, CDEDocument, CDEWorkflowEntry, CDEStats, CDEStatusCode, CDETransmittal, CDEPermission, InternalWorkflowInstance, InternalWorkflowStepRecord, InternalDepartment } from '../features/cde/types';
import { CDE_WORKFLOW_STEPS, getContainerFromStatus, formatFileSize } from '../features/cde/constants';

// ═══════════════════════════════════════════════════════════════
// FOLDERS
// ═══════════════════════════════════════════════════════════════

export class CDEService {

    /**
     * Get all CDE folders for a project, with document counts.
     */
    static async getFolders(projectId: string): Promise<CDEFolder[]> {
        const { data, error } = await supabase
            .from('cde_folders')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order', { ascending: true });

        if (error) throw new Error(`Failed to fetch CDE folders: ${error.message}`);

        // Count docs per folder
        const { data: counts } = await supabase
            .from('documents')
            .select('cde_folder_id')
            .eq('project_id', projectId)
            .not('cde_folder_id', 'is', null);

        const countMap: Record<string, number> = {};
        (counts || []).forEach(row => {
            const fid = row.cde_folder_id;
            if (fid) countMap[fid] = (countMap[fid] || 0) + 1;
        });

        return (data || []).map(f => ({
            ...f,
            doc_count: countMap[f.id] || 0,
        })) as CDEFolder[];
    }

    /**
     * Create a new folder.
     */
    static async createFolder(folder: Partial<CDEFolder>): Promise<CDEFolder> {
        const { data, error } = await supabase
            .from('cde_folders')
            .insert(folder as any)
            .select()
            .single();
        if (error) throw new Error(`Failed to create folder: ${error.message}`);
        return data as CDEFolder;
    }

    /**
     * Seed folders for a project phase (preparation, design, construction, completion).
     * Creates WIP/SHARED/PUBLISHED/ARCHIVED containers + subfolders.
     */
    static async seedPhaseFolders(projectId: string, phase: string, folderNames: string[]): Promise<void> {
        // Guard: check if folders for this phase already exist
        const { data: existing } = await supabase
            .from('cde_folders')
            .select('id')
            .eq('project_id', projectId)
            .eq('phase', phase)
            .limit(1);
        if (existing && existing.length > 0) return; // Already seeded

        // Find existing root containers (phase=null) to attach subfolders to
        const { data: roots } = await supabase
            .from('cde_folders')
            .select('id, container_type')
            .eq('project_id', projectId)
            .is('parent_id', null)
            .is('phase', null);

        if (!roots || roots.length === 0) return;

        const rootMap: Record<string, string> = {};
        roots.forEach(r => { rootMap[r.container_type] = r.id; });

        // Create WIP subfolders (main working folders from phase config)
        if (rootMap['WIP']) {
            const wipSubs = folderNames.map((name, i) => ({
                project_id: projectId,
                parent_id: rootMap['WIP'],
                name,
                container_type: 'WIP' as const,
                path: `/WIP/${name}`,
                sort_order: i + 1,
                phase,
            }));
            await supabase.from('cde_folders').insert(wipSubs);
        }

        // Create generic subfolders for SHARED/PUBLISHED/ARCHIVED
        const genericSubs: Record<string, string[]> = {
            SHARED: ['Hồ sơ đang xét duyệt'],
            PUBLISHED: ['Hồ sơ đã phê duyệt'],
            ARCHIVED: ['Hồ sơ lưu trữ'],
        };

        for (const [containerType, names] of Object.entries(genericSubs)) {
            if (!rootMap[containerType]) continue;
            const subs = names.map((name, i) => ({
                project_id: projectId,
                parent_id: rootMap[containerType],
                name,
                container_type: containerType as 'SHARED' | 'PUBLISHED' | 'ARCHIVED',
                path: `/${containerType}/${name}`,
                sort_order: i + 1,
                phase,
            }));
            await supabase.from('cde_folders').insert(subs);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get documents by folder.
     */
    static async getDocuments(folderId: string): Promise<CDEDocument[]> {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('cde_folder_id', folderId)
            .order('upload_date', { ascending: false });

        if (error) throw new Error(`Failed to fetch documents: ${error.message}`);
        return (data || []) as CDEDocument[];
    }

    /**
     * Get ALL CDE documents for a project (used for Analytics Dashboard).
     */
    static async getProjectDocuments(projectId: string): Promise<CDEDocument[]> {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('project_id', projectId)
            .not('cde_folder_id', 'is', null)
            .order('upload_date', { ascending: false });

        if (error) throw new Error(`Failed to fetch project documents: ${error.message}`);
        return (data || []) as CDEDocument[];
    }


    /**
     * Upload a document (contractor submission).
     * Now includes automatic audit logging.
     */
    static async uploadDocument(params: {
        file: File;
        projectId: string;
        folderId: string;
        discipline: string;
        docType: string;
        notes: string;
        userId: string;
        userName: string;
        userOrg: string;
        contractorId?: string;
    }): Promise<CDEDocument> {
        const { file, projectId, folderId, discipline, docType, notes, userId, userName, userOrg, contractorId } = params;

        // Upload to storage
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `cde/${projectId}/${folderId}/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from('documents') // Existing bucket
            .upload(storagePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // Insert document record
        const { data, error } = await supabase
            .from('documents')
            .insert({
                project_id: projectId,
                doc_name: file.name,
                storage_path: storagePath,
                size: formatFileSize(file.size),
                category: 0,
                version: 'P01.01',
                revision: 'P01',
                cde_folder_id: folderId,
                cde_status: 'S0',
                iso_status: 'WIP',
                uploaded_by: userId,
                submitted_by: userName,
                submitted_by_org: userOrg,
                contractor_id: contractorId || null,
                discipline,
                doc_type: docType,
                notes,
                source: 'cde_upload',
                upload_date: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to save document: ${error.message}`);
        const doc = data as CDEDocument;

        // Auto audit log
        await CDEService.logAudit({
            projectId,
            entityType: 'document',
            entityId: String(doc.doc_id),
            action: 'upload',
            actorId: userId,
            actorName: userName,
            details: { doc_name: file.name, size: formatFileSize(file.size), discipline, docType, folder_id: folderId },
        });

        return doc;
    }

    /**
     * Move document to a different folder.
     */
    static async moveDocument(docId: number, newFolderId: string, actorId?: string, actorName?: string, projectId?: string): Promise<void> {
        const { error } = await supabase
            .from('documents')
            .update({ cde_folder_id: newFolderId })
            .eq('doc_id', docId);
        if (error) throw new Error(`Failed to move document: ${error.message}`);

        // Auto audit log
        if (actorId && projectId) {
            await CDEService.logAudit({
                projectId,
                entityType: 'document',
                entityId: String(docId),
                action: 'move',
                actorId,
                actorName: actorName || actorId,
                details: { new_folder_id: newFolderId },
            });
        }
    }

    /**
     * Download a document from Supabase Storage.
     * Returns a signed URL valid for 1 hour.
     */
    static async downloadDocument(storagePath: string): Promise<string> {
        const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(storagePath, 3600);

        if (error || !data?.signedUrl) {
            // Fallback to public URL
            const { data: publicData } = supabase.storage.from('documents').getPublicUrl(storagePath);
            if (publicData?.publicUrl) return publicData.publicUrl;
            throw new Error(`Failed to generate download URL: ${error?.message || 'Unknown error'}`);
        }
        return data.signedUrl;
    }

    /**
     * Get revision history for a document (all versions sharing same doc_name pattern).
     */
    static async getRevisions(docId: number): Promise<Array<{
        doc_id: number; version: string; revision: string; date: string;
        author: string; reason: string; size: string; storagePath?: string;
        is_latest?: boolean;
    }>> {
        // Get the current document
        const { data: currentDoc } = await (supabase as any)
            .from('documents')
            .select('doc_name, project_id, folder_id, version_group_id')
            .eq('doc_id', docId)
            .single();

        if (!currentDoc) return [];

        let docs = [];

        if (currentDoc.version_group_id) {
            // Get all documents in the same version group
            const { data } = await (supabase as any)
                .from('documents')
                .select('*')
                .eq('version_group_id', currentDoc.version_group_id)
                .order('created_at', { ascending: false });
            docs = data || [];
        } else {
            // Fallback for old documents without version_group_id
            const { data } = await supabase
                .from('documents')
                .select('*')
                .eq('doc_id', docId);
            docs = data || [];
        }

        // Build revision list from actual documents
        const revisions = docs.map(doc => ({
            doc_id: doc.doc_id,
            version: doc.version || 'P01.01',
            revision: doc.revision || 'P01',
            date: new Date(doc.upload_date || doc.created_at || '').toLocaleDateString('vi-VN'),
            author: doc.uploaded_by || '—',
            reason: doc.notes || 'Cập nhật phiên bản',
            size: doc.size || '—',
            storagePath: doc.storage_path,
            is_latest: doc.is_latest,
        }));

        return revisions;
    }

    // ═══════════════════════════════════════════════════════════════
    // WORKFLOW
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get workflow history for a document.
     */
    static async getWorkflowHistory(docId: number): Promise<CDEWorkflowEntry[]> {
        const { data, error } = await supabase
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
        const { error: wfError } = await supabase
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
                const { data: currentDoc } = await supabase
                    .from('documents')
                    .select('project_id, cde_folder_id')
                    .eq('doc_id', docId)
                    .single();

                let updateData: any = { cde_status: newStatus, iso_status: newIsoStatus };

                if (currentDoc && step.containerFrom !== step.containerTo) {
                    // Find first subfolder in target container
                    const { data: targetFolders } = await supabase
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
            await CDEService.logAudit({
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

    // ═══════════════════════════════════════════════════════════════
    // STATS
    // ═══════════════════════════════════════════════════════════════

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

    /**
     * Resumable Upload (TUS) implementation for large files.
     * Used for files > 50MB (BIM, CAD).
     */
    static async uploadLargeDocument(
        file: File,
        projectId: string,
        folderId: string,
        metadata: { doc_name: string; category?: number; doc_type?: string },
        onProgress?: (bytesUploaded: number, bytesTotal: number) => void
    ): Promise<string> {
        // We dynamically import tus so it doesn't break SSR/bundler if not needed immediately
        const tus = await import('tus-js-client');
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;
        
        // Ensure path uniqueness
        const path = `cde/${projectId}/${folderId}/${Date.now()}_${file.name}`;

        return new Promise((resolve, reject) => {
            const upload = new tus.Upload(file, {
                endpoint,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    authorization: `Bearer ${session.access_token}`,
                    'x-upsert': 'true',
                },
                uploadDataDuringCreation: true,
                removeFingerprintOnSuccess: true,
                metadata: {
                    bucketName: 'documents',
                    objectName: path,
                    contentType: file.type || 'application/octet-stream',
                },
                chunkSize: 6 * 1024 * 1024, // 6MB chunk size
                onError: (error) => {
                    console.error('TUS Upload Error:', error);
                    reject(error);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    if (onProgress) onProgress(bytesUploaded, bytesTotal);
                },
                onSuccess: async () => {
                    try {
                        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
                        
                        // Calculate a fast pseudo-hash for deduplication, or leave empty if not available
                        const fileHash = `${file.size}-${file.lastModified}-${file.name}`;

                        // Insert DB record
                        const { data, error } = await supabase.from('documents').insert({
                            project_id: projectId,
                            folder_id: folderId,
                            doc_name: metadata.doc_name,
                            storage_path: urlData.publicUrl,
                            size: formatFileSize(file.size),
                            category: metadata.category || 0,
                            doc_type: metadata.doc_type,
                            is_digitized: true,
                            iso_status: 'WIP',
                            file_hash: fileHash,
                            is_latest: true,
                        }).select('doc_id').single();

                        if (error) throw error;
                        resolve(urlData.publicUrl);
                    } catch (err) {
                        reject(err);
                    }
                },
            });

            upload.findPreviousUploads().then(function (previousUploads) {
                if (previousUploads.length) {
                    upload.resumeFromPreviousUpload(previousUploads[0]);
                }
                upload.start();
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // AUDIT LOG
    // ═══════════════════════════════════════════════════════════════

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
            await supabase.from('cde_audit_log').insert({
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

    // ═══════════════════════════════════════════════════════════════
    // TRANSMITTALS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get all transmittals for a project.
     */
    static async getTransmittals(projectId: string): Promise<CDETransmittal[]> {
        const { data, error } = await supabase
            .from('cde_transmittals')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch transmittals: ${error.message}`);
        return (data || []) as CDETransmittal[];
    }

    // ═══════════════════════════════════════════════════════════════
    // PERMISSIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get current user's CDE permission for a project.
     * Returns null if no permission found (treat as viewer).
     */
    static async getUserPermission(projectId: string, userId: string): Promise<CDEPermission | null> {
        const { data } = await supabase
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

    // ═══════════════════════════════════════════════════════════════
    // INTERNAL WORKFLOW — Quy trình nội bộ giữa các phòng ban
    // ═══════════════════════════════════════════════════════════════

    // Tables not yet in generated types — use any until migration is applied
    private static get db() { return supabase as any; }

    static async getInternalWorkflowInstances(projectId: string): Promise<InternalWorkflowInstance[]> {
        const { data, error } = await CDEService.db
            .from('cde_internal_workflow_instances')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(`Failed to fetch workflow instances: ${error.message}`);
        return (data || []) as InternalWorkflowInstance[];
    }

    static async getInternalWorkflowStepRecords(instanceId: string): Promise<InternalWorkflowStepRecord[]> {
        const { data, error } = await CDEService.db
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
        const { data, error } = await CDEService.db
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

        await CDEService.db.from('cde_internal_workflow_step_records').insert({
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

        const { data: existing } = await CDEService.db
            .from('cde_internal_workflow_step_records')
            .select('id')
            .eq('instance_id', params.instanceId)
            .eq('step_no', params.stepNo)
            .maybeSingle();

        if (existing) {
            await CDEService.db
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
            await CDEService.db.from('cde_internal_workflow_step_records').insert({
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
            await CDEService.db
                .from('cde_internal_workflow_instances')
                .update({ current_step_no: params.nextStepDef.step_no })
                .eq('id', params.instanceId);

            await CDEService.db.from('cde_internal_workflow_step_records').insert({
                instance_id: params.instanceId,
                step_no: params.nextStepDef.step_no,
                step_code: params.nextStepDef.code,
                step_name: params.nextStepDef.name,
                department: params.nextStepDef.department,
                department_label: params.nextStepDef.department_label,
                status: 'pending',
            });
        } else if (params.action === 'done' && !params.nextStepDef) {
            await CDEService.db
                .from('cde_internal_workflow_instances')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', params.instanceId);
        } else if (params.action === 'rejected') {
            await CDEService.db
                .from('cde_internal_workflow_instances')
                .update({ status: 'rejected' })
                .eq('id', params.instanceId);
        }
    }
}

export default CDEService;
