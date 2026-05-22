/**
 * bimCollabService — Persistence for saved camera views + BCF-lite issues.
 * Backed by Supabase tables: bim_saved_views, bim_issues, bim_issue_comments.
 *
 * All queries cast `.from(...)` to `any` because the generated Supabase types
 * haven't been refreshed for these new tables. Re-running
 *     supabase gen types typescript --local > types/supabase.ts
 * removes the casts.
 */

import { supabase } from '../lib/supabase';

// ── Saved Views ───────────────────────────────────────────────────────

export interface BimViewState {
    /** Camera position + target + up vector + fov */
    camera: {
        position: [number, number, number];
        target: [number, number, number];
        up?: [number, number, number];
        fov?: number;
    };
    /** Active section planes (axis-aligned + free) */
    sections?: Array<{
        type: 'axis' | 'free' | 'box';
        normal?: [number, number, number];
        point?: [number, number, number];
        bounds?: { min: [number, number, number]; max: [number, number, number] };
    }>;
    /** Isolated element IDs per model */
    isolation?: Record<string, number[]>;
    /** Hidden element IDs per model */
    hidden?: Record<string, number[]>;
    /** Active render mode (shading | wireframe | xray | ghosting) */
    renderMode?: string;
    /** Explode factor (0–1) */
    explode?: number;
    /** Active storey filter */
    visibleStoreys?: number[];
    /** Color-by mode (none | discipline | storey | type | property:key) */
    colorBy?: string;
}

export interface BimSavedView {
    id: string;
    project_id: string;
    name: string;
    description?: string | null;
    state: BimViewState;
    thumbnail_url?: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
}

export const bimSavedViewsService = {
    async list(projectId: string): Promise<BimSavedView[]> {
        if (!supabase) return [];
        const { data, error } = await (supabase.from('bim_saved_views' as any) as any)
            .select('*')
            .eq('project_id', projectId)
            .order('updated_at', { ascending: false });
        if (error) { console.warn('[bimSavedViews] list failed:', error.message); return []; }
        return (data as BimSavedView[]) || [];
    },

    async create(input: {
        projectId: string;
        name: string;
        description?: string;
        state: BimViewState;
        thumbnailUrl?: string;
        createdBy?: string;
    }): Promise<BimSavedView | null> {
        if (!supabase) return null;
        const { data, error } = await (supabase.from('bim_saved_views' as any) as any)
            .insert({
                project_id: input.projectId,
                name: input.name,
                description: input.description ?? null,
                state: input.state,
                thumbnail_url: input.thumbnailUrl ?? null,
                created_by: input.createdBy ?? null,
            })
            .select('*')
            .single();
        if (error) { console.warn('[bimSavedViews] create failed:', error.message); return null; }
        return data as BimSavedView;
    },

    async update(id: string, patch: Partial<Pick<BimSavedView, 'name' | 'description' | 'state' | 'thumbnail_url'>>): Promise<void> {
        if (!supabase) return;
        const { error } = await (supabase.from('bim_saved_views' as any) as any)
            .update(patch)
            .eq('id', id);
        if (error) console.warn('[bimSavedViews] update failed:', error.message);
    },

    async remove(id: string): Promise<void> {
        if (!supabase) return;
        const { error } = await (supabase.from('bim_saved_views' as any) as any)
            .delete()
            .eq('id', id);
        if (error) console.warn('[bimSavedViews] remove failed:', error.message);
    },
};

// ── Issues (BCF-lite) ─────────────────────────────────────────────────

export type BimIssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type BimIssuePriority = 'low' | 'normal' | 'high' | 'critical';

export interface BimIssue {
    id: string;
    project_id: string;
    title: string;
    description?: string | null;
    status: BimIssueStatus;
    priority: BimIssuePriority;
    viewpoint?: BimViewState | null;
    screenshot_url?: string | null;
    target_express_id?: number | null;
    target_model_id?: string | null;
    assigned_to?: string | null;
    due_date?: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
    resolved_at?: string | null;
}

export interface BimIssueComment {
    id: string;
    issue_id: string;
    body: string;
    author?: string | null;
    created_at: string;
}

export const bimIssuesService = {
    async list(projectId: string, status?: BimIssueStatus): Promise<BimIssue[]> {
        if (!supabase) return [];
        let q = (supabase.from('bim_issues' as any) as any)
            .select('*')
            .eq('project_id', projectId)
            .order('updated_at', { ascending: false });
        if (status) q = q.eq('status', status);
        const { data, error } = await q;
        if (error) { console.warn('[bimIssues] list failed:', error.message); return []; }
        return (data as BimIssue[]) || [];
    },

    async create(input: Omit<BimIssue, 'id' | 'created_at' | 'updated_at' | 'resolved_at'>): Promise<BimIssue | null> {
        if (!supabase) return null;
        const { data, error } = await (supabase.from('bim_issues' as any) as any)
            .insert(input)
            .select('*')
            .single();
        if (error) { console.warn('[bimIssues] create failed:', error.message); return null; }
        return data as BimIssue;
    },

    async update(id: string, patch: Partial<BimIssue>): Promise<void> {
        if (!supabase) return;
        const next: any = { ...patch };
        if (patch.status === 'resolved' && !patch.resolved_at) {
            next.resolved_at = new Date().toISOString();
        }
        const { error } = await (supabase.from('bim_issues' as any) as any)
            .update(next)
            .eq('id', id);
        if (error) console.warn('[bimIssues] update failed:', error.message);
    },

    async remove(id: string): Promise<void> {
        if (!supabase) return;
        const { error } = await (supabase.from('bim_issues' as any) as any).delete().eq('id', id);
        if (error) console.warn('[bimIssues] remove failed:', error.message);
    },

    async listComments(issueId: string): Promise<BimIssueComment[]> {
        if (!supabase) return [];
        const { data, error } = await (supabase.from('bim_issue_comments' as any) as any)
            .select('*')
            .eq('issue_id', issueId)
            .order('created_at', { ascending: true });
        if (error) { console.warn('[bimIssueComments] list failed:', error.message); return []; }
        return (data as BimIssueComment[]) || [];
    },

    async addComment(input: { issueId: string; body: string; author?: string }): Promise<BimIssueComment | null> {
        if (!supabase) return null;
        const { data, error } = await (supabase.from('bim_issue_comments' as any) as any)
            .insert({ issue_id: input.issueId, body: input.body, author: input.author ?? null })
            .select('*')
            .single();
        if (error) { console.warn('[bimIssueComments] add failed:', error.message); return null; }
        return data as BimIssueComment;
    },
};
