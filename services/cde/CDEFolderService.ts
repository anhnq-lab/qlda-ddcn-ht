import { supabase } from '../../lib/supabase';
import type { CDEFolder } from '../../features/cde/types';

const cde: any = supabase;

export class CDEFolderService {
    /**
     * Get all CDE folders for a project, with document counts.
     */
    static async getFolders(projectId: string): Promise<CDEFolder[]> {
        const { data, error } = await cde
            .from('cde_folders')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order', { ascending: true });

        if (error) throw new Error(`Failed to fetch CDE folders: ${error.message}`);

        // Count docs per folder
        const { data: counts } = await cde
            .from('documents')
            .select('cde_folder_id')
            .eq('project_id', projectId)
            .not('cde_folder_id', 'is', null);

        const countMap: Record<string, number> = {};
        (counts || []).forEach((row: any) => {
            const fid = row.cde_folder_id;
            if (fid) countMap[fid] = (countMap[fid] || 0) + 1;
        });

        return (data || []).map((f: any) => ({
            ...f,
            doc_count: countMap[f.id] || 0,
        })) as CDEFolder[];
    }

    /**
     * Create a new folder.
     */
    static async createFolder(folder: Partial<CDEFolder>): Promise<CDEFolder> {
        const { data, error } = await cde
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
        const { data: existing } = await cde
            .from('cde_folders')
            .select('id')
            .eq('project_id', projectId)
            .eq('phase', phase)
            .limit(1);
        if (existing && existing.length > 0) return; // Already seeded

        // Find existing root containers (phase=null) to attach subfolders to
        const { data: roots } = await cde
            .from('cde_folders')
            .select('id, container_type')
            .eq('project_id', projectId)
            .is('parent_id', null)
            .is('phase', null);

        if (!roots || roots.length === 0) return;

        const rootMap: Record<string, string> = {};
        roots.forEach((r: any) => { rootMap[r.container_type] = r.id; });

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
            await cde.from('cde_folders').insert(wipSubs);
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
            await cde.from('cde_folders').insert(subs);
        }
    }
}
