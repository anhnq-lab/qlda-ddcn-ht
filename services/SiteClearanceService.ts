import { supabaseExt } from '@/lib/supabase';
import { SiteClearance, SiteClearanceMilestone, UpdateSiteClearanceDTO, UpdateClearanceMilestoneDTO } from '@/types';
import { ServiceError } from './ServiceError';

// Danh sách 16 bước GPMB theo hướng dẫn 3254
const DEFAULT_MILESTONES = [
    { step_number: 1, step_name: 'Ban hành Thông báo thu hồi đất, Kế hoạch thu hồi đất' },
    { step_number: 2, step_name: 'Thông báo trên phương tiện thông tin đại chúng và gửi đến từng người có đất thu hồi' },
    { step_number: 3, step_name: 'Thành lập Hội đồng bồi thường, Tổ công tác' },
    { step_number: 4, step_name: 'Lập bản đồ ranh giới, trích lục bản đồ địa chính' },
    { step_number: 5, step_name: 'Phát tờ khai và hướng dẫn kê khai' },
    { step_number: 6, step_name: 'Kiểm kê đất đai, tài sản gắn liền với đất' },
    { step_number: 7, step_name: 'Xác nhận nguồn gốc sử dụng đất, tài sản' },
    { step_number: 8, step_name: 'Lập phương án bồi thường, hỗ trợ, tái định cư' },
    { step_number: 9, step_name: 'Niêm yết, lấy ý kiến về phương án bồi thường' },
    { step_number: 10, step_name: 'Hoàn chỉnh phương án trình thẩm định' },
    { step_number: 11, step_name: 'Thẩm định phương án bồi thường, hỗ trợ, tái định cư' },
    { step_number: 12, step_name: 'Quyết định thu hồi đất và Phê duyệt phương án' },
    { step_number: 13, step_name: 'Gửi Quyết định và Phương án đã phê duyệt cho người có đất' },
    { step_number: 14, step_name: 'Chi trả tiền bồi thường, hỗ trợ' },
    { step_number: 15, step_name: 'Bàn giao mặt bằng' },
    { step_number: 16, step_name: 'Cưỡng chế thu hồi đất (Nếu có)' },
];

export class SiteClearanceService {
    /**
     * Lấy thông tin tổng quan GPMB của dự án
     */
    static async getClearanceByProjectId(projectId: string): Promise<SiteClearance | null> {
        try {
            const { data, error } = await supabaseExt
                .from('site_clearances')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is not found
                throw error;
            }
            
            return data as SiteClearance | null;
        } catch (error: any) {
            console.error('Error fetching site clearance:', error);
            throw new ServiceError('Không thể lấy thông tin GPMB', 'DB_FETCH', error);
        }
    }

    /**
     * Khởi tạo bản ghi GPMB và 16 bước mặc định cho dự án
     */
    static async initializeClearance(projectId: string): Promise<SiteClearance> {
        try {
            // 1. Check if already exists
            const existing = await this.getClearanceByProjectId(projectId);
            if (existing) return existing;

            // 2. Create base clearance record
            const { data: clearance, error: clearanceError } = await supabaseExt
                .from('site_clearances')
                .insert({ project_id: projectId })
                .select()
                .single();

            if (clearanceError) throw clearanceError;

            // 3. Create 16 milestones
            const milestonesData = DEFAULT_MILESTONES.map(step => ({
                project_id: projectId,
                step_number: step.step_number,
                step_name: step.step_name,
                status: 'pending'
            }));

            const { error: milestonesError } = await supabaseExt
                .from('site_clearance_milestones')
                .insert(milestonesData);

            if (milestonesError) throw milestonesError;

            return clearance as SiteClearance;
        } catch (error: any) {
            console.error('Error initializing site clearance:', error);
            throw new ServiceError('Không thể khởi tạo thông tin GPMB', 'DB_INIT', error);
        }
    }

    /**
     * Cập nhật thông tin tổng quan GPMB
     */
    static async updateClearance(projectId: string, updates: UpdateSiteClearanceDTO): Promise<SiteClearance> {
        try {
            const { data, error } = await supabaseExt
                .from('site_clearances')
                .update(updates)
                .eq('project_id', projectId)
                .select()
                .single();

            if (error) throw error;
            return data as SiteClearance;
        } catch (error: any) {
            console.error('Error updating site clearance:', error);
            throw new ServiceError('Không thể cập nhật thông tin GPMB', 'DB_UPDATE', error);
        }
    }

    /**
     * Lấy danh sách 16 bước GPMB của dự án
     */
    static async getMilestones(projectId: string): Promise<SiteClearanceMilestone[]> {
        try {
            const { data, error } = await supabaseExt
                .from('site_clearance_milestones')
                .select('*')
                .eq('project_id', projectId)
                .order('step_number', { ascending: true });

            if (error) throw error;
            return data as SiteClearanceMilestone[];
        } catch (error: any) {
            console.error('Error fetching milestones:', error);
            throw new ServiceError('Không thể lấy danh sách quy trình GPMB', 'DB_FETCH', error);
        }
    }

    /**
     * Cập nhật trạng thái một bước GPMB
     */
    static async updateMilestone(milestoneId: string, updates: UpdateClearanceMilestoneDTO): Promise<SiteClearanceMilestone> {
        try {
            const { data, error } = await supabaseExt
                .from('site_clearance_milestones')
                .update(updates)
                .eq('id', milestoneId)
                .select()
                .single();

            if (error) throw error;
            return data as SiteClearanceMilestone;
        } catch (error: any) {
            console.error('Error updating milestone:', error);
            throw new ServiceError('Không thể cập nhật bước quy trình GPMB', 'DB_UPDATE', error);
        }
    }
}
