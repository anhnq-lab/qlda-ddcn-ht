// ═══════════════════════════════════════════════════════════════
// CDE Item Service — Federation documents + bim_models (cde_items_view)
// Đọc danh sách "CDE item" hợp nhất; điều phối gán/di chuyển cho cả hai nguồn.
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../../lib/supabase';
import type { CDEItem } from '../../features/cde/types';
import { CDEPermissionService } from './CDEPermissionService';

const cde: any = supabase;

export class CDEItemService {
    /**
     * Danh sách CDE item trong một thư mục (gồm cả tài liệu và model BIM).
     */
    static async getItems(folderId: string): Promise<CDEItem[]> {
        const { data, error } = await cde
            .from('cde_items_view')
            .select('*')
            .eq('cde_folder_id', folderId)
            .order('updated_at', { ascending: false });
        if (error) throw new Error(`Không tải được CDE items: ${error.message}`);
        return (data || []) as CDEItem[];
    }

    /**
     * Toàn bộ CDE item của một dự án (cho thống kê / tìm kiếm).
     */
    static async getProjectItems(projectId: string): Promise<CDEItem[]> {
        const { data, error } = await cde
            .from('cde_items_view')
            .select('*')
            .eq('project_id', projectId)
            .order('updated_at', { ascending: false });
        if (error) throw new Error(`Không tải được CDE items dự án: ${error.message}`);
        return (data || []) as CDEItem[];
    }

    /**
     * Gán một model BIM vào thư mục CDE (đưa model vào cây CDE).
     */
    static async assignBimToFolder(
        bimId: string,
        folderId: string,
        actor?: { id: string; name: string; projectId: string }
    ): Promise<void> {
        const { error } = await cde
            .from('bim_models')
            .update({ cde_folder_id: folderId })
            .eq('id', bimId);
        if (error) throw new Error(`Không gán được model vào thư mục: ${error.message}`);

        if (actor) {
            await CDEPermissionService.logAudit({
                projectId: actor.projectId,
                entityType: 'bim_model',
                entityId: bimId,
                action: 'move',
                actorId: actor.id,
                actorName: actor.name,
                details: { cde_folder_id: folderId },
            });
        }
    }

    /**
     * Cập nhật mức nhạy cảm (sensitivity_level) cho một CDE item.
     */
    static async updateSensitivity(
        item: Pick<CDEItem, 'kind' | 'ref_id'>,
        level: number,
        actor?: { id: string; name: string; projectId: string }
    ): Promise<void> {
        const table = item.kind === 'bim' ? 'bim_models' : 'documents';
        const idCol = item.kind === 'bim' ? 'id' : 'doc_id';
        const idVal = item.kind === 'bim' ? item.ref_id : Number(item.ref_id);
        const { error } = await cde.from(table).update({ sensitivity_level: level }).eq(idCol, idVal);
        if (error) throw new Error(`Cập nhật nhãn nhạy cảm thất bại: ${error.message}`);
        if (actor) {
            await CDEPermissionService.logAudit({
                projectId: actor.projectId,
                entityType: item.kind === 'bim' ? 'bim_model' : 'document',
                entityId: item.ref_id,
                action: 'update_sensitivity',
                actorId: actor.id,
                actorName: actor.name,
                details: { sensitivity_level: level },
            });
        }
    }

    /**
     * Ghi audit log khi mở xem model BIM (TT47 2.2.9).
     */
    static async logBimOpen(
        bimId: string,
        actor: { id: string; name: string; projectId: string }
    ): Promise<void> {
        await CDEPermissionService.logAudit({
            projectId: actor.projectId,
            entityType: 'bim_model',
            entityId: bimId,
            action: 'view',
            actorId: actor.id,
            actorName: actor.name,
            details: { action_type: 'open_viewer' },
        });
    }

    /**
     * Di chuyển một CDE item bất kỳ sang thư mục khác (doc hoặc bim).
     */
    static async moveItem(
        item: Pick<CDEItem, 'kind' | 'ref_id'>,
        folderId: string,
        actor?: { id: string; name: string; projectId: string }
    ): Promise<void> {
        if (item.kind === 'bim') {
            await this.assignBimToFolder(item.ref_id, folderId, actor);
            return;
        }
        const { error } = await cde
            .from('documents')
            .update({ cde_folder_id: folderId })
            .eq('doc_id', Number(item.ref_id));
        if (error) throw new Error(`Không di chuyển được tài liệu: ${error.message}`);
        if (actor) {
            await CDEPermissionService.logAudit({
                projectId: actor.projectId,
                entityType: 'document',
                entityId: item.ref_id,
                action: 'move',
                actorId: actor.id,
                actorName: actor.name,
                details: { cde_folder_id: folderId },
            });
        }
    }
}

export default CDEItemService;
