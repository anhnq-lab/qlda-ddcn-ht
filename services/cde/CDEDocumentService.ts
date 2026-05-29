import { supabase } from '../../lib/supabase';
import type { CDEDocument } from '../../features/cde/types';
import { formatFileSize } from '../../features/cde/constants';
import { calculateFileHash } from '../../utils/cryptoUtils';
import { CDEPermissionService } from './CDEPermissionService';

const cde: any = supabase;

export class CDEDocumentService {
    /**
     * Get documents by folder.
     */
    static async getDocuments(folderId: string): Promise<CDEDocument[]> {
        const { data, error } = await cde
            .from('documents')
            .select('*')
            .eq('cde_folder_id', folderId)
            .order('upload_date', { ascending: false });

        if (error) throw new Error(`Failed to fetch documents: ${error.message}`);
        return (data || []) as unknown as CDEDocument[];
    }

    /**
     * Get ALL CDE documents for a project (used for Analytics Dashboard).
     */
    static async getProjectDocuments(projectId: string): Promise<CDEDocument[]> {
        const { data, error } = await cde
            .from('documents')
            .select('*')
            .eq('project_id', projectId)
            .not('cde_folder_id', 'is', null)
            .order('upload_date', { ascending: false });

        if (error) throw new Error(`Failed to fetch project documents: ${error.message}`);
        return (data || []) as unknown as CDEDocument[];
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
        isEncrypted?: boolean;
        encryptionKeyId?: string;
    }): Promise<CDEDocument> {
        const { file, projectId, folderId, discipline, docType, notes, userId, userName, userOrg, contractorId, isEncrypted, encryptionKeyId } = params;

        // Calculate file hash for integrity (BCA Compliance)
        const fileHash = await calculateFileHash(file);

        // Upload to storage
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `cde/${projectId}/${folderId}/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from('documents') // Existing bucket
            .upload(storagePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // Insert document record
        const { data, error } = await cde
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
                file_hash: fileHash,
                is_encrypted: isEncrypted || false,
                encryption_key_id: encryptionKeyId || null,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to save document: ${error.message}`);
        const doc = data as unknown as CDEDocument;

        // Auto audit log
        await CDEPermissionService.logAudit({
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
     * Tải lên một PHIÊN BẢN MỚI của tài liệu (cùng version_group_id).
     * - Gán/khởi tạo version_group_id chung cho cả nhóm.
     * - Đặt is_latest=false cho các bản cũ, bản mới is_latest=true.
     * - Tự tăng số version (vd P01.01 → P01.02).
     */
    static async uploadRevision(params: {
        baseDoc: CDEDocument;
        file: File;
        reason: string;
        userId: string;
        userName: string;
        userOrg: string;
    }): Promise<CDEDocument> {
        const { baseDoc, file, reason, userId, userName, userOrg } = params;
        const projectId = baseDoc.project_id;
        const folderId = baseDoc.cde_folder_id;

        // 1) Xác định version_group_id chung
        let groupId = baseDoc.version_group_id as string | undefined;
        if (!groupId) {
            groupId = (crypto as any)?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${baseDoc.doc_id}`;
            // backfill cho bản gốc để cùng nhóm
            await cde.from('documents').update({ version_group_id: groupId }).eq('doc_id', baseDoc.doc_id);
        }

        // 2) Hạ cờ is_latest của toàn nhóm
        await cde.from('documents').update({ is_latest: false }).eq('version_group_id', groupId);

        // 3) Tăng số version
        const bump = (v?: string): string => {
            if (!v) return 'P01.02';
            const m = v.match(/^(.*?)(\d+)$/);
            if (m) return m[1] + String(Number(m[2]) + 1).padStart(m[2].length, '0');
            return `${v}.1`;
        };
        const nextVersion = bump(baseDoc.version);

        // 4) Tính hash + upload file
        const fileHash = await calculateFileHash(file);
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `cde/${projectId}/${folderId || 'root'}/${timestamp}_${safeName}`;
        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(storagePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(`Upload phiên bản thất bại: ${uploadError.message}`);

        // 5) Chèn bản ghi phiên bản mới
        const { data, error } = await cde
            .from('documents')
            .insert({
                project_id: projectId,
                doc_name: baseDoc.doc_name,
                storage_path: storagePath,
                size: formatFileSize(file.size),
                category: 0,
                version: nextVersion,
                revision: baseDoc.revision || 'P01',
                version_group_id: groupId,
                is_latest: true,
                cde_folder_id: folderId,
                cde_status: 'S0',
                iso_status: 'WIP',
                uploaded_by: userId,
                submitted_by: userName,
                submitted_by_org: userOrg,
                discipline: baseDoc.discipline,
                doc_type: baseDoc.doc_type,
                notes: reason,
                source: 'cde_revision',
                upload_date: new Date().toISOString(),
                file_hash: fileHash,
            })
            .select()
            .single();
        if (error) throw new Error(`Lưu phiên bản thất bại: ${error.message}`);

        await CDEPermissionService.logAudit({
            projectId,
            entityType: 'document',
            entityId: String((data as any).doc_id),
            action: 'edit',
            actorId: userId,
            actorName: userName,
            details: { revision_of: baseDoc.doc_id, version: nextVersion, reason },
        });

        return data as unknown as CDEDocument;
    }

    /**
     * Move document to a different folder.
     */
    static async moveDocument(docId: number, newFolderId: string, actorId?: string, actorName?: string, projectId?: string): Promise<void> {
        const { error } = await cde
            .from('documents')
            .update({ cde_folder_id: newFolderId })
            .eq('doc_id', docId);
        if (error) throw new Error(`Failed to move document: ${error.message}`);

        // Auto audit log
        if (actorId && projectId) {
            await CDEPermissionService.logAudit({
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
        const revisions = docs.map((doc: any) => ({
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
                        
                        // Calculate full pseudo-hash for integrity (BCA Compliance)
                        const fileHash = await calculateFileHash(file);

                        // Insert DB record
                        const { error } = await supabase.from('documents').insert({
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
}
