// ─── phaseUtils.ts ─────────────────────────────────────────────
// Nguồn dữ liệu tập trung cho cấu hình giai đoạn (Phase).
// Trước đây bị duplicate giữa WorkflowProcessTable và WorkflowBuilderPanel.
// Mọi thay đổi tên/màu phase chỉ cần sửa ở đây.

import type { WorkflowNode } from '../../../types/workflow.types';

// ─── Phase Config ───────────────────────────────────────────────
export interface PhaseConfig {
    title: string;
    gradient: string;
    icon: string;
}

export const PHASE_CONFIG: Record<string, PhaseConfig> = {
    // ── Macro project workflow phases (QT-DA1B/2B/3B) ─────────────
    preparation: {
        title: 'Chuẩn bị dự án',
        gradient: 'from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/10',
        icon: '📋',
    },
    execution: {
        title: 'Thực hiện dự án',
        gradient: 'from-warning-50 to-warning-100/50 dark:from-warning-900/30 dark:to-warning-900/10',
        icon: '🏗️',
    },
    completion: {
        title: 'Kết thúc xây dựng',
        gradient: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-900/10',
        icon: '✅',
    },
    // ── Internal design workflow phases (QT-TK1B/2B/3B) ──────────
    initiation: {
        title: 'KHỞI TẠO & CHUẨN BỊ',
        gradient: 'from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/10',
        icon: '🚀',
    },
    consultant: {
        title: 'GIAO TƯ VẤN & THỰC HIỆN',
        gradient: 'from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-900/10',
        icon: '📐',
    },
    reception: {
        title: 'TIẾP NHẬN HỒ SƠ',
        gradient: 'from-sky-50 to-sky-100/50 dark:from-sky-900/30 dark:to-sky-900/10',
        icon: '📥',
    },
    review: {
        title: 'KIỂM TRA NỘI DUNG HỒ SƠ',
        gradient: 'from-violet-50 to-violet-100/50 dark:from-violet-900/30 dark:to-violet-900/10',
        icon: '🔍',
    },
    consolidation: {
        title: 'TỔNG HỢP & THẨM ĐỊNH',
        gradient: 'from-teal-50 to-teal-100/50 dark:from-teal-900/30 dark:to-teal-900/10',
        icon: '📊',
    },
    approval: {
        title: 'PHÊ DUYỆT',
        gradient: 'from-rose-50 to-rose-100/50 dark:from-rose-900/30 dark:to-rose-900/10',
        icon: '✍️',
    },
    handover: {
        title: 'BÀN GIAO & LƯU TRỮ',
        gradient: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-900/10',
        icon: '📦',
    },
    other: {
        title: 'KHÁC',
        gradient: 'from-slate-200 to-slate-300/50 dark:from-slate-800 dark:to-slate-900/50',
        icon: '📎',
    },
};

// ─── Phase Order ─────────────────────────────────────────────────
// Macro project: preparation → execution → completion
// Design internal: initiation → consultant → reception → review → consolidation → approval → handover
export const PHASE_ORDER = [
    'preparation', 'execution',
    'initiation', 'consultant', 'reception', 'review', 'consolidation', 'approval', 'handover',
    'completion', 'other',
];

// ─── Group Nodes by Phase & Sub-process ─────────────────────────
export interface GroupedPhase {
    phase: string;
    config: PhaseConfig;
    subProcesses: Record<string, WorkflowNode[]>;
}

/**
 * Nhóm danh sách node theo phase → sub_process.
 * - Phase không có trong PHASE_CONFIG → xếp vào 'other'
 * - Nodes không có metadata.phase → xếp vào 'other'
 * - Nodes không có metadata.sub_process → xếp vào 'Chung'
 * - Giữ nguyên sort_order của nodes trong mỗi nhóm
 */
export function groupNodesByPhase(nodes: WorkflowNode[]): GroupedPhase[] {
    // Map: phase → sub_process → nodes[]
    const phaseMap: Record<string, Record<string, WorkflowNode[]>> = {};

    for (const node of nodes) {
        const rawPhase = node.metadata?.phase as string | undefined;
        const phase = (rawPhase && PHASE_CONFIG[rawPhase]) ? rawPhase : 'other';
        const subProcess = (node.metadata?.sub_process as string | undefined) || 'Chung';

        if (!phaseMap[phase]) phaseMap[phase] = {};
        if (!phaseMap[phase][subProcess]) phaseMap[phase][subProcess] = [];
        phaseMap[phase][subProcess].push(node);
    }

    // Sort phases theo PHASE_ORDER, chỉ include phases có nodes
    return PHASE_ORDER
        .filter(phase => phaseMap[phase])
        .map(phase => ({
            phase,
            config: PHASE_CONFIG[phase] ?? PHASE_CONFIG['other'],
            subProcesses: phaseMap[phase],
        }));
}

// ─── SLA Parser (re-export for convenience) ──────────────────────
export { parseSla } from './workflowUtils';

// ─── Compute total SLA from nodes ───────────────────────────────
/**
 * Tính tổng SLA của tất cả nodes trong workflow (chỉ tính unit ngày/ngày làm việc).
 * Trả về chuỗi, ví dụ: "45 ngày" hoặc null nếu không có SLA nào.
 */
export function computeTotalSla(nodes: WorkflowNode[]): string | null {
    let totalDays = 0;
    let hasAny = false;

    for (const node of nodes) {
        const formula = node.sla_formula;
        if (!formula) continue;
        const match = formula.match(/^(\d+)/);
        if (!match) continue;
        const val = parseInt(match[1]);
        // Chỉ cộng ngày (d, wd) — bỏ qua giờ (h) vì đơn vị khác
        if (!formula.endsWith('h')) {
            totalDays += val;
            hasAny = true;
        }
    }

    if (!hasAny) return null;
    return `${totalDays} ngày`;
}
