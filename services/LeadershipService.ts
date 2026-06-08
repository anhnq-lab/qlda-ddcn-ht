/**
 * LeadershipService — QLDA ĐDCN
 *
 * CRUD cho bảng leadership_assignments: phân công Ban QLDA mà mỗi
 * Phó Giám đốc phụ trách. Là nguồn sự thật cho:
 *   - Data scope của deputy_director (PermissionContext / useScopedProjects)
 *   - UI quản lý phân công (Quản trị HT → Cài đặt) [C-5.2]
 *   - Sơ đồ tổ chức (đọc lại thay cho suy theo vị trí mảng) [C-5.2]
 */
import { supabase } from '../lib/supabase';

// user_permissions/leadership_assignments có thể chưa nằm trong generated types
const db = () => (supabase as any).from('leadership_assignments');

export interface LeadershipAssignment {
    id: string;
    deputyEmployeeId: string;
    boardNumber: number;
}

const mapRow = (row: any): LeadershipAssignment => ({
    id: row.id,
    deputyEmployeeId: row.deputy_employee_id,
    boardNumber: row.board_number,
});

export const LeadershipService = {
    /**
     * Mảng số Ban QLDA mà một Phó GĐ phụ trách. Rỗng nếu chưa phân công.
     */
    async getManagedBoards(deputyEmployeeId: string): Promise<number[]> {
        const { data, error } = await db()
            .select('board_number')
            .eq('deputy_employee_id', deputyEmployeeId);

        if (error || !data) return [];
        return (data as any[])
            .map(r => Number(r.board_number))
            .filter(n => Number.isFinite(n));
    },

    /**
     * Mã phòng mà một Phó GĐ phụ trách = (Ban QLDA suy từ board_number)
     * ∪ (phòng nghiệp vụ functional_dept_codes). Dùng để lọc công việc theo
     * đúng các phòng PGĐ phụ trách (khớp hàm RLS get_current_deputy_managed_department_codes).
     */
    async getManagedDepartmentCodes(deputyEmployeeId: string): Promise<string[]> {
        const { data, error } = await db()
            .select('board_number, functional_dept_codes')
            .eq('deputy_employee_id', deputyEmployeeId);

        if (error || !data) return [];
        const boardToCode: Record<number, string> = { 1: 'QLDA1', 2: 'QLDA2', 3: 'QLDA3', 4: 'PTDV' };
        const codes = new Set<string>();
        (data as any[]).forEach(r => {
            const c = boardToCode[Number(r.board_number)];
            if (c) codes.add(c);
            (r.functional_dept_codes || []).forEach((fc: string) => { if (fc) codes.add(fc); });
        });
        return [...codes];
    },

    /**
     * Toàn bộ phân công (cho UI admin).
     */
    async getAll(): Promise<LeadershipAssignment[]> {
        const { data, error } = await db().select('*');
        if (error) throw error;
        return (data || []).map(mapRow);
    },

    /**
     * Thay thế toàn bộ phân công của một PGĐ bằng danh sách boards mới.
     */
    async setBoardsForDeputy(
        deputyEmployeeId: string,
        boardNumbers: number[],
        changedBy?: string
    ): Promise<void> {
        // Bảo toàn phòng nghiệp vụ đã gán (functional_dept_codes) qua thao tác sửa Ban
        let preservedDeptCodes: string[] = [];
        try {
            const { data: existing } = await db()
                .select('functional_dept_codes')
                .eq('deputy_employee_id', deputyEmployeeId);
            const set = new Set<string>();
            (existing as any[] | null)?.forEach(r =>
                (r.functional_dept_codes || []).forEach((c: string) => { if (c) set.add(c); })
            );
            preservedDeptCodes = [...set];
        } catch { /* giữ rỗng nếu lỗi */ }

        // Xóa phân công cũ rồi chèn mới (đơn giản, đảm bảo đồng bộ chính xác)
        const { error: delErr } = await db().delete().eq('deputy_employee_id', deputyEmployeeId);
        if (delErr) throw delErr;

        if (boardNumbers.length === 0) return;

        const rows = boardNumbers.map((b, i) => ({
            deputy_employee_id: deputyEmployeeId,
            board_number: b,
            // Gắn phòng nghiệp vụ vào dòng đầu để không mất khi sửa Ban
            functional_dept_codes: i === 0 ? preservedDeptCodes : [],
            created_by: changedBy ?? null,
            updated_at: new Date().toISOString(),
        }));

        const { error: insErr } = await db().insert(rows);
        if (insErr) throw insErr;
    },
};

export default LeadershipService;
