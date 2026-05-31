// ═══════════════════════════════════════════════════════════════
// CDE Service — Supabase CRUD for CDE Module (Facade Pattern)
// ISO 19650 + VN Construction QLDA
// ═══════════════════════════════════════════════════════════════

import type { CDEFolder, CDEDocument, CDEWorkflowEntry, CDEStats, CDETransmittal, CDEPermission, InternalWorkflowInstance, InternalWorkflowStepRecord, InternalDepartment } from '../features/cde/types';
import { CDEFolderService } from './cde/CDEFolderService';
import { CDEDocumentService } from './cde/CDEDocumentService';
import { CDEWorkflowService } from './cde/CDEWorkflowService';
import { CDEPermissionService } from './cde/CDEPermissionService';
import { CDEInternalWorkflowService } from './cde/CDEInternalWorkflowService';

export class CDEService {
    // ═══════════════════════════════════════════════════════════════
    // FOLDERS
    // ═══════════════════════════════════════════════════════════════
    static getFolders(projectId: string): Promise<CDEFolder[]> {
        return CDEFolderService.getFolders(projectId);
    }

    static createFolder(folder: Partial<CDEFolder>): Promise<CDEFolder> {
        return CDEFolderService.createFolder(folder);
    }

    static seedPhaseFolders(projectId: string, phase: string, folderNames: string[]): Promise<void> {
        return CDEFolderService.seedPhaseFolders(projectId, phase, folderNames);
    }

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENTS
    // ═══════════════════════════════════════════════════════════════
    static getDocuments(folderId: string): Promise<CDEDocument[]> {
        return CDEDocumentService.getDocuments(folderId);
    }

    static getProjectDocuments(projectId: string): Promise<CDEDocument[]> {
        return CDEDocumentService.getProjectDocuments(projectId);
    }

    static uploadDocument(params: {
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
        isEncrypted?: boolean;
        encryptionKeyId?: string;
    }): Promise<CDEDocument> {
        return CDEDocumentService.uploadDocument(params);
    }

    static moveDocument(docId: number, newFolderId: string, actorId?: string, actorName?: string, projectId?: string): Promise<void> {
        return CDEDocumentService.moveDocument(docId, newFolderId, actorId, actorName, projectId);
    }

    static uploadRevision(params: Parameters<typeof CDEDocumentService.uploadRevision>[0]): Promise<CDEDocument> {
        return CDEDocumentService.uploadRevision(params);
    }

    static downloadDocument(storagePath: string): Promise<string> {
        return CDEDocumentService.downloadDocument(storagePath);
    }

    static verifyFileIntegrity(storagePath: string, storedHash: string | null | undefined): Promise<'valid' | 'mismatch' | null> {
        return CDEDocumentService.verifyFileIntegrity(storagePath, storedHash);
    }

    static getRevisions(docId: number): Promise<Array<{
        doc_id: number; version: string; revision: string; date: string;
        author: string; reason: string; size: string; storagePath?: string;
        is_latest?: boolean;
    }>> {
        return CDEDocumentService.getRevisions(docId);
    }

    static uploadLargeDocument(
        file: File,
        projectId: string,
        folderId: string,
        metadata: { doc_name: string; category?: number; doc_type?: string },
        onProgress?: (bytesUploaded: number, bytesTotal: number) => void
    ): Promise<string> {
        return CDEDocumentService.uploadLargeDocument(file, projectId, folderId, metadata, onProgress);
    }

    // ═══════════════════════════════════════════════════════════════
    // WORKFLOW
    // ═══════════════════════════════════════════════════════════════
    static getWorkflowHistory(docId: number): Promise<CDEWorkflowEntry[]> {
        return CDEWorkflowService.getWorkflowHistory(docId);
    }

    static processWorkflowStep(params: {
        docId: number;
        stepName: string;
        stepCode: string;
        actorId: string;
        actorName: string;
        actorRole: string;
        status: 'Approved' | 'Rejected' | 'Returned';
        comment?: string;
    }): Promise<void> {
        return CDEWorkflowService.processWorkflowStep(params);
    }

    // ═══════════════════════════════════════════════════════════════
    // STATS
    // ═══════════════════════════════════════════════════════════════
    static getStats(projectId: string): Promise<CDEStats> {
        return CDEPermissionService.getStats(projectId);
    }

    // ═══════════════════════════════════════════════════════════════
    // AUDIT LOG
    // ═══════════════════════════════════════════════════════════════
    static logAudit(params: {
        projectId: string;
        entityType: string;
        entityId: string;
        action: string;
        actorId: string;
        actorName: string;
        details?: Record<string, any>;
    }): Promise<void> {
        return CDEPermissionService.logAudit(params);
    }

    // ═══════════════════════════════════════════════════════════════
    // TRANSMITTALS
    // ═══════════════════════════════════════════════════════════════
    static getTransmittals(projectId: string): Promise<CDETransmittal[]> {
        return CDEPermissionService.getTransmittals(projectId);
    }

    // ═══════════════════════════════════════════════════════════════
    // PERMISSIONS
    // ═══════════════════════════════════════════════════════════════
    static getUserPermission(projectId: string, userId: string): Promise<CDEPermission | null> {
        return CDEPermissionService.getUserPermission(projectId, userId);
    }

    static canPerformStep(userRole: string | undefined, stepRole: string): boolean {
        return CDEPermissionService.canPerformStep(userRole, stepRole);
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERNAL WORKFLOW — Quy trình nội bộ giữa các phòng ban
    // ═══════════════════════════════════════════════════════════════
    static getInternalWorkflowInstances(projectId: string): Promise<InternalWorkflowInstance[]> {
        return CDEInternalWorkflowService.getInternalWorkflowInstances(projectId);
    }

    static getInternalWorkflowStepRecords(instanceId: string): Promise<InternalWorkflowStepRecord[]> {
        return CDEInternalWorkflowService.getInternalWorkflowStepRecords(instanceId);
    }

    static createInternalWorkflowInstance(params: {
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
        return CDEInternalWorkflowService.createInternalWorkflowInstance(params);
    }

    static processInternalWorkflowStep(params: {
        instanceId: string;
        stepNo: number;
        stepCode: string;
        stepName: string;
        department: InternalDepartment;
        departmentLabel: string;
        action: 'done' | 'rejected' | 'return_to_prev';
        comment: string;
        actorId: string;
        actorName: string;
        instanceTitle?: string;
        nextStepDef?: { step_no: number; code: string; name: string; department: InternalDepartment; department_label: string; sla_days?: number };
        prevStepDef?: { step_no: number; code: string; name: string; department: InternalDepartment; department_label: string; sla_days?: number };
    }): Promise<void> {
        return CDEInternalWorkflowService.processInternalWorkflowStep(params);
    }
}

export default CDEService;
