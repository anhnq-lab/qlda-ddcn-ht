// ═══════════════════════════════════════════════════════════════
// CDE React Query Hooks
// Phase 4 — Full-featured with Revisions, Download, Permissions
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { CDEService } from '../services/CDEService';

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
            queryClient.invalidateQueries({ queryKey: ['cde-folders'] });
            queryClient.invalidateQueries({ queryKey: ['cde-stats'] });
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
