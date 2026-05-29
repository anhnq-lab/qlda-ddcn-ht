// ═══════════════════════════════════════════════════════════════
// CDE Review Service — gói duyệt nhiều tài liệu (GĐ4)
// Bảng: cde_reviews, cde_review_items, cde_review_approvers
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../../lib/supabase';
import type { CDEReview, CDEReviewDecision } from '../../features/cde/types';
import { CDEPermissionService } from './CDEPermissionService';

const cde: any = supabase;

/** Tính trạng thái rollup từ quyết định của người duyệt. */
function rollupStatus(approvers: { decision: CDEReviewDecision }[]): CDEReview['status'] {
    if (approvers.length === 0) return 'open';
    if (approvers.some((a) => a.decision === 'rejected')) return 'rejected';
    if (approvers.every((a) => a.decision === 'approved')) return 'approved';
    return 'open';
}

export class CDEReviewService {
    static async listReviews(projectId: string): Promise<CDEReview[]> {
        const { data: reviews, error } = await cde
            .from('cde_reviews')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(`Không tải được reviews: ${error.message}`);
        const list = (reviews || []) as CDEReview[];
        if (list.length === 0) return [];

        const ids = list.map((r) => r.id);
        const [{ data: items }, { data: approvers }] = await Promise.all([
            cde.from('cde_review_items').select('*').in('review_id', ids),
            cde.from('cde_review_approvers').select('*').in('review_id', ids),
        ]);
        return list.map((r) => ({
            ...r,
            items: (items || []).filter((it: any) => it.review_id === r.id),
            approvers: (approvers || []).filter((a: any) => a.review_id === r.id),
        }));
    }

    static async createReview(params: {
        projectId: string;
        title: string;
        description?: string;
        dueDate?: string | null;
        docIds: number[];
        approvers: { id?: string; name: string }[];
        createdBy?: string;
        createdByName?: string;
    }): Promise<CDEReview> {
        const { data: review, error } = await cde
            .from('cde_reviews')
            .insert({
                project_id: params.projectId,
                title: params.title,
                description: params.description ?? null,
                due_date: params.dueDate ?? null,
                created_by: params.createdBy ?? null,
                created_by_name: params.createdByName ?? null,
            })
            .select()
            .single();
        if (error) throw new Error(`Tạo gói duyệt thất bại: ${error.message}`);

        const reviewId = (review as any).id as string;
        if (params.docIds.length > 0) {
            await cde.from('cde_review_items').insert(
                params.docIds.map((doc_id) => ({ review_id: reviewId, doc_id }))
            );
        }
        if (params.approvers.length > 0) {
            await cde.from('cde_review_approvers').insert(
                params.approvers.map((a) => ({ review_id: reviewId, approver_id: a.id ?? null, approver_name: a.name }))
            );
        }

        await CDEPermissionService.logAudit({
            projectId: params.projectId,
            entityType: 'review',
            entityId: reviewId,
            action: 'edit',
            actorId: params.createdBy || '',
            actorName: params.createdByName || '',
            details: { title: params.title, docs: params.docIds.length, approvers: params.approvers.length },
        });

        return review as CDEReview;
    }

    /** Ghi quyết định của một người duyệt + tự cập nhật rollup của gói. */
    static async recordDecision(params: {
        approverRowId: string;
        reviewId: string;
        projectId: string;
        decision: CDEReviewDecision;
        comment?: string;
        signed?: boolean;
        actorId?: string;
        actorName?: string;
    }): Promise<void> {
        const { error } = await cde
            .from('cde_review_approvers')
            .update({
                decision: params.decision,
                comment: params.comment ?? null,
                signed: params.signed ?? false,
                decided_at: new Date().toISOString(),
            })
            .eq('id', params.approverRowId);
        if (error) throw new Error(`Ghi quyết định thất bại: ${error.message}`);

        // Cập nhật rollup
        const { data: approvers } = await cde
            .from('cde_review_approvers')
            .select('decision')
            .eq('review_id', params.reviewId);
        const status = rollupStatus((approvers || []) as { decision: CDEReviewDecision }[]);
        await cde.from('cde_reviews').update({ status }).eq('id', params.reviewId);

        await CDEPermissionService.logAudit({
            projectId: params.projectId,
            entityType: 'review',
            entityId: params.reviewId,
            action: params.decision === 'approved' ? 'approve' : params.decision === 'rejected' ? 'reject' : 'edit',
            actorId: params.actorId || '',
            actorName: params.actorName || '',
            details: { decision: params.decision, signed: params.signed, comment: params.comment },
        });
    }
}

export default CDEReviewService;
