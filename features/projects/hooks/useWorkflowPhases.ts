/**
 * useWorkflowPhases — DB-driven phases/steps cho Tab Kế hoạch
 * 
 * Cấu trúc 4 cấp: Phase → Sub-process → Step (node) → Sub-tasks
 * Lấy trực tiếp từ workflow_nodes trong DB (workflows table, category='project').
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ── Re-export compatible interfaces ──
export interface PhaseItem {
    id: string;
    title: string;
    code: string; // node_id (uuid)
    assigneeRole?: string;   // e.g., "CĐT", "CĐT / HĐTĐ"
    slaFormula?: string;      // e.g., "30d", "82d"
    estimatedDays?: number;   // parsed from sla_formula
}

export interface SubProcessGroup {
    id: string;       // e.g., "I.1"
    title: string;    // e.g., "Quyết định chủ trương đầu tư"
    fullTitle: string; // e.g., "I.1. Quyết định chủ trương đầu tư"
    items: PhaseItem[];
}

export interface ProjectPhase {
    id: string;
    title: string;
    description: string;
    items: PhaseItem[];              // Flat list (all steps in this phase)
    subProcesses: SubProcessGroup[]; // Grouped by sub_process
}

const PHASE_TITLES: Record<string, string> = {
    preparation: 'GIAI ĐOẠN CHUẨN BỊ DỰ ÁN',
    execution: 'GIAI ĐOẠN THỰC HIỆN DỰ ÁN',
    completion: 'GIAI ĐOẠN KẾT THÚC XÂY DỰNG',
};

const PHASE_IDS: Record<string, string> = {
    preparation: 'PHASE_1',
    execution: 'PHASE_2',
    completion: 'PHASE_3',
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
    preparation: 'Chuẩn bị đầu tư, lập dự án, phê duyệt chủ trương',
    execution: 'Thiết kế, đấu thầu, thi công, giám sát',
    completion: 'Nghiệm thu, bàn giao, quyết toán',
};

const PHASE_ORDER = ['preparation', 'execution', 'completion'];

interface WorkflowNodeRow {
    id: string;
    name: string;
    type: string;
    sla_formula: string | null;
    metadata: {
        phase?: string;
        sub_process?: string;
        legalBasis?: string;
        estimatedDays?: number;
        sub_tasks?: Array<{
            id: string;
            name?: string;
            title?: string;
            description?: string;
            actor?: string;
            assignee_role?: string;
            legal_basis?: string;
            output?: string;
            template_forms?: string;
            duration_days?: number;
        }>;
        [key: string]: any;
    } | null;
    created_at: string;
}

/**
 * Select the best workflow template for a project based on group_code
 * Default: "Quy trình DAXD - Dự án 1 bước" (QT-DA1B)
 */
function selectWorkflowCode(groupCode: string, project?: any): string {
    const designSteps = project?.DesignSteps || project?.design_steps || 1;
    if (designSteps === 3) return 'QT-DA3B';
    if (designSteps === 2) return 'QT-DA2B';
    return 'QT-DA1B';
}

/**
 * Hook chính: fetch workflow nodes từ DB, trả về phases 4 cấp & sub-tasks
 */
export function useWorkflowPhases(groupCode: string = 'C', project?: any) {
    const workflowCode = selectWorkflowCode(groupCode, project);

    // Fetch workflow + nodes directly from DB
    const { data: nodesData, isLoading } = useQuery({
        queryKey: ['workflow-phases', workflowCode, project?.ProjectID],
        queryFn: async () => {
            let targetWorkflowId: string | null = null;

            // 1. Try to fetch the currently active workflow instance for this project
            if (project?.ProjectID) {
                const { data: insts } = await supabase
                    .from('workflow_instances')
                    .select('workflow_id')
                    .eq('reference_id', project.ProjectID)
                    .order('started_at', { ascending: false })
                    .limit(1);
                
                if (insts && insts.length > 0) {
                    targetWorkflowId = insts[0].workflow_id;
                }
            }

            // 2. Fallback to the configured template code if no instance exists
            if (!targetWorkflowId) {
                const { data: workflow, error: wfErr } = await supabase
                    .from('workflows')
                    .select('id, name, code')
                    .eq('code', workflowCode)
                    .eq('is_active', true)
                    .eq('category', 'project')
                    .single();

                if (workflow && !wfErr) {
                    targetWorkflowId = workflow.id;
                } else {
                    console.warn(`Workflow template "${workflowCode}" not found, trying fallback...`);
                    const { data: fallback } = await supabase
                        .from('workflows')
                        .select('id, name, code')
                        .eq('is_active', true)
                        .eq('category', 'project')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                    if (fallback) targetWorkflowId = fallback.id;
                }
            }

            if (!targetWorkflowId) {
                return { nodes: [], workflowId: '' };
            }

            // 3. Fetch nodes for the target workflow
            const { data: nodes, error: nodeErr } = await supabase
                .from('workflow_nodes')
                .select('id, name, type, sla_formula, metadata, created_at, sort_order')
                .eq('workflow_id', targetWorkflowId)
                .eq('is_deleted', false)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true }); // tiebreaker

            if (nodeErr) {
                console.error('Failed to load workflow nodes:', nodeErr);
                return { nodes: [], workflowId: targetWorkflowId };
            }

            return { nodes: (nodes || []) as WorkflowNodeRow[], workflowId: targetWorkflowId };
        },
        staleTime: 10 * 60 * 1000,
    });

    const nodes = nodesData?.nodes || [];

    // Build phases from nodes — 4 cấp: Phase → Sub-process → Step → Sub-tasks
    const phases = useMemo<ProjectPhase[]>(() => {
        if (nodes.length === 0) return [];

        // Filter work nodes — bao gồm tất cả node thực tế, loại bỏ chỉ node định tuyến
        // 'end' = bước cuối (Tất toán, Đóng mã DA) — phải hiển thị trong WBS
        const SKIP_TYPES = new Set(['gateway', 'connector']);
        const workNodes = nodes.filter(n => !SKIP_TYPES.has(n.type));

        // Intermediate structure: phase → sub_process → items
        const phaseMap: Record<string, Record<string, PhaseItem[]>> = {};
        const flatPhaseItems: Record<string, PhaseItem[]> = {};

        workNodes.forEach((node) => {
            const phase = node.metadata?.phase || 'preparation';
            const subProcess = node.metadata?.sub_process || 'Khác';
            
            if (!phaseMap[phase]) phaseMap[phase] = {};
            if (!phaseMap[phase][subProcess]) phaseMap[phase][subProcess] = [];
            if (!flatPhaseItems[phase]) flatPhaseItems[phase] = [];

            // Extract step number from name (e.g., "1. Lập BCNCTKT..." → "1")
            const nameMatch = node.name.match(/^(\d+)\.\s*/);
            const stepNum = nameMatch ? nameMatch[1] : String(flatPhaseItems[phase].length + 1);
            const cleanTitle = nameMatch ? node.name.replace(/^\d+\.\s*/, '') : node.name;

            // Extract assignee_role: ưu tiên trực tiếp trên node metadata,
            // rồi mới tới sub_task đầu tiên (field assignee_role hoặc actor)
            const assigneeRole = node.metadata?.assignee_role
                || node.metadata?.sub_tasks?.[0]?.assignee_role
                || node.metadata?.sub_tasks?.[0]?.actor
                || undefined;
            const slaRaw = node.sla_formula || undefined;
            // Parse "30d" → 30 (dùng regex để tránh parseInt("30d") = 30 nhưng nhất quán)
            const slaMatch = slaRaw?.match(/^(\d+)d$/);
            const estimatedDays = slaMatch ? parseInt(slaMatch[1]) : undefined;

            const item: PhaseItem = {
                id: stepNum,
                title: cleanTitle,
                code: node.id,
                assigneeRole,
                slaFormula: slaRaw,
                estimatedDays: isNaN(estimatedDays as number) ? undefined : estimatedDays,
            };

            phaseMap[phase][subProcess].push(item);
            flatPhaseItems[phase].push(item);
        });

        // Build ordered phases with sub-processes
        return PHASE_ORDER
            .filter(phase => flatPhaseItems[phase] && flatPhaseItems[phase].length > 0)
            .map((phase, phaseIdx) => {
                // Build sub-process groups preserving insertion order
                const spMap = phaseMap[phase] || {};
                const subProcesses: SubProcessGroup[] = Object.entries(spMap).map(([fullTitle, items]) => {
                    // Parse "I.1. Quyết định chủ trương đầu tư" → id="I.1", title="Quyết định..."
                    const spMatch = fullTitle.match(/^([IVX]+\.\d+)\.\s*(.*)/);
                    const spId = spMatch ? spMatch[1] : `${phaseIdx + 1}.0`;
                    const spTitle = spMatch ? spMatch[2] : fullTitle;

                    return {
                        id: spId,
                        title: spTitle,
                        fullTitle,
                        items,
                    };
                });

                return {
                    id: PHASE_IDS[phase],
                    title: PHASE_TITLES[phase],
                    description: PHASE_DESCRIPTIONS[phase],
                    items: flatPhaseItems[phase],
                    subProcesses,
                };
            });
    }, [nodes]);

    /** Group label */
    const getGroupLabel = (g?: string) => {
        switch (g) {
            case 'QN': return 'Quan trọng QG';
            case 'A': return 'Nhóm A';
            case 'B': return 'Nhóm B';
            case 'C': return 'Nhóm C';
            default: return 'Nhóm C';
        }
    };

    return {
        phases,
        isLoading,
        getGroupLabel,
    };
}
