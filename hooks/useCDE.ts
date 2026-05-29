// ═══════════════════════════════════════════════════════════════
// CDE React Query Hooks
// Phase 4 — Full-featured with Revisions, Download, Permissions
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { CDEService } from '../services/CDEService';
import { CDEItemService } from '../services/cde/CDEItemService';
import { CDEReviewService } from '../services/cde/CDEReviewService';

export const useCDEFolders = (projectId: string) =>
    useQuery({
        queryKey: ['cde-folders', projectId],
        queryFn: () => CDEService.getFolders(projectId),
        enabled: !!projectId,
    });

export const useCDEDocuments = (folderId: string | null) =>
    useQuery({
        queryKey: ['cde-documents', folderId],
        queryFn: () => CDEService.getDocuments(folderId!),
        enabled: !!folderId,
    });

export const useCDEProjectDocuments = (projectId: string) =>
    useQuery({
        queryKey: ['cde-project-documents', projectId],
        queryFn: () => CDEService.getProjectDocuments(projectId),
        enabled: !!projectId,
    });

/**
 * Federation: CDE items hợp nhất (tài liệu + model BIM) trong một thư mục.
 */
export const useCDEItems = (folderId: string | null) =>
    useQuery({
        queryKey: ['cde-items', folderId],
        queryFn: () => CDEItemService.getItems(folderId!),
        enabled: !!folderId,
    });

/**
 * Federation: toàn bộ CDE items của dự án (thống kê / tìm kiếm).
 */
export const useCDEProjectItems = (projectId: string) =>
    useQuery({
        queryKey: ['cde-project-items', projectId],
        queryFn: () => CDEItemService.getProjectItems(projectId),
        enabled: !!projectId,
    });

export const useCDEStats = (projectId: string) =>
    useQuery({
        queryKey: ['cde-stats', projectId],
        queryFn: () => CDEService.getStats(projectId),
        enabled: !!projectId,
    });

export const useCDEWorkflowHistory = (docId: number | null) =>
    useQuery({
        queryKey: ['cde-workflow', docId],
        queryFn: () => CDEService.getWorkflowHistory(docId!),
        enabled: !!docId,
    });

/**
 * Fetch revision history for a document.
 */
export const useCDERevisions = (docId: number | null) =>
    useQuery({
        queryKey: ['cde-revisions', docId],
        queryFn: () => CDEService.getRevisions(docId!),
        enabled: !!docId,
    });

/**
 * Fetch transmittals for a project.
 */
export const useCDETransmittals = (projectId: string) =>
    useQuery({
        queryKey: ['cde-transmittals', projectId],
        queryFn: () => CDEService.getTransmittals(projectId),
        enabled: !!projectId,
    });

/**
 * Fetch user's CDE permission for a project.
 */
export const useCDEUserPermission = (projectId: string, userId: string) =>
    useQuery({
        queryKey: ['cde-permission', projectId, userId],
        queryFn: () => CDEService.getUserPermission(projectId, userId),
        enabled: !!projectId && !!userId,
    });

/**
 * Download a document — returns a hook with download function and state.
 */
export const useDownloadCDE = () => {
    const [isDownloading, setIsDownloading] = useState(false);

    const download = useCallback(async (storagePath: string, fileName?: string) => {
        try {
            setIsDownloading(true);
            const url = await CDEService.downloadDocument(storagePath);
            // Trigger browser download
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || storagePath.split('/').pop() || 'download';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            console.error('Download failed:', err);
            throw err;
        } finally {
            setIsDownloading(false);
        }
    }, []);

    return { download, isDownloading };
};

export const useUploadCDE = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: CDEService.uploadDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cde-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-project-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-items'] });
            queryClient.invalidateQueries({ queryKey: ['cde-project-items'] });
            queryClient.invalidateQueries({ queryKey: ['cde-folders'] });
            queryClient.invalidateQueries({ queryKey: ['cde-stats'] });
        },
    });
};

/**
 * Upload một file IFC trực tiếp vào thư mục CDE (federation BIM↔CDE).
 * Tạo bim_models gắn cde_folder_id + ghi audit. Việc convert sang fragments
 * vẫn do viewer xử lý (sẽ chuyển sang server ở GĐ Phương án A).
 */
export const useUploadIFCToCDE = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (params: {
            file: File;
            projectId: string;
            folderId: string;
            discipline?: string;
            userId: string;
            userName: string;
            userOrg: string;
            contractorId?: string;
        }) => {
            const { uploadIFCFile, uploadFragments, updateModelStatus } = await import('../lib/bimStorage');
            const { bimConverterService } = await import('../services/bimConverterService');

            // 1) Upload file IFC + tạo bản ghi bim_models (status 'uploading'→'converting')
            const model = await uploadIFCFile(params.projectId, params.file, undefined, {
                cdeFolderId: params.folderId,
                uploadedBy: params.userId,
                submittedByOrg: params.userOrg,
                contractorId: params.contractorId,
                discipline: params.discipline,
            });

            // 2) Phương án A: convert IFC → .frag PHÍA SERVER (1 lần), nếu converter
            //    khả dụng. Trình duyệt sau đó chỉ stream .frag, không parse IFC.
            //    Nếu converter offline → để nguyên status 'converting', viewer sẽ
            //    parse client-side khi mở (đường lui, không chặn nghiệp vụ).
            try {
                if (await bimConverterService.isAvailable()) {
                    const { jobId } = await bimConverterService.convertFragments(params.file);
                    await bimConverterService.pollUntilDone(jobId, { intervalMs: 2500 });
                    const fragBuf = await bimConverterService.downloadFragments(jobId);
                    await uploadFragments(model.id, params.projectId, new Uint8Array(fragBuf), params.file.name);
                    void bimConverterService.deleteJob(jobId);
                }
            } catch (convErr) {
                console.warn('[useUploadIFCToCDE] Server fragment conversion failed; fallback to client-side on open:', convErr);
                // Không throw — model vẫn upload thành công, chỉ là chưa có .frag.
                try { await updateModelStatus(model.id, 'converting'); } catch { /* ignore */ }
            }

            await CDEService.logAudit({
                projectId: params.projectId,
                entityType: 'bim_model',
                entityId: model.id,
                action: 'upload',
                actorId: params.userId,
                actorName: params.userName,
                details: { file_name: params.file.name, discipline: params.discipline, folder_id: params.folderId },
            });
            return model;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cde-items'] });
            queryClient.invalidateQueries({ queryKey: ['cde-project-items'] });
            queryClient.invalidateQueries({ queryKey: ['cde-folders'] });
        },
    });
};

export const useUploadRevision = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: CDEService.uploadRevision,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cde-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-project-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-items'] });
            queryClient.invalidateQueries({ queryKey: ['cde-revisions'] });
            queryClient.invalidateQueries({ queryKey: ['cde-folders'] });
        },
    });
};

export const useProcessWorkflowStep = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: CDEService.processWorkflowStep,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cde-workflow'] });
            queryClient.invalidateQueries({ queryKey: ['cde-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-project-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-folders'] });
            queryClient.invalidateQueries({ queryKey: ['cde-stats'] });
        },
    });
};

export const useMoveDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ docId, folderId, actorId, actorName, projectId }: {
            docId: number; folderId: string;
            actorId?: string; actorName?: string; projectId?: string;
        }) => CDEService.moveDocument(docId, folderId, actorId, actorName, projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cde-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-project-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-folders'] });
        },
    });
};

// ─── Reviews (gói duyệt) Hooks ────────────────────────────────────────────────

export const useCDEReviews = (projectId: string) =>
    useQuery({
        queryKey: ['cde-reviews', projectId],
        queryFn: () => CDEReviewService.listReviews(projectId),
        enabled: !!projectId,
    });

export const useCreateReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: CDEReviewService.createReview,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cde-reviews'] }),
    });
};

export const useRecordReviewDecision = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: CDEReviewService.recordDecision,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cde-reviews'] }),
    });
};

// ─── Internal Workflow Hooks ──────────────────────────────────────────────────

export const useCDEInternalWorkflowInstances = (projectId: string) =>
    useQuery({
        queryKey: ['cde-internal-workflow', projectId],
        queryFn: () => CDEService.getInternalWorkflowInstances(projectId),
        enabled: !!projectId,
    });

export const useCDEInternalWorkflowSteps = (instanceId: string | null) =>
    useQuery({
        queryKey: ['cde-internal-workflow-steps', instanceId],
        queryFn: () => CDEService.getInternalWorkflowStepRecords(instanceId!),
        enabled: !!instanceId,
    });

export const useCreateInternalWorkflow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: CDEService.createInternalWorkflowInstance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cde-internal-workflow'] });
        },
    });
};

export const useProcessInternalWorkflowStep = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: CDEService.processInternalWorkflowStep,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cde-internal-workflow'] });
            queryClient.invalidateQueries({ queryKey: ['cde-internal-workflow-steps'] });
        },
    });
};
