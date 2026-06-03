/**
 * LeadershipAssignmentManager — QLDA ĐDCN  [C-5.2]
 *
 * UI cho Admin phân công Ban QLDA mà mỗi Phó Giám đốc phụ trách.
 * Ghi vào leadership_assignments — nguồn sự thật cho scope dữ liệu của
 * deputy_director (PermissionContext) và (về sau) sơ đồ tổ chức.
 *
 * Sau khi lưu: invalidate cache quyền của PGĐ đó để scope áp dụng ngay (C-5.1).
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Award, Save, Building2, Info } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { LeadershipService } from '../../services/LeadershipService';
import { permissionCache } from '../../utils/permissionCache';
import { resolveSystemRole, type SystemRole } from '../../types/permission.types';

interface DeputyInfo {
    employeeId: string;
    fullName: string;
    department: string;
    position: string;
}

const LeadershipAssignmentManager: React.FC = () => {
    const { addToast } = useToast();
    const { can } = usePermissionCheck();
    const { currentUser } = useAuth();

    const [deputies, setDeputies] = useState<DeputyInfo[]>([]);
    const [assignments, setAssignments] = useState<Record<string, number[]>>({});
    const [availableBoards, setAvailableBoards] = useState<number[]>([1, 2, 3, 4, 5]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // 1. Nhân sự đang hoạt động → lọc ra Phó Giám đốc
                const { data: empData } = await supabase
                    .from('employees')
                    .select('employee_id, full_name, department, position, role, system_role')
                    .eq('status', 1)
                    .order('full_name');

                const deps: DeputyInfo[] = (empData || [])
                    .filter((e: any) => {
                        const sr: SystemRole = e.system_role
                            ? (e.system_role as SystemRole)
                            : resolveSystemRole(e.role, e.position || '', e.department || '');
                        return sr === 'deputy_director';
                    })
                    .map((e: any) => ({
                        employeeId: e.employee_id,
                        fullName: e.full_name,
                        department: e.department || '',
                        position: e.position || '',
                    }));
                setDeputies(deps);

                // 2. Phân công hiện có
                const all = await LeadershipService.getAll();
                const grouped: Record<string, number[]> = {};
                all.forEach(a => {
                    (grouped[a.deputyEmployeeId] ||= []).push(a.boardNumber);
                });
                Object.values(grouped).forEach(arr => arr.sort((x, y) => x - y));
                setAssignments(grouped);

                // 3. Các Ban QLDA có thật (distinct management_board)
                const { data: projData } = await supabase
                    .from('projects')
                    .select('management_board');
                const boards = Array.from(
                    new Set(
                        (projData || [])
                            .map((p: any) => Number(p.management_board))
                            .filter((n: number) => Number.isFinite(n) && n > 0)
                    )
                ).sort((a, b) => a - b);
                if (boards.length > 0) setAvailableBoards(boards);
            } catch (err) {
                console.error('[LeadershipManager] load failed:', err);
                addToast({ title: 'Lỗi', message: 'Không tải được dữ liệu phân công', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const toggleBoard = useCallback((deputyId: string, board: number) => {
        setAssignments(prev => {
            const cur = prev[deputyId] || [];
            const next = cur.includes(board) ? cur.filter(b => b !== board) : [...cur, board].sort((a, b) => a - b);
            return { ...prev, [deputyId]: next };
        });
    }, []);

    const handleSave = useCallback(async (deputy: DeputyInfo) => {
        if (!can('admin_roles', 'update')) {
            addToast({ title: 'Lỗi', message: 'Bạn không có quyền thay đổi phân công.', type: 'error' });
            return;
        }
        setSavingId(deputy.employeeId);
        try {
            const boards = assignments[deputy.employeeId] || [];
            await LeadershipService.setBoardsForDeputy(deputy.employeeId, boards, currentUser?.EmployeeID);
            // Áp dụng ngay: xoá cache quyền của PGĐ này (C-5.1)
            permissionCache.invalidate(deputy.employeeId);
            addToast({
                title: 'Thành công',
                message: boards.length > 0
                    ? `Đã lưu: ${deputy.fullName} phụ trách Ban ${boards.join(', ')}`
                    : `Đã gỡ toàn bộ phân công của ${deputy.fullName} (sẽ tạm giữ Global view).`,
                type: 'success',
            });
        } catch (err) {
            console.error('[LeadershipManager] save failed:', err);
            addToast({ title: 'Lỗi', message: 'Không lưu được phân công', type: 'error' });
        } finally {
            setSavingId(null);
        }
    }, [assignments, can, currentUser, addToast]);

    const hasDeputies = deputies.length > 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Giải thích */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">Phân công Ban phụ trách cho Phó Giám đốc</p>
                    <p className="text-xs leading-relaxed">
                        Mỗi Phó GĐ chỉ xem được dự án thuộc các Ban QLDA được tích chọn dưới đây.
                        Phó GĐ <strong>chưa được phân công</strong> sẽ tạm thời thấy toàn bộ dự án (Global) cho đến khi cấu hình.
                    </p>
                </div>
            </div>

            {!hasDeputies && (
                <div className="text-center py-12 text-txt-muted text-sm">
                    Không tìm thấy nhân sự có vai trò <strong>Phó Giám đốc</strong>.
                </div>
            )}

            {/* Danh sách PGĐ */}
            <div className="grid gap-4">
                {deputies.map(deputy => {
                    const selected = assignments[deputy.employeeId] || [];
                    const isSaving = savingId === deputy.employeeId;
                    return (
                        <div
                            key={deputy.employeeId}
                            className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm p-5"
                        >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/30">
                                        <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-txt-primary">{deputy.fullName}</p>
                                        <p className="text-xs text-txt-muted">{deputy.position} · {deputy.department}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSave(deputy)}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>

                            {/* Chọn Ban */}
                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-txt-muted flex items-center gap-1 mr-1">
                                    <Building2 className="w-3.5 h-3.5" /> Ban phụ trách:
                                </span>
                                {availableBoards.map(board => {
                                    const isOn = selected.includes(board);
                                    return (
                                        <button
                                            key={board}
                                            onClick={() => toggleBoard(deputy.employeeId, board)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                                                isOn
                                                    ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                                                    : 'border-slate-200 dark:border-slate-600 text-txt-muted hover:border-primary-300 dark:hover:border-primary-500'
                                            }`}
                                        >
                                            Ban {board}
                                        </button>
                                    );
                                })}
                                {selected.length === 0 && (
                                    <span className="text-[11px] text-warning-600 dark:text-warning-400 italic ml-1">
                                        Chưa phân công → Global view
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LeadershipAssignmentManager;
