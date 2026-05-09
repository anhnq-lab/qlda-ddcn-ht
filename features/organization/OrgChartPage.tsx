import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const kt = employees.find(e => e.Position === 'Kế toán trưởng');

    const funcDepts = ['Phòng Hành chính – Tổng hợp', 'Phòng Kế hoạch – Đấu thầu', 'Phòng Kỹ thuật – Thẩm định'];
    const unitDepts = ['Phòng Quản lý dự án 1', 'Phòng Quản lý dự án 2', 'Phòng Quản lý dự án 3', 'Phòng Phát triển dịch vụ'];

    const CX = 600; // center x

    // Level 0: UBND
    nodes.push({ id: 'ubnd', type: 'root', position: { x: CX - 120, y: 0 }, data: { label: 'UBND tỉnh Hà Tĩnh', type: 'root' } });

    // Level 1: Giám đốc
    nodes.push({ id: 'gd', type: 'director', position: { x: CX - 110, y: 130 }, data: { label: 'Giám đốc Ban', subtitle: gd?.FullName, type: 'director' } });
    edges.push({ id: 'ubnd-gd', source: 'ubnd', target: 'gd', type: 'smoothstep', style: { stroke: '#dc2626', strokeWidth: 2 }, animated: false });

    // Level 2: Deputies
    const level2Total = pgds.length + (kt ? 1 : 0);
    const level2StartX = CX - (level2Total * 190) / 2;

        pgds.forEach((pgd, i) => {
            const id = `pgd-${i}`;
            nodes.push({ id, type: 'deputy', position: { x: level2StartX + i * 190, y: 270 }, data: { label: 'Phó Giám đốc', subtitle: pgd.FullName, type: 'deputy' } });
            edges.push({ id: `gd-${id}`, source: 'gd', target: id, type: 'smoothstep', style: { stroke: '#4a90e2', strokeWidth: 1.5 } });
        });

    if (kt) {
        const ktId = 'kt';
        nodes.push({ id: ktId, type: 'deputy', position: { x: level2StartX + pgds.length * 190, y: 270 }, data: { label: 'Kế toán trưởng', subtitle: kt.FullName, type: 'deputy' } });
        edges.push({ id: `gd-kt`, source: 'gd', target: ktId, type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 1.5 } });
    }

    // Level 3: Functional departments (5)
    const funcGap = 165;
    const funcStartX = CX - (funcDepts.length * funcGap) / 2;
    funcDepts.forEach((dept, i) => {
        const cfg = DEPT_CONFIG[dept];
        const id = `dept-func-${i}`;
        nodes.push({
            id, type: 'dept',
            position: { x: funcStartX + i * funcGap, y: 430 },
            data: { label: dept, count: deptGroups[dept]?.length ?? 0, type: 'dept', color: cfg?.color ?? '#64748b' }
        });
        edges.push({ id: `gd-${id}`, source: 'gd', target: id, type: 'smoothstep', style: { stroke: cfg?.color ?? '#64748b', strokeWidth: 1.5, opacity: 0.7 } });
    });

    // Level 4: Units (8)
    const unitGap = 155;
    const unitStartX = CX - (unitDepts.length * unitGap) / 2 + 20;
    unitDepts.forEach((dept, i) => {
        const cfg = DEPT_CONFIG[dept];
        const id = `dept-unit-${i}`;
        nodes.push({
            id, type: 'dept',
            position: { x: unitStartX + i * unitGap, y: 590 },
            data: { label: dept, count: deptGroups[dept]?.length ?? 0, type: 'unit', color: cfg?.color ?? '#64748b' }
        });
        edges.push({ id: `gd-${id}`, source: 'gd', target: id, type: 'smoothstep', style: { stroke: cfg?.color ?? '#64748b', strokeWidth: 1.5, opacity: 0.6 } });
    });

    return { nodes, edges };
}

// ══════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════

const DEPARTMENTS = [
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
                        <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !rounded-xl !shadow-md" />
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
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Chú giải</p>
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
                            const members = deptGroups[dept] || [];
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
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{emp.Position}</p>
                                                </div>
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" />
                                            </div>
                                        ))}
                                        {members.length > 6 && (
                                            <div className="px-5 py-2.5 text-center">
                                                <button
                                                    onClick={() => navigate('/employees')}
                                                    className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline cursor-pointer"
                                                >
                                                    +{members.length - 6} người khác →
                                                </button>
                                            </div>
                                        )}
                                        {members.length === 0 && (
                                            <div className="px-5 py-5 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                                                Chưa có nhân sự
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer note */}
                    <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 italic">
                        * Theo Quyết định của UBND tỉnh Hà Tĩnh về thành lập Ban QLDA ĐTXD công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh
                    </p>
                </div>
            )}
        </div>
    );
};

export default OrgChartPage;
