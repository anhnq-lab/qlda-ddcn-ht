import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { TaskService } from '@/services/TaskService';
import { ProjectStepsService } from '@/services/ProjectStepsService';
import { useSlidePanel } from '@/context/SlidePanelContext';
import { 
  Zap, Sparkles, Plus, Trash2, ArrowUp, ArrowDown, 
  Check, X, Calendar, Users, AlertTriangle, ChevronRight,
  RefreshCw, Info, CheckSquare
} from 'lucide-react';
import type { Project } from '@/types/project.types';
import { RaciBadges } from '@/features/workflows/components/RaciBadges';

const buildRaciSummary = (raciList: any[] | undefined) => {
  const summary: any = { R: [], A: [], C: [], I: [] };
  if (!raciList) return summary;
  raciList.forEach(r => {
    if (r.raci_type && summary[r.raci_type]) {
      summary[r.raci_type].push(r.stakeholder_code);
    }
  });
  return summary;
};

// Danh sách các ban ngành mặc định theo quy trình ISO Hải Dương & các Phòng Ban
const DEFAULT_ROLES = [
  // Đơn vị ngoài / Vai trò chung trong dự án
  { value: 'chu_dau_tu', label: 'Chủ đầu tư' },
  { value: 'don_vi_de_xuat', label: 'Đơn vị đề xuất' },
  { value: 'hoi_dong_tham_dinh', label: 'Hội đồng thẩm định' },
  { value: 'nguoi_quyet_dinh_dt', label: 'Người quyết định đầu tư' },
  { value: 'tu_van_thiet_ke', label: 'Tư vấn thiết kế' },
  { value: 'co_quan_chuyen_mon', label: 'Cơ quan chuyên môn' },
  { value: 'hoi_dong_bt_ht_tdc', label: 'Hội đồng bồi thường GPMB' },
  { value: 'nha_thau_thi_cong', label: 'Nhà thầu thi công' },
  { value: 'co_quan_qlnn_xd', label: 'Cơ quan QLNN về xây dựng' },
  { value: 'so_tai_chinh', label: 'Sở Tài chính' },
  { value: 'manager', label: 'Cán bộ Quản lý (Manager)' },

  // Phòng ban nội bộ Ban QLDA
  { value: 'Ban Giám đốc', label: 'Ban Giám đốc' },
  { value: 'Phòng Hành chính – Tổng hợp', label: 'Phòng Hành chính – Tổng hợp' },
  { value: 'Phòng Kế hoạch – Đấu thầu', label: 'Phòng Kế hoạch – Đấu thầu' },
  { value: 'Phòng Kỹ thuật – Thẩm định', label: 'Phòng Kỹ thuật – Thẩm định' },
  { value: 'Phòng Tài chính – Kế toán', label: 'Phòng Tài chính – Kế toán' },
  { value: 'Phòng Quản lý dự án 1', label: 'Phòng Quản lý dự án 1' },
  { value: 'Phòng Quản lý dự án 2', label: 'Phòng Quản lý dự án 2' },
  { value: 'Phòng Quản lý dự án 3', label: 'Phòng Quản lý dự án 3' },
  { value: 'Phòng Phát triển dịch vụ', label: 'Phòng Phát triển dịch vụ' },

  { value: 'custom', label: 'Khác... (Nhập tay)' }
];

const STAKEHOLDERS = [
    { code: 'BQL', name: 'Ban QLDA' },
    { code: 'BQL_PTDV', name: 'Phòng Phát triển DV' },
    { code: 'BQL_QLDA', name: 'Phòng QLDA' },
    { code: 'BQL_HCTH', name: 'Phòng HC-TH' },
    { code: 'BQL_KHDT', name: 'Phòng KH-ĐT' },
    { code: 'BQL_KTTD', name: 'Phòng KT-TĐ' },
    { code: 'TVTK', name: 'Tư vấn thiết kế' },
    { code: 'TVGS', name: 'Tư vấn giám sát' },
    { code: 'TVTT', name: 'Tư vấn thẩm tra' },
    { code: 'TVDT', name: 'Tư vấn đấu thầu' },
    { code: 'NTC', name: 'Nhà thầu chính' },
    { code: 'NTPHU', name: 'Nhà thầu phụ' },
    { code: 'NQDDT', name: 'Người quyết định đầu tư' },
    { code: 'SXD', name: 'Sở Xây dựng' },
    { code: 'STC', name: 'Sở Tài chính' },
    { code: 'UBND', name: 'UBND tỉnh' },
    { code: 'KBNN', name: 'Kho bạc Nhà nước' },
    { code: 'KTNN', name: 'Kiểm toán Nhà nước' }
];

const RACI_TYPES = [
    { code: 'R', label: 'Responsible (Thực hiện)', bg: 'bg-blue-500 text-white', lightBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' },
    { code: 'A', label: 'Accountable (Phê duyệt)', bg: 'bg-emerald-500 text-white', lightBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' },
    { code: 'C', label: 'Consulted (Tham vấn)', bg: 'bg-amber-500 text-white', lightBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' },
    { code: 'I', label: 'Informed (Thông báo)', bg: 'bg-gray-500 text-white', lightBg: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400' }
];

// Danh sách các Giai đoạn (Phase)
const PHASES = [
  { value: 'preparation', label: 'Chuẩn bị dự án', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'execution', label: 'Thực hiện dự án', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'completion', label: 'Kết thúc xây dựng', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
];

interface CreateMasterPlanPanelProps {
  project: Project | null | undefined;
  onClose: () => void;
  onSuccess: () => void;
  hasExistingTasks?: boolean;
}

interface DraftStep {
  id: string; // Tạm thời hoặc UUID
  workflow_node_id: string | null;
  title: string;
  phase: string;
  assignee_role: string;
  start_date: string;
  due_date: string;
  duration_days: number;
  defaultSla: number;
  sub_tasks?: any[];
  metadata?: any;
  raci?: any[];
}

// ── Helpers tính toán ngày làm việc (không tính T7, CN) ──────────────────────
const addWorkingDays = (startDateStr: string, days: number): string => {
  if (!startDateStr || days <= 0) return startDateStr;
  let d = new Date(startDateStr);
  let added = 0;
  let targetDays = days - 1; // 1 ngày nghĩa là kết thúc cùng ngày bắt đầu
  while (added < targetDays) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) { // Bỏ qua Chủ nhật (0) và Thứ Bảy (6)
      added++;
    }
  }
  return d.toISOString().split('T')[0];
};

const getWorkingDaysBetween = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (start > end) return 0;
  
  let days = 0;
  let cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      days++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

// ── Component Dropdown chỉnh sửa đơn vị chủ trì ──────────────────────────────
interface RoleSelectCellProps {
  value: string;
  onChange: (val: string) => void;
}

const RoleSelectCell: React.FC<RoleSelectCellProps> = ({ value, onChange }) => {
  // Tìm option khớp với giá trị truyền vào (theo value hoặc theo label)
  const matchedOpt = DEFAULT_ROLES.find(r => 
    r.value !== 'custom' && 
    (r.value.toLowerCase() === (value || '').toLowerCase() || 
     r.label.toLowerCase() === (value || '').toLowerCase())
  );

  const [selectedOpt, setSelectedOpt] = useState(matchedOpt ? matchedOpt.value : (value ? 'custom' : ''));
  const [customText, setCustomText] = useState(matchedOpt ? '' : value);

  useEffect(() => {
    const opt = DEFAULT_ROLES.find(r => 
      r.value !== 'custom' && 
      (r.value.toLowerCase() === (value || '').toLowerCase() || 
       r.label.toLowerCase() === (value || '').toLowerCase())
    );
    setSelectedOpt(opt ? opt.value : (value ? 'custom' : ''));
    setCustomText(opt ? '' : value);
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedOpt(val);
    if (val !== 'custom') {
      const opt = DEFAULT_ROLES.find(r => r.value === val);
      onChange(opt ? opt.label : val);
    } else {
      onChange(customText);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    setCustomText(txt);
    onChange(txt);
  };

  return (
    <div className="flex flex-col gap-1 w-full min-w-[150px]">
      <select
        value={selectedOpt}
        onChange={handleSelectChange}
        className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
      >
        <option value="">-- Chọn đơn vị --</option>
        {DEFAULT_ROLES.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      {selectedOpt === 'custom' && (
        <input
          type="text"
          value={customText}
          onChange={handleTextChange}
          placeholder="Nhập tên đơn vị..."
          className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      )}
    </div>
  );
};

// ── Component chỉnh sửa phân vai trò RACI độc lập ─────────────────────────────
interface RaciRoleCellProps {
  step: DraftStep;
  index: number;
  role: 'R' | 'A' | 'C' | 'I';
  onChange: (newRaci: any[]) => void;
}

const RaciRoleCell: React.FC<RaciRoleCellProps> = ({ step, index, role, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentRaci = step.raci || [];
  
  // Lọc ra các stakeholder có vai trò này
  const activeStakeholders = currentRaci.filter(r => r.raci_type === role);

  const toggleStakeholder = (code: string) => {
    const existingIndex = currentRaci.findIndex(r => r.stakeholder_code === code);
    let newRaci = [...currentRaci];
    
    if (existingIndex > -1) {
      if (currentRaci[existingIndex].raci_type === role) {
        // Đang là vai trò này -> gỡ bỏ
        newRaci.splice(existingIndex, 1);
      } else {
        // Đang là vai trò khác -> chuyển sang vai trò này
        newRaci[existingIndex] = {
          ...newRaci[existingIndex],
          raci_type: role
        };
      }
    } else {
      // Chưa có vai trò -> thêm mới vai trò này
      const st = STAKEHOLDERS.find(s => s.code === code);
      newRaci.push({
        stakeholder_code: code,
        raci_type: role,
        stakeholder_name: st?.name || null
      });
    }
    onChange(newRaci);
  };

  const style = RACI_TYPES.find(t => t.code === role)!;

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Hiển thị danh sách badge */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[28px] p-1 border border-dashed border-gray-200 dark:border-slate-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-lg flex flex-wrap gap-0.5 justify-center items-center cursor-pointer transition-colors"
      >
        {activeStakeholders.length > 0 ? (
          activeStakeholders.map(s => (
            <span 
              key={s.stakeholder_code} 
              className={`inline-flex items-center text-[8px] px-1 rounded font-semibold ${style.lightBg}`}
              title={s.stakeholder_name || s.stakeholder_code}
            >
              {s.stakeholder_code}
            </span>
          ))
        ) : (
          <span className="text-[8px] text-gray-400 dark:text-gray-600 italic">—</span>
        )}
      </div>

      {isOpen && (
        <>
          {/* Backdrop để click out */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl p-3 z-50 w-64 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-1.5 mb-1.5">
              <span className="font-bold text-[11px] text-gray-700 dark:text-slate-300">
                Phân vai trò {role} ({style.label.split(' ')[0]})
              </span>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-1">
              {STAKEHOLDERS.map(st => {
                const currentItem = currentRaci.find(r => r.stakeholder_code === st.code);
                const isSelectedForThisRole = currentItem?.raci_type === role;
                const hasOtherRole = currentItem && currentItem.raci_type !== role;

                return (
                  <label 
                    key={st.code}
                    className={`flex items-center gap-2 py-1 px-1.5 rounded cursor-pointer text-[10px] transition-colors ${
                      isSelectedForThisRole 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold' 
                        : hasOtherRole 
                          ? 'opacity-40 line-through bg-slate-50 dark:bg-slate-900/50' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelectedForThisRole}
                      onChange={() => toggleStakeholder(st.code)}
                      className="w-3 h-3 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between w-full min-w-0">
                      <span className="font-semibold">{st.code}</span>
                      <span className="text-[9px] text-gray-400 truncate w-36 text-right" title={st.name}>{st.name}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Helper xây dựng đồ thị phụ thuộc (Dependency Graph) ──────────────────────
const buildDependencyGraph = (workNodes: any[], allNodes: any[], edges: any[]): Map<string, string[]> => {
  const workNodeIds = new Set(workNodes.map(n => n.id));
  
  // Xây dựng incoming adjacency list (target -> source)
  const incoming = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!incoming.has(edge.target_node_id)) {
      incoming.set(edge.target_node_id, []);
    }
    incoming.get(edge.target_node_id)!.push(edge.source_node_id);
  });

  const predecessorsMap = new Map<string, string[]>();

  // Tìm các workNode cha trực tiếp
  workNodes.forEach(node => {
    const directParents = new Set<string>();
    const visited = new Set<string>();
    const queue = [...(incoming.get(node.id) || [])];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      if (workNodeIds.has(currentId)) {
        directParents.add(currentId);
      } else {
        const parents = incoming.get(currentId) || [];
        queue.push(...parents);
      }
    }
    predecessorsMap.set(node.id, Array.from(directParents));
  });

  return predecessorsMap;
};

// ── Helper tìm các node con xuôi dòng (descendants) ─────────────────────────
const findDescendants = (nodeId: string, predecessors: Map<string, string[]>): Set<string> => {
  const descendants = new Set<string>();
  const queue = [nodeId];
  
  // Xây dựng children adjacency list (parent -> children)
  const childrenMap = new Map<string, string[]>();
  predecessors.forEach((parents, childId) => {
    parents.forEach(pId => {
      if (!childrenMap.has(pId)) childrenMap.set(pId, []);
      childrenMap.get(pId)!.push(childId);
    });
  });

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = childrenMap.get(currentId) || [];
    children.forEach(childId => {
      if (!descendants.has(childId)) {
        descendants.add(childId);
        queue.push(childId);
      }
    });
  }
  return descendants;
};

// ── Helper tính toán lịch trình song song theo thứ tự topo ────────────────────
const computeParallelTimeline = (
  draftSteps: DraftStep[],
  predecessorsMap: Map<string, string[]>,
  projectStartDate: string
): DraftStep[] => {
  const stepsMap = new Map<string, DraftStep>();
  draftSteps.forEach(s => {
    if (s.workflow_node_id) {
      stepsMap.set(s.workflow_node_id, s);
    }
  });

  const visited = new Set<string>();
  const tempVisited = new Set<string>();
  const topoOrder: DraftStep[] = [];

  const visit = (step: DraftStep) => {
    const nodeId = step.workflow_node_id;
    if (!nodeId) {
      topoOrder.push(step);
      return;
    }
    if (visited.has(nodeId)) return;
    if (tempVisited.has(nodeId)) {
      visited.add(nodeId);
      topoOrder.push(step);
      return;
    }

    tempVisited.add(nodeId);
    const parentNodeIds = predecessorsMap.get(nodeId) || [];
    parentNodeIds.forEach(pId => {
      const parentStep = stepsMap.get(pId);
      if (parentStep) {
        visit(parentStep);
      }
    });
    tempVisited.delete(nodeId);
    visited.add(nodeId);
    topoOrder.push(step);
  };

  const manualSteps = draftSteps.filter(s => !s.workflow_node_id);
  manualSteps.forEach(s => topoOrder.push(s));

  const workflowSteps = draftSteps.filter(s => !!s.workflow_node_id);
  workflowSteps.forEach(s => visit(s));

  const computedSteps: DraftStep[] = [];
  const computedMap = new Map<string, DraftStep>();

  for (const step of topoOrder) {
    let sDate = new Date(projectStartDate);
    const nodeId = step.workflow_node_id;

    if (nodeId) {
      const parentIds = predecessorsMap.get(nodeId) || [];
      const parentDueTimes: number[] = [];

      parentIds.forEach(pId => {
        const computedParent = computedMap.get(pId);
        if (computedParent && computedParent.due_date) {
          parentDueTimes.push(new Date(computedParent.due_date).getTime());
        }
      });

      if (parentDueTimes.length > 0) {
        const maxDueTime = Math.max(...parentDueTimes);
        const maxDueDate = new Date(maxDueTime);
        maxDueDate.setDate(maxDueDate.getDate() + 1);
        sDate = maxDueDate;
      }
    }

    while (sDate.getDay() === 0 || sDate.getDay() === 6) {
      sDate.setDate(sDate.getDate() + 1);
    }

    const startStr = sDate.toISOString().split('T')[0];
    const endStr = addWorkingDays(startStr, step.duration_days);

    const updatedStep = {
      ...step,
      start_date: startStr,
      due_date: endStr,
    };

    computedSteps.push(updatedStep);
    if (nodeId) {
      computedMap.set(nodeId, updatedStep);
    }
  }

  const draftStepIds = draftSteps.map(s => s.id);
  return [...computedSteps].sort((a, b) => draftStepIds.indexOf(a.id) - draftStepIds.indexOf(b.id));
};

export const CreateMasterPlanPanel: React.FC<CreateMasterPlanPanelProps> = ({
  project,
  onClose,
  onSuccess,
  hasExistingTasks = false
}) => {
  const { closePanel } = useSlidePanel();

  // State các tham số lập kế hoạch
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [totalDuration, setTotalDuration] = useState<number>(180);
  const [cascadeEnabled, setCascadeEnabled] = useState<boolean>(true);
  const [predecessors, setPredecessors] = useState<Map<string, string[]>>(new Map());
  const [allEdges, setAllEdges] = useState<any[]>([]);
  const [activeRaciEditIndex, setActiveRaciEditIndex] = useState<number | null>(null);
  
  // Danh sách công việc dự thảo (WBS)
  const [steps, setSteps] = useState<DraftStep[]>([]);
  
  // UI States
  const [loadingWorkflows, setLoadingWorkflows] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [defaultDurationInfo, setDefaultDurationInfo] = useState<number>(0);

  // Lấy ngày hôm nay làm giá trị mặc định cho ngày bắt đầu dự án
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(project?.StartDate ? project.StartDate.split('T')[0] : today);
  }, [project]);

  // Tự động tải kế hoạch hiện tại nếu đã tồn tại để điều chỉnh trực tiếp
  useEffect(() => {
    const loadExistingPlan = async () => {
      const projectId = project?.ProjectID;
      if (!projectId) return;

      try {
        const existingSteps = await ProjectStepsService.getByProject(projectId);
        if (existingSteps && existingSteps.length > 0) {
          // 1. Chuyển đổi ProjectStep -> DraftStep
          const draftSteps = existingSteps.map(s => {
            return {
              id: s.id,
              workflow_node_id: s.workflow_node_id,
              title: s.task_name,
              phase: s.phase || 'preparation',
              assignee_role: s.assignee_role || 'manager',
              start_date: s.start_date || '',
              due_date: s.due_date || '',
              duration_days: s.duration_days || 1,
              defaultSla: s.duration_days || 1,
              sub_tasks: [],
              metadata: {
                legal_basis: s.legal_basis,
                output_document: s.output_document,
                step_code: s.step_code,
                step_order: s.step_order,
              },
              raci: s.raci || []
            } as DraftStep;
          });

          setSteps(draftSteps);

          // 2. Điền các tham số tương ứng
          const firstStep = existingSteps[0];
          if (firstStep.start_date) {
            setStartDate(firstStep.start_date);
          }
          if (firstStep.workflow_id) {
            setSelectedWorkflowId(firstStep.workflow_id);

            // 3. Tải edges và predecessors cho quy trình này để phục vụ Cascade ngày
            const { data: nodes } = await supabase
              .from('workflow_nodes')
              .select('*')
              .eq('workflow_id', firstStep.workflow_id)
              .eq('is_deleted', false);

            const { data: edges } = await supabase
              .from('workflow_edges')
              .select('*')
              .eq('workflow_id', firstStep.workflow_id)
              .eq('is_deleted', false);

            if (nodes && edges) {
              const dbEdges = edges || [];
              setAllEdges(dbEdges);
              const workNodes = nodes.filter(n => ['approval', 'input', 'automated', 'start', 'end'].includes(n.type ?? ''));
              const predecessorsMap = buildDependencyGraph(workNodes, nodes, dbEdges);
              setPredecessors(predecessorsMap);
            }
          }

          // Tính tổng thời lượng thực tế của kế hoạch cũ
          const lastStep = existingSteps[existingSteps.length - 1];
          if (firstStep.start_date && lastStep.due_date) {
            const workingDays = getWorkingDaysBetween(firstStep.start_date, lastStep.due_date);
            setTotalDuration(workingDays || 180);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải kế hoạch hiện tại:', err);
      }
    };

    loadExistingPlan();
  }, [project]);

  // Load danh sách quy trình mẫu
  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoadingWorkflows(true);
      try {
        const { data, error } = await supabase
          .from('workflows')
          .select('id, name, code, metadata')
          .eq('is_active', true)
          .eq('category', 'project')
          .order('created_at', { ascending: false });

        if (data && !error) {
          setWorkflows(data);
          
          // Tự động chọn quy trình theo số bước thiết kế của dự án
          const designSteps = project?.InvestmentScale ? parseInt(project.InvestmentScale) : 1; 
          let targetCode = 'DTC-1STEP';
          if (designSteps === 3) targetCode = 'DTC-3STEP';
          if (designSteps === 2) targetCode = 'DTC-2STEP';

          const match = data.find(w => w.code === targetCode || w.name.includes(`${designSteps} bước`));
          if (match) {
            setSelectedWorkflowId(match.id);
          } else if (data.length > 0) {
            setSelectedWorkflowId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Lỗi load quy trình:', err);
      } finally {
        setLoadingWorkflows(false);
      }
    };
    fetchWorkflows();
  }, [project]);

  // Tính tổng số ngày mặc định (SLA) khi đổi Quy trình
  useEffect(() => {
    if (!selectedWorkflowId) return;

    const fetchDefaultSla = async () => {
      try {
        const { data, error } = await supabase
          .from('workflow_nodes')
          .select('sla_formula, type')
          .eq('workflow_id', selectedWorkflowId)
          .eq('is_deleted', false);

        if (data && !error) {
          const total = data.reduce((sum, n) => {
            if (['approval', 'input', 'automated', 'start', 'end'].includes(n.type ?? '')) {
              let sla = 1;
              if (n.sla_formula) {
                const match = n.sla_formula.match(/^(\d+)d$/);
                if (match) sla = parseInt(match[1]);
              }
              return sum + sla;
            }
            return sum;
          }, 0);
          setDefaultDurationInfo(total);
        }
      } catch (err) {
        console.error('Lỗi tính SLA:', err);
      }
    };
    fetchDefaultSla();
  }, [selectedWorkflowId]);

  // Hàm sinh bảng nháp
  const handleGenerateDraft = async () => {
    if (!selectedWorkflowId) {
      setErrorMessage('Vui lòng chọn một Quy trình mẫu trước.');
      return;
    }
    if (!startDate) {
      setErrorMessage('Vui lòng chọn ngày bắt đầu.');
      return;
    }

    setErrorMessage('');
    try {
      // 1. Fetch nodes từ quy trình
      const { data: nodes, error } = await supabase
        .from('workflow_nodes')
        .select('*')
        .eq('workflow_id', selectedWorkflowId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true }); // Hoặc sắp xếp theo luồng edges

      if (error || !nodes) throw new Error('Không thể tải các bước của quy trình');

      // Fetch edges từ quy trình
      const { data: edges, error: edgesError } = await supabase
        .from('workflow_edges')
        .select('*')
        .eq('workflow_id', selectedWorkflowId)
        .eq('is_deleted', false);

      const dbEdges = edges || [];
      setAllEdges(dbEdges);

      // Lọc các nodes làm việc
      const workNodes = nodes.filter(n => ['approval', 'input', 'automated', 'start', 'end'].includes(n.type ?? ''));

      // Xây dựng predecessors
      const predecessorsMap = buildDependencyGraph(workNodes, nodes, dbEdges);
      setPredecessors(predecessorsMap);

      // Fetch RACI template cho các nodes này
      const { data: raciTemplates } = await (supabase as any)
        .from('workflow_node_raci')
        .select('*')
        .in('workflow_node_id', workNodes.map(n => n.id));

      const raciMap = new Map<string, any[]>();
      (raciTemplates || []).forEach((r: any) => {
        if (!raciMap.has(r.workflow_node_id)) {
          raciMap.set(r.workflow_node_id, []);
        }
        raciMap.get(r.workflow_node_id)!.push(r);
      });

      // Phân tích SLA gốc của từng node
      const stepsData = workNodes.map(n => {
        let sla = 1;
        if (n.sla_formula) {
          const match = n.sla_formula.match(/^(\d+)d$/);
          if (match) sla = parseInt(match[1]);
        }
        const meta = (n.metadata as any) || {};
        return {
          id: n.id,
          workflow_node_id: n.id,
          title: n.name,
          phase: meta.phase || 'preparation',
          assignee_role: n.assignee_role || meta.assignee_role || 'manager',
          duration_days: sla,
          defaultSla: sla,
          sub_tasks: meta.sub_tasks || [],
          metadata: meta,
          raci: raciMap.get(n.id) || []
        } as DraftStep;
      });

      // 2. Phân bổ ngày & tính toán timeline dựa trên chế độ
      if (mode === 'auto') {
        const initialTimeline = computeParallelTimeline(stepsData, predecessorsMap, startDate);
        let criticalPathDuration = 0;
        if (initialTimeline.length > 0) {
          const maxDueMs = Math.max(...initialTimeline.map(s => s.due_date ? new Date(s.due_date).getTime() : 0));
          criticalPathDuration = Math.max(1, getWorkingDaysBetween(startDate, new Date(maxDueMs).toISOString().split('T')[0]));
        }
        if (criticalPathDuration === 0) criticalPathDuration = 1;

        const ratio = totalDuration / criticalPathDuration;

        // Phân bổ tỷ lệ
        const scaledSteps = stepsData.map(s => {
          const scaled = Math.max(1, Math.round(s.defaultSla * ratio));
          return { ...s, duration_days: scaled };
        });

        // Áp dụng xếp lịch song song topo
        const finalSteps = computeParallelTimeline(scaledSteps, predecessorsMap, startDate);
        setSteps(finalSteps);
      } else {
        // Chế độ thủ công: Giữ nguyên SLA gốc của Quy trình và rải lịch song song
        const finalSteps = computeParallelTimeline(stepsData, predecessorsMap, startDate);
        setSteps(finalSteps);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi khởi tạo bản thảo kế hoạch');
    }
  };

  // Áp dụng xâu chuỗi (cascade) từ một điểm index thay đổi
  const cascadeFromIndex = (updatedSteps: DraftStep[], startIndex: number) => {
    if (!cascadeEnabled) {
      setSteps(updatedSteps);
      return;
    }

    const modifiedStep = updatedSteps[startIndex];
    if (!modifiedStep.workflow_node_id) {
      // Node thủ công -> chỉ giữ nguyên
      setSteps(updatedSteps);
      return;
    }

    // Tìm các node con cháu xuôi dòng của modifiedStep
    const descendants = findDescendants(modifiedStep.workflow_node_id, predecessors);
    if (descendants.size === 0) {
      setSteps(updatedSteps);
      return;
    }

    const nextSteps = [...updatedSteps];
    const stepsMap = new Map<string, DraftStep>();
    nextSteps.forEach(s => {
      if (s.workflow_node_id) {
        stepsMap.set(s.workflow_node_id, s);
      }
    });

    // Thực hiện duyệt topo chỉ tính toán ngày cho các descendants
    const visited = new Set<string>();
    const tempVisited = new Set<string>();
    const topoOrder: DraftStep[] = [];

    const visit = (step: DraftStep) => {
      const nodeId = step.workflow_node_id;
      if (!nodeId) return;
      if (visited.has(nodeId)) return;
      if (tempVisited.has(nodeId)) {
        visited.add(nodeId);
        topoOrder.push(step);
        return;
      }

      tempVisited.add(nodeId);
      const parentNodeIds = predecessors.get(nodeId) || [];
      parentNodeIds.forEach(pId => {
        const parentStep = stepsMap.get(pId);
        if (parentStep) {
          visit(parentStep);
        }
      });
      tempVisited.delete(nodeId);
      visited.add(nodeId);
      topoOrder.push(step);
    };

    nextSteps.forEach(s => visit(s));

    const computedMap = new Map<string, DraftStep>();
    // Đầu tiên đưa các step không thuộc descendants vào map (ngày được giữ nguyên)
    nextSteps.forEach(s => {
      if (s.workflow_node_id && !descendants.has(s.workflow_node_id)) {
        computedMap.set(s.workflow_node_id, s);
      }
    });

    // Tính lại ngày cho các node con cháu theo thứ tự topo
    for (const step of topoOrder) {
      const nodeId = step.workflow_node_id;
      if (!nodeId || !descendants.has(nodeId)) continue;

      let sDate = new Date(startDate);
      const parentIds = predecessors.get(nodeId) || [];
      const parentDueTimes: number[] = [];

      parentIds.forEach(pId => {
        const computedParent = computedMap.get(pId) || stepsMap.get(pId);
        if (computedParent && computedParent.due_date) {
          parentDueTimes.push(new Date(computedParent.due_date).getTime());
        }
      });

      if (parentDueTimes.length > 0) {
        const maxDueTime = Math.max(...parentDueTimes);
        const maxDueDate = new Date(maxDueTime);
        maxDueDate.setDate(maxDueDate.getDate() + 1);
        sDate = maxDueDate;
      }

      while (sDate.getDay() === 0 || sDate.getDay() === 6) {
        sDate.setDate(sDate.getDate() + 1);
      }

      const startStr = sDate.toISOString().split('T')[0];
      const endStr = addWorkingDays(startStr, step.duration_days);

      const updated = {
        ...step,
        start_date: startStr,
        due_date: endStr,
      };

      computedMap.set(nodeId, updated);
      
      const idx = nextSteps.findIndex(s => s.id === step.id);
      if (idx !== -1) {
        nextSteps[idx] = updated;
      }
    }

    setSteps(nextSteps);
  };

  // ── Chỉnh sửa ô cụ thể ──────────────────────────────────────────────────────
  const handleEditCell = (index: number, field: keyof DraftStep, val: any) => {
    const updated = [...steps];
    const target = { ...updated[index] };

    if (field === 'title') {
      target.title = val;
      updated[index] = target;
      setSteps(updated);
    } else if (field === 'phase') {
      target.phase = val;
      updated[index] = target;
      setSteps(updated);
    } else if (field === 'assignee_role') {
      target.assignee_role = val;
      updated[index] = target;
      setSteps(updated);
    } else if (field === 'duration_days') {
      const days = Math.max(1, parseInt(val) || 1);
      target.duration_days = days;
      target.due_date = addWorkingDays(target.start_date, days);
      updated[index] = target;
      cascadeFromIndex(updated, index);
    } else if (field === 'start_date') {
      target.start_date = val;
      target.due_date = addWorkingDays(val, target.duration_days);
      updated[index] = target;
      cascadeFromIndex(updated, index);
    } else if (field === 'due_date') {
      target.due_date = val;
      const calculatedDays = getWorkingDaysBetween(target.start_date, val);
      target.duration_days = Math.max(1, calculatedDays);
      updated[index] = target;
      cascadeFromIndex(updated, index);
    } else if (field === 'raci' as any) {
      target.raci = val;
      updated[index] = target;
      setSteps(updated);
    }
  };

  // Thêm bước
  const handleAddStep = (index: number) => {
    const newStep: DraftStep = {
      id: 'NEW_' + Math.random().toString(36).substring(2, 9),
      workflow_node_id: null,
      title: 'Công việc mới',
      phase: steps[index]?.phase || 'preparation',
      assignee_role: 'manager',
      start_date: steps[index]?.due_date || startDate,
      due_date: steps[index]?.due_date || startDate,
      duration_days: 5,
      defaultSla: 5,
      sub_tasks: [],
      metadata: { node_type: 'input' }
    };
    
    const updated = [...steps];
    updated.splice(index + 1, 0, newStep);
    
    // Nối lại ngày từ vị trí thêm
    cascadeFromIndex(updated, index);
  };

  // Xóa bước
  const handleDeleteStep = (index: number) => {
    const updated = [...steps];
    updated.splice(index, 1);
    
    if (updated.length > 0) {
      // Nối lại lịch từ vị trí bị xóa
      const idxToCascade = Math.max(0, index - 1);
      cascadeFromIndex(updated, idxToCascade);
    } else {
      setSteps([]);
    }
  };

  // Di chuyển vị trí bước
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;
    
    const updated = [...steps];
    const temp = updated[index];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    // Tính lại nối ngày từ điểm thay đổi trước
    const firstModifiedIdx = Math.min(index, targetIdx);
    cascadeFromIndex(updated, firstModifiedIdx);
  };

  // Xử lý Lưu kế hoạch
  const handleSave = async () => {
    if (steps.length === 0) {
      setErrorMessage('Không có bước công việc nào để lưu. Vui lòng bấm khởi tạo bảng.');
      return;
    }
    
    if (hasExistingTasks && !showConfirmOverwrite) {
      setShowConfirmOverwrite(true);
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const projectId = project?.ProjectID;
      if (!projectId) throw new Error('Không tìm thấy ID dự án');

      const targetEnd = steps[steps.length - 1]?.due_date;

      await TaskService.createTasksFromCustomPlan(
        projectId,
        selectedWorkflowId || null,
        steps,
        targetEnd
      );

      onSuccess();
      closePanel();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu kế hoạch');
    } finally {
      setSaving(false);
      setShowConfirmOverwrite(false);
    }
  };

  // Tính tổng số ngày công việc trong bảng nháp hiện tại
  const currentTotalDays = useMemo(() => {
    return steps.reduce((sum, s) => sum + s.duration_days, 0);
  }, [steps]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">
      
      {/* Cảnh báo ghi đè */}
      {showConfirmOverwrite && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmOverwrite(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-red-200 dark:border-red-900/50 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-lg font-bold">Xác nhận ghi đè kế hoạch</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
              Dự án này <strong>đã có kế hoạch tổng thể trước đó</strong>. Việc lưu kế hoạch mới sẽ xóa toàn bộ các <strong>bước quy trình</strong> hiện tại và các nhiệm vụ tháng liên kết.
              Các công việc đã tạo thủ công sẽ được giữ lại.
              Hành động này <strong>không thể khôi phục</strong>. Bạn có chắc chắn muốn ghi đè?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmOverwrite(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow"
              >
                {saving ? 'Đang lưu...' : 'Tôi đồng ý, Ghi đè'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid chính: 2 cột */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        
        {/* CỘT TRÁI: Tham số cấu hình */}
        <div className="w-[260px] bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col shrink-0 overflow-y-auto">
          
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Thông số thiết lập
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">Cấu hình các tham số để tự động hoặc tùy chỉnh kế hoạch thực hiện.</p>
          </div>

          <div className="p-4 space-y-5 flex-1">
            
            {/* Chế độ Lập kế hoạch */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Phương thức tạo</label>
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-gray-200/50 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setMode('auto')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'auto' 
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200/20 dark:border-slate-700' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Tự động
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'manual' 
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200/20 dark:border-slate-700' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Thủ công
                </button>
              </div>
            </div>

            {/* Quy trình */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                Quy trình mẫu
                {loadingWorkflows && <span className="w-2.5 h-2.5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin inline-block" />}
              </label>
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="" disabled>-- Chọn quy trình mẫu --</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              {defaultDurationInfo > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 italic mt-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  Quy trình gốc: {defaultDurationInfo} ngày làm việc.
                </div>
              )}
            </div>

            {/* Ngày bắt đầu */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Ngày bắt đầu dự án</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Tổng thời gian (chỉ hiển thị ở chế độ Tự động) */}
            {mode === 'auto' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Thời gian thực hiện</label>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{totalDuration} ngày</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="1200"
                  step="10"
                  value={totalDuration}
                  onChange={(e) => setTotalDuration(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>30 ngày</span>
                  <span>1200 ngày</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-[10px] text-gray-500 space-y-1 mt-2">
                  <span className="font-semibold text-gray-700 dark:text-slate-300 block">Phân bổ tự động:</span>
                  Tỷ lệ ngày của các bước sẽ tự động điều chỉnh theo tổng thời gian thực hiện, đảm bảo ngày bắt đầu và kết thúc khớp nối tiếp liên tục.
                </div>
              </div>
            )}

            {/* Tùy chọn Cascade ngày tự động */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <input
                type="checkbox"
                id="chk-cascade"
                checked={cascadeEnabled}
                onChange={(e) => setCascadeEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
              />
              <label htmlFor="chk-cascade" className="text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer select-none">
                Tự động căn chỉnh chuỗi ngày (Cascade)
              </label>
            </div>

            {/* Nút Khởi tạo */}
            <button
              type="button"
              onClick={handleGenerateDraft}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow hover:shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-hover-spin" />
              Khởi tạo bảng dự thảo
            </button>
            
          </div>
          
        </div>

        {/* CỘT PHẢI: Bảng dự thảo kế hoạch */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
          
          {/* Header Bảng dự thảo */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
            <div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                Bản thảo kế hoạch tổng thể
                {steps.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                    {steps.length} bước
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                {steps.length > 0 
                  ? `Thời lượng: ${currentTotalDays} ngày làm việc (không tính T7/CN). Dự kiến hoàn thành ngày: ${steps[steps.length - 1]?.due_date ? new Date(steps[steps.length - 1].due_date).toLocaleDateString('vi-VN') : '—'}`
                  : 'Chưa khởi tạo dữ liệu bản thảo. Vui lòng thiết lập tham số và bấm Khởi tạo.'
                }
              </p>
            </div>
          </div>

          {/* Lỗi */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nội dung bảng */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-6 min-h-0">
            {steps.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 dark:border-emerald-900/30">
                  <Zap className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200">Bắt đầu thiết lập kế hoạch</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
                  Chọn quy trình mẫu bên trái, nhập các thông tin ngày khởi công, sau đó bấm nút **Khởi tạo bảng dự thảo** để xem và tinh chỉnh lịch biểu dự thảo trước khi lưu.
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/30 dark:bg-slate-800">
                    <th className="py-3 px-3 w-12 text-center">TT</th>
                    <th className="py-3 px-3 w-32">Giai đoạn</th>
                    <th className="py-3 px-3 min-w-[200px]">Nội dung thực hiện</th>
                    <th className="py-3 px-2 w-28 text-center bg-blue-50/30 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-x border-gray-200/50 dark:border-slate-800">R (Thực hiện)</th>
                    <th className="py-3 px-2 w-28 text-center bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-r border-gray-200/50 dark:border-slate-800">A (Phê duyệt)</th>
                    <th className="py-3 px-2 w-28 text-center bg-amber-50/30 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-r border-gray-200/50 dark:border-slate-800">C (Tham vấn)</th>
                    <th className="py-3 px-2 w-28 text-center bg-gray-50/30 dark:bg-slate-800/40 text-gray-600 dark:text-gray-400 border-r border-gray-200/50 dark:border-slate-800">I (Thông báo)</th>
                    <th className="py-3 px-3 w-28">Bắt đầu</th>
                    <th className="py-3 px-3 w-28">Kết thúc</th>
                    <th className="py-3 px-3 w-20 text-center">SLA (Ngày)</th>
                    {mode === 'manual' && <th className="py-3 px-3 w-28 text-center">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {steps.map((step, index) => {
                    const phaseConfig = PHASES.find(p => p.value === step.phase);
                    
                    return (
                      <tr 
                        key={step.id} 
                        className="group hover:bg-slate-50/70 dark:hover:bg-slate-800 transition-colors"
                      >
                        {/* Thứ tự */}
                        <td className="py-3.5 px-3 text-center font-medium text-slate-500 dark:text-slate-400">
                          {index + 1}
                        </td>
                        
                        {/* Giai đoạn (Phase) */}
                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border border-transparent ${phaseConfig?.bg || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}`}>
                            {phaseConfig?.label || 'Chưa rõ'}
                          </span>
                        </td>
                        
                        {/* Nội dung thực hiện */}
                        <td className="py-3.5 px-3">
                          {mode === 'manual' ? (
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => handleEditCell(index, 'title', e.target.value)}
                              placeholder="Tên công việc..."
                              className="w-full text-xs font-semibold border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          ) : (
                            <div className="font-semibold text-gray-800 dark:text-slate-200">
                              {step.title}
                            </div>
                          )}
                        </td>
                        
                        {/* R */}
                        <td className="py-2 px-1.5 border-x border-gray-100 dark:border-slate-800 relative">
                          <RaciRoleCell 
                            step={step}
                            index={index}
                            role="R"
                            onChange={(newRaci) => handleEditCell(index, 'raci', newRaci)}
                          />
                        </td>

                        {/* A */}
                        <td className="py-2 px-1.5 border-r border-gray-100 dark:border-slate-800 relative">
                          <RaciRoleCell 
                            step={step}
                            index={index}
                            role="A"
                            onChange={(newRaci) => handleEditCell(index, 'raci', newRaci)}
                          />
                        </td>

                        {/* C */}
                        <td className="py-2 px-1.5 border-r border-gray-100 dark:border-slate-800 relative">
                          <RaciRoleCell 
                            step={step}
                            index={index}
                            role="C"
                            onChange={(newRaci) => handleEditCell(index, 'raci', newRaci)}
                          />
                        </td>

                        {/* I */}
                        <td className="py-2 px-1.5 border-r border-gray-100 dark:border-slate-800 relative">
                          <RaciRoleCell 
                            step={step}
                            index={index}
                            role="I"
                            onChange={(newRaci) => handleEditCell(index, 'raci', newRaci)}
                          />
                        </td>
                        
                        {/* Ngày bắt đầu */}
                        <td className="py-3.5 px-3">
                          <input
                            type="date"
                            value={step.start_date}
                            onChange={(e) => handleEditCell(index, 'start_date', e.target.value)}
                            className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                          />
                        </td>
                        
                        {/* Ngày kết thúc */}
                        <td className="py-3.5 px-3">
                          <input
                            type="date"
                            value={step.due_date}
                            onChange={(e) => handleEditCell(index, 'due_date', e.target.value)}
                            className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                          />
                        </td>
                        
                        {/* SLA (Số ngày) */}
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={step.duration_days}
                            onChange={(e) => handleEditCell(index, 'duration_days', e.target.value)}
                            className="w-16 text-center text-xs border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </td>
                        
                        {/* Hành động (chỉ ở chế độ thủ công) */}
                        {mode === 'manual' && (
                          <td className="py-3.5 px-3">
                            <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleMoveStep(index, 'up')}
                                disabled={index === 0}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 rounded disabled:opacity-30 cursor-pointer"
                                title="Di chuyển lên"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveStep(index, 'down')}
                                disabled={index === steps.length - 1}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 rounded disabled:opacity-30 cursor-pointer"
                                title="Di chuyển xuống"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddStep(index)}
                                className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded cursor-pointer"
                                title="Thêm công việc phía sau"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStep(index)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded cursor-pointer"
                                title="Xóa công việc"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          
        </div>

      </div>

      {/* Footer chứa nút Lưu / Hủy */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center shrink-0">
        <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          Nhấn lưu sẽ ghi đè các bước kế hoạch cũ. Công việc thủ công được giữ lại.
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || steps.length === 0}
            className={`px-5 py-2 text-xs font-bold rounded-xl text-white flex items-center gap-1.5 cursor-pointer shadow hover:shadow-md transition-all ${
              saving || steps.length === 0
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Lưu kế hoạch
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
