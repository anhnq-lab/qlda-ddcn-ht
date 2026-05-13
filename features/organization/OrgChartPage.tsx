import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    type Node,
    type Edge,
    type Connection,
    Handle,
    Position,
    NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEmployees } from '../../hooks/useEmployees';
import {
    Network, Users, Building2, ChevronRight,
    Landmark, Crown, UserCheck, Award,
} from 'lucide-react';

// ══════════════════════════════════════════════════
// Types & Constants
// ══════════════════════════════════════════════════

type NodeData = {
    label: string;
    subtitle?: string;
    type: 'root' | 'director' | 'deputy' | 'dept' | 'unit';
    count?: number;
    color?: string;
    gradient?: string;
};

const DEPT_CONFIG: Record<string, { gradient: string; color: string; icon: string }> = {
    'Ban Giám đốc':                 { gradient: 'from-red-500 to-red-700',     color: '#dc2626', icon: '🏛' },
    'Phòng Hành chính – Tổng hợp':  { gradient: 'from-blue-500 to-blue-700',    color: '#3b82f6', icon: '🏛' },
    'Phòng Kế hoạch – Đấu thầu':    { gradient: 'from-emerald-500 to-emerald-700', color: '#10b981', icon: '📊' },
    'Phòng Kỹ thuật – Thẩm định':   { gradient: 'from-purple-500 to-purple-700', color: '#a855f7', icon: '🔧' },
    'Phòng Quản lý dự án 1':         { gradient: 'from-sky-500 to-sky-700',     color: '#0ea5e9', icon: '🏗' },
    'Phòng Quản lý dự án 2':         { gradient: 'from-teal-500 to-teal-700',   color: '#14b8a6', icon: '🏗' },
    'Phòng Quản lý dự án 3':         { gradient: 'from-indigo-500 to-indigo-700', color: '#6366f1', icon: '🏗' },
    'Phòng Phát triển dịch vụ':     { gradient: 'from-amber-500 to-amber-700', color: '#f59e0b', icon: '🎯' },
};

// ══════════════════════════════════════════════════
// Custom Node Components
// ══════════════════════════════════════════════════

const RootNode: React.FC<NodeProps> = ({ data }) => (
    <div className="relative">
        <Handle type="source" position={Position.Bottom} className="!bg-red-400" />
        <div className="bg-gradient-to-br from-red-700 to-red-800 text-white px-8 py-3 rounded-2xl shadow-xl border-2 border-red-400/30 ring-4 ring-red-700/20 min-w-[240px] text-center">
            <div className="flex items-center justify-center gap-2">
                <Landmark className="w-4 h-4 opacity-80" />
                <span className="font-black text-xs uppercase tracking-wide">{(data as NodeData).label}</span>
            </div>
            {(data as NodeData).subtitle && (
                <p className="text-[10px] opacity-60 mt-0.5">{(data as NodeData).subtitle}</p>
            )}
        </div>
    </div>
);

const DirectorNode: React.FC<NodeProps> = ({ data }) => (
    <div className="relative">
        <Handle type="target" position={Position.Top} className="!bg-primary-400" />
        <Handle type="source" position={Position.Bottom} className="!bg-primary-400" />
        <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white px-8 py-4 rounded-2xl shadow-xl border-2 border-primary-400/40 ring-4 ring-primary-500/20 min-w-[220px] text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
            <div className="flex items-center justify-center gap-2 mb-1">
                <Crown className="w-4 h-4 opacity-90" />
                <span className="font-black text-sm uppercase tracking-tight">{(data as NodeData).label}</span>
            </div>
            {(data as NodeData).subtitle && (
                <p className="text-[11px] opacity-75 font-medium">{(data as NodeData).subtitle}</p>
            )}
        </div>
    </div>
);

const DeputyNode: React.FC<NodeProps> = ({ data }) => (
    <div className="relative">
        <Handle type="target" position={Position.Top} className="!bg-primary-400" />
        <Handle type="source" position={Position.Bottom} className="!bg-primary-400" />
        <div className="bg-white dark:bg-slate-800 border-2 border-primary-200 dark:border-primary-700 px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all min-w-[160px] text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Award className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-[11px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-tight">{(data as NodeData).label}</span>
            </div>
            {(data as NodeData).subtitle && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{(data as NodeData).subtitle}</p>
            )}
        </div>
    </div>
);

const DeptNode: React.FC<NodeProps> = ({ data }) => {
    const d = data as NodeData;
    return (
        <div className="relative">
            <Handle type="target" position={Position.Top} className="!bg-slate-400" />
            <div
                className="text-white px-4 py-3 rounded-xl shadow-lg border border-white/20 min-w-[130px] max-w-[150px] text-center transition-transform hover:scale-105 cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${d.color}dd, ${d.color})` }}
            >
                <p className="text-[10px] font-black uppercase leading-tight tracking-tight">{d.label}</p>
                {d.count !== undefined && (
                    <div className="mt-1.5 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                        <Users className="w-2.5 h-2.5" />
                        <span className="text-[9px] font-bold">{d.count}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const nodeTypes = {
    root: RootNode,
    director: DirectorNode,
    deputy: DeputyNode,
    dept: DeptNode,
};

// ══════════════════════════════════════════════════
// Layout builder
// ══════════════════════════════════════════════════

function buildFlowElements(
    employees: ReturnType<typeof useEmployees>['data'] extends undefined ? never[] : NonNullable<ReturnType<typeof useEmployees>['data']>,
    deptGroups: Record<string, typeof employees>
): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const gd = employees.find(e => e.Position === 'Giám đốc Ban');
    const pgds = employees.filter(e => e.Position === 'Phó Giám đốc Ban');


    // --- PGD Selection by Name ---
    const pgdBao  = pgds.find(p => p.FullName.includes('Bảo'))  || pgds[0];
    const pgdNhan = pgds.find(p => p.FullName.includes('Nhân')) || pgds[1];
    const pgdQuy  = pgds.find(p => p.FullName.includes('Quy'))  || pgds[2];

    const edgeType = 'step';
    const edgeStyle = (color: string) => ({ stroke: color, strokeWidth: 1.5 });

    // Centers of Bottom Row Departments (Spacing = 190 for clean clearance)
    const X_PTDV = 0;
    const X_DA1  = 190;
    const X_DA2  = 380;
    const X_HCTH = 570;
    const X_KHDT = 760;
    const X_DA3  = 950;
    const X_KTTD = 1140;

    // Centers of Leaders
    const X_PGD_L = (X_PTDV + X_DA1) / 2; // 95
    const X_PGD_M = (X_DA2 + X_HCTH) / 2; // 475
    const X_PGD_R = (X_DA3 + X_KTTD) / 2; // 1045

    const X_GD   = X_HCTH; // 570 (Centered over HCTH for straight drop)
    const X_UBND = X_HCTH; // 570

    const Y_UBND = 0;
    const Y_GD = 110;
    const Y_LEADER = 240;
    const Y_DEPT = 380;

    const OFF_DIR = 110;
    const OFF_DEP = 80;
    const OFF_DEPT = 75;

    // Level 0: UBND
    nodes.push({ id: 'ubnd', type: 'root', position: { x: X_UBND - 120, y: Y_UBND }, data: { label: 'UBND tỉnh Hà Tĩnh', type: 'root' } });

    // Level 1: Giám đốc
    nodes.push({ id: 'gd', type: 'director', position: { x: X_GD - OFF_DIR, y: Y_GD }, data: { label: 'Giám đốc Ban', subtitle: gd?.FullName, type: 'director' } });
    edges.push({ id: 'ubnd-gd', source: 'ubnd', target: 'gd', type: edgeType, style: { stroke: '#dc2626', strokeWidth: 2 }, animated: false });

    // Level 2: Leaders (1=Bảo, 2=Nhân, 3=Quy)
    nodes.push({ id: 'pgd-left',  type: 'deputy', position: { x: X_PGD_L - OFF_DEP, y: Y_LEADER }, data: { label: 'Phó Giám đốc', subtitle: pgdBao?.FullName  || 'Đang cập nhật', type: 'deputy' } });
    nodes.push({ id: 'pgd-mid',   type: 'deputy', position: { x: X_PGD_M - OFF_DEP, y: Y_LEADER }, data: { label: 'Phó Giám đốc', subtitle: pgdNhan?.FullName || 'Đang cập nhật', type: 'deputy' } });
    nodes.push({ id: 'pgd-right', type: 'deputy', position: { x: X_PGD_R - OFF_DEP, y: Y_LEADER }, data: { label: 'Phó Giám đốc', subtitle: pgdQuy?.FullName  || 'Đang cập nhật', type: 'deputy' } });

    edges.push({ id: `gd-pgd-left`, source: 'gd', target: 'pgd-left', type: edgeType, style: edgeStyle('#4a90e2') });
    edges.push({ id: `gd-pgd-mid`, source: 'gd', target: 'pgd-mid', type: edgeType, style: edgeStyle('#4a90e2') });
    edges.push({ id: `gd-pgd-right`, source: 'gd', target: 'pgd-right', type: edgeType, style: edgeStyle('#4a90e2') });

    // Level 3: Departments
    const createDept = (id: string, name: string, x: number) => {
        const cfg = DEPT_CONFIG[name];
        nodes.push({ 
            id, 
            type: 'dept', 
            position: { x: x - OFF_DEPT, y: Y_DEPT }, 
            data: { 
                label: name, 
                count: deptGroups[name]?.length ?? 0, 
                type: 'dept', 
                color: cfg?.color ?? '#64748b' 
            } 
        });
        return cfg?.color ?? '#64748b';
    };

    const cPtdv = createDept('dept-ptdv', 'Phòng Phát triển dịch vụ', X_PTDV);
    const cDa1 = createDept('dept-da1', 'Phòng Quản lý dự án 1', X_DA1);
    const cDa2 = createDept('dept-da2', 'Phòng Quản lý dự án 2', X_DA2);
    const cHcth = createDept('dept-hc', 'Phòng Hành chính – Tổng hợp', X_HCTH);
    const cKhdt = createDept('dept-khdt', 'Phòng Kế hoạch – Đấu thầu', X_KHDT);
    const cDa3 = createDept('dept-da3', 'Phòng Quản lý dự án 3', X_DA3);
    const cKttd = createDept('dept-kttd', 'Phòng Kỹ thuật – Thẩm định', X_KTTD);

    // Edges from GD to Depts
    edges.push({ id: `gd-dept-hc`, source: 'gd', target: 'dept-hc', type: edgeType, style: edgeStyle(cHcth) });
    edges.push({ id: `gd-dept-khdt`, source: 'gd', target: 'dept-khdt', type: edgeType, style: edgeStyle(cKhdt) });

    // Edges from Leaders to Depts
    edges.push({ id: `pgd-left-dept-ptdv`, source: 'pgd-left', target: 'dept-ptdv', type: edgeType, style: edgeStyle(cPtdv) });
    edges.push({ id: `pgd-left-dept-da1`, source: 'pgd-left', target: 'dept-da1', type: edgeType, style: edgeStyle(cDa1) });

    edges.push({ id: `pgd-mid-dept-da2`, source: 'pgd-mid', target: 'dept-da2', type: edgeType, style: edgeStyle(cDa2) });
    edges.push({ id: `pgd-mid-dept-hc`, source: 'pgd-mid', target: 'dept-hc', type: edgeType, style: edgeStyle(cHcth) });

    edges.push({ id: `pgd-right-dept-da3`, source: 'pgd-right', target: 'dept-da3', type: edgeType, style: edgeStyle(cDa3) });
    edges.push({ id: `pgd-right-dept-kttd`, source: 'pgd-right', target: 'dept-kttd', type: edgeType, style: edgeStyle(cKttd) });

    return { nodes, edges };
}


// ══════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════

const DEPARTMENTS = [
    'Ban Giám đốc',
    'Phòng Hành chính – Tổng hợp',
    'Phòng Kế hoạch – Đấu thầu',
    'Phòng Kỹ thuật – Thẩm định',
    'Phòng Quản lý dự án 1',
    'Phòng Quản lý dự án 2',
    'Phòng Quản lý dự án 3',
    'Phòng Phát triển dịch vụ',
];

const OrgChartPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: employees = [] } = useEmployees();
    const [activeTab, setActiveTab] = useState<'flow' | 'grid'>('flow');
    const [, setSearchParams] = useSearchParams();

    const deptGroups = useMemo(() => {
        const g: Record<string, typeof employees> = {};
        employees.forEach(emp => {
            if (!g[emp.Department]) g[emp.Department] = [];
            g[emp.Department].push(emp);
        });
        return g;
    }, [employees]);

    const { nodes: initialNodes, edges: initialEdges } = useMemo(
        () => buildFlowElements(employees, deptGroups),
        [employees, deptGroups]
    );

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge(params, eds)), [setEdges]);

    const leadership = useMemo(() => ({
        gd: employees.find(e => e.Position === 'Giám đốc Ban'),
        pgds: employees.filter(e => e.Position === 'Phó Giám đốc Ban'),
        kt: employees.find(e => e.Position === 'Kế toán trưởng'),
    }), [employees]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
                        <Network className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Sơ đồ tổ chức</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Ban QLDA ĐTXD công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh
                        </p>
                    </div>
                </div>

                {/* Stats badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { label: 'Giám đốc', val: 1, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700' },
                        { label: 'Phó Giám đốc', val: leadership.pgds.length, color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-700' },
                        { label: 'Phòng/Đơn vị', val: 7, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700' },
                        { label: 'Tổng nhân sự', val: employees.length, color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
                    ].map(s => (
                        <div key={s.label} className={`border rounded-xl px-4 py-2 text-center ${s.color}`}>
                            <p className="text-xl font-black leading-none">{s.val}</p>
                            <p className="text-[9px] font-bold uppercase mt-0.5 tracking-wide">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tab switcher ── */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                {(['flow', 'grid'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                            activeTab === tab
                                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        {tab === 'flow' ? '🔗 Sơ đồ cây' : '👥 Nhân sự theo phòng'}
                    </button>
                ))}
            </div>

            {/* ── Tab: Flow ── */}
            {activeTab === 'flow' && (
                <div className="bg-[#f8f6f1] dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden" style={{ height: 680 }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.15 }}
                        minZoom={0.3}
                        maxZoom={2}
                        attributionPosition="bottom-left"
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={20}
                            size={1}
                            color="#d1c9b8"
                        />
                        <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !rounded-xl !shadow-md [&_button]:dark:!bg-slate-800 [&_button]:dark:!border-slate-700 [&_path]:dark:!fill-slate-300 [&_button:hover]:dark:!bg-slate-700" />
                        <MiniMap
                            className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !rounded-xl"
                            nodeColor={n => {
                                const d = n.data as NodeData;
                                if (d.type === 'root') return '#dc2626';
                                if (d.type === 'director') return '#7c3aed';
                                if (d.type === 'deputy') return '#4a90e2';
                                return (d.color as string) ?? '#64748b';
                            }}
                            maskColor="rgba(241,237,230,0.5)"
                        />
                    </ReactFlow>

                    {/* Legend */}
                    <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-none">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Chú giải</p>
                        {[
                            { color: 'bg-red-600', label: 'UBND tỉnh Hà Tĩnh' },
                            { color: 'bg-primary-600', label: 'Giám đốc Ban' },
                            { color: 'bg-primary-400', label: 'Lãnh đạo' },
                            { color: 'bg-blue-500', label: 'Phòng chức năng' },
                            { color: 'bg-teal-500', label: 'Phòng QLDA / Dịch vụ' },
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-2 mb-1">
                                <div className={`w-3 h-3 rounded-full ${l.color}`} />
                                <span className="text-[10px] text-slate-600 dark:text-slate-300">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Tab: Grid ── */}
            {activeTab === 'grid' && (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {DEPARTMENTS.map(dept => {
                            let members = deptGroups[dept] || [];
                            
                            if (dept === 'Ban Giám đốc') {
                                // Lọc bỏ Quản trị viên
                                members = members.filter(m => !m.Position.toLowerCase().includes('quản trị') && !m.FullName.toLowerCase().includes('quản trị'));
                                
                                // Sắp xếp theo thứ tự yêu cầu
                                const bgdOrder = ['Nguyễn Quang Linh', 'Trần Ngọc Bảo', 'Nguyễn Văn Nhân', 'Ngô Đức Quy'];
                                members.sort((a, b) => {
                                    const indexA = bgdOrder.indexOf(a.FullName);
                                    const indexB = bgdOrder.indexOf(b.FullName);
                                    // Nếu không có trong danh sách, đẩy xuống cuối
                                    const valA = indexA === -1 ? 999 : indexA;
                                    const valB = indexB === -1 ? 999 : indexB;
                                    return valA - valB;
                                });
                            }

                            const cfg = DEPT_CONFIG[dept];
                            const leader = members.find(m =>
                                m.Position.includes('Trưởng') || m.Position.includes('Chánh') || m.Position.includes('Giám đốc')
                            );

                            return (
                                <div key={dept} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-200 group">
                                    {/* Header */}
                                    <div
                                        className="px-5 py-4 text-white relative overflow-hidden"
                                        style={{ background: `linear-gradient(135deg, ${cfg?.color ?? '#64748b'}cc, ${cfg?.color ?? '#64748b'})` }}
                                    >
                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_-20%,white,transparent_60%)]" />
                                        <div className="flex items-start justify-between relative">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-sm leading-tight">{dept}</h3>
                                                {leader && (
                                                    <p className="text-[10px] opacity-75 mt-0.5 flex items-center gap-1">
                                                        <UserCheck className="w-3 h-3" />
                                                        {leader.FullName}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="bg-white/25 px-2.5 py-1 rounded-lg ml-3">
                                                <span className="text-sm font-black">{members.length}</span>
                                                <span className="text-[9px] opacity-75 ml-0.5">người</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Members */}
                                    <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                        {members.slice(0, 6).map(emp => (
                                            <div
                                                key={emp.EmployeeID}
                                                onClick={() => navigate(`/employees/${emp.EmployeeID}`)}
                                                className="px-5 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors group/row"
                                            >
                                                <img
                                                    src={emp.AvatarUrl}
                                                    alt={emp.FullName}
                                                    className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-700 shadow-sm object-cover flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate group-hover/row:text-primary-600 dark:group-hover/row:text-primary-400 transition-colors">
                                                        {emp.FullName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">{emp.Position}</p>
                                                </div>
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" />
                                            </div>
                                        ))}
                                        {members.length > 6 && (
                                            <div className="px-5 py-2.5 text-center">
                                                <button
                                                    onClick={() => setSearchParams({ tab: 'list' })}
                                                    className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline cursor-pointer"
                                                >
                                                    +{members.length - 6} người khác →
                                                </button>
                                            </div>
                                        )}
                                        {members.length === 0 && (
                                            <div className="px-5 py-5 text-center text-xs text-slate-400 dark:text-slate-400 italic">
                                                Chưa có nhân sự
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer note */}
                    <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-400 italic">
                        * Theo Quyết định của UBND tỉnh Hà Tĩnh về thành lập Ban QLDA ĐTXD công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh
                    </p>
                </div>
            )}
        </div>
    );
};

export default OrgChartPage;
