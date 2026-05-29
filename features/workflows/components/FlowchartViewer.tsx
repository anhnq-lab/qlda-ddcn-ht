import React, { useMemo, useCallback } from 'react';
import { 
  Network, CheckCircle2, CircleDashed, Clock, ChevronRight,
  Shield, FileInput, Zap, XCircle
} from 'lucide-react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { parseSla } from '../utils/workflowUtils';
import RaciBadges from './RaciBadges';

// ─── INTERFACES ─────────────────────────────────────────────────────────
interface ActivityNode {
    id: string;
    name: string;
    type: 'start' | 'end' | 'approval' | 'input' | 'automated';
    assignee_role?: string;
    sla_formula?: string;
    raci?: any;
}

interface FlowEdge {
    source: string;
    target: string;
    condition?: string;
}

interface FlowchartViewerProps {
    workflowName: string;
    nodes: ActivityNode[];
    edges: FlowEdge[];
    activeNodeId?: string;
    completedNodeIds?: string[];
    rejectedNodeIds?: string[];
    onNodeClick?: (node: ActivityNode) => void;
}

// ─── CUSTOM NODE COMPONENT ─────────────────────────────────────────────
const CustomFlowNode = ({ data }: { data: Record<string, any> }) => {
    const isTerminal = data.rawType === 'start' || data.rawType === 'end';
    
    return (
        <div 
            onClick={data.onClick}
            className={`
                ${data.shape} ${data.bg} ${data.glow}
                border-2 ${data.border}
                flex flex-col items-center justify-center text-center relative
                transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5
                ${!isTerminal && data.onClick ? 'cursor-pointer' : ''}
                ${!isTerminal ? 'p-4 min-h-[80px]' : ''}
            `}
        >
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-transparent !border-none" />
            
            {isTerminal ? (
                <div className="flex items-center justify-center flex-col gap-1">
                    {data.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {data.rawType === 'start' ? 'BẮT ĐẦU' : 'KẾT THÚC'}
                    </span>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2 mb-1">
                        {data.icon}
                        {data.rawType === 'approval' && (
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Phê duyệt</span>
                        )}
                    </div>
                    <div className="font-bold text-sm leading-tight" title={data.name}>
                        {data.name}
                    </div>
                    {data.raci ? (
                        <div className="mt-2 w-full flex justify-center">
                            <RaciBadges summary={data.raci} compact className="justify-center" />
                        </div>
                    ) : data.assignee_role ? (
                        <div className="text-[10px] font-semibold opacity-60 mt-1.5 px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                            {data.assignee_role}
                        </div>
                    ) : null}
                </>
            )}

            {/* SLA Badge */}
            {data.slaText && !isTerminal && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold rounded-full border border-blue-200 dark:border-blue-800 whitespace-nowrap shadow-md z-10">
                    <Clock size={10} className="inline mr-0.5 -mt-[1px]" /> {data.slaText}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-transparent !border-none" />
        </div>
    );
};

// CRITICAL: nodeTypes must be defined OUTSIDE the component to prevent ReactFlow warnings & re-renders
const nodeTypes = { custom: CustomFlowNode };

// ─── DAGRE AUTO-LAYOUT ─────────────────────────────────────────────────
function computeDagreLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 90, edgesep: 30 });

    nodes.forEach((node) => {
        const isTerminal = (node.data as any).rawType === 'start' || (node.data as any).rawType === 'end';
        g.setNode(node.id, { width: isTerminal ? 80 : 224, height: isTerminal ? 80 : 120 });
    });

    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
        const pos = g.node(node.id);
        const isTerminal = (node.data as any).rawType === 'start' || (node.data as any).rawType === 'end';
        const w = isTerminal ? 80 : 224;
        const h = isTerminal ? 80 : 120;
        return {
            ...node,
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: { x: pos.x - w / 2, y: pos.y - h / 2 },
        };
    });

    return { nodes: layoutedNodes, edges };
}


function getNodeVisualConfig(
    node: ActivityNode,
    activeNodeId?: string,
    completedNodeIds: string[] = [],
    rejectedNodeIds: string[] = []
) {
    const isCompleted = completedNodeIds.includes(node.id);
    const isActive = activeNodeId === node.id;
    const isRejected = rejectedNodeIds.includes(node.id);

    const iconMap: Record<string, React.ReactNode> = {
        start: <ChevronRight size={24} />,
        end: <CheckCircle2 size={24} />,
        approval: <Shield size={20} />,
        input: <FileInput size={20} />,
        automated: <Zap size={20} />,
    };
    const typeIcon = iconMap[node.type] || <CircleDashed size={20} />;

    const shape = (node.type === 'start' || node.type === 'end')
        ? 'rounded-full w-20 h-20'
        : 'rounded-xl w-56';

    if (node.type === 'start') return { icon: typeIcon, shape, bg: 'bg-emerald-500 text-white', border: 'border-emerald-600', glow: 'shadow-sm shadow-emerald-500/30' };
    if (node.type === 'end') return { icon: typeIcon, shape, bg: isCompleted ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400', border: 'border-slate-400 dark:border-slate-600', glow: '' };
    if (isRejected) return { icon: <XCircle size={20} />, shape, bg: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400', border: 'border-red-400 dark:border-red-700', glow: 'shadow-red-500/20' };
    if (isCompleted) return { icon: <CheckCircle2 size={20} />, shape, bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-emerald-400 dark:border-emerald-700', glow: 'shadow-emerald-500/10' };
    if (isActive) return { icon: <Clock size={20} className="animate-spin-slow" />, shape, bg: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400', border: 'border-warning-400 dark:border-warning-600 ring-4 ring-warning-400/30', glow: 'shadow-warning-500/40 shadow-sm scale-105' };

    return { icon: <CircleDashed size={20} />, shape, bg: 'bg-bg-surface text-slate-600 dark:bg-slate-800 dark:text-slate-300', border: 'border-border', glow: '' };
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────
const FlowchartViewer: React.FC<FlowchartViewerProps> = ({
    workflowName,
    nodes: inputNodes,
    edges: inputEdges,
    activeNodeId,
    completedNodeIds = [],
    rejectedNodeIds = [],
    onNodeClick
}) => {
    // ✅ Pure computation - NO useState, NO useEffect → NO render loops
    const { layoutedNodes, layoutedEdges } = useMemo(() => {
        if (!inputNodes || inputNodes.length === 0) {
            return { layoutedNodes: [] as Node[], layoutedEdges: [] as Edge[] };
        }

        // Build ReactFlow nodes
        const rfNodes: Node[] = inputNodes.map(n => {
            const config = getNodeVisualConfig(n, activeNodeId, completedNodeIds, rejectedNodeIds);
            return {
                id: n.id,
                type: 'custom',
                position: { x: 0, y: 0 }, // dagre will override
                data: {
                    ...config,
                    name: n.name,
                    rawType: n.type,
                    slaText: parseSla(n.sla_formula),
                    assignee_role: n.assignee_role,
                    raci: n.raci,
                    // onClick is safe here because it doesn't affect layout
                    onClick: onNodeClick ? () => onNodeClick(n) : undefined,
                },
            };
        });

        // Build ReactFlow edges
        const rfEdges: Edge[] = (inputEdges || []).map((e, idx) => {
            const hasCondition = !!(e.condition && e.condition.length > 0);

            return {
                id: `edge-${idx}-${e.source}-${e.target}`,
                source: e.source,
                target: e.target,
                label: e.condition || undefined,
                type: hasCondition ? 'smoothstep' : 'default',
                animated: !hasCondition,
                style: {
                    stroke: hasCondition ? '#ef4444' : '#94a3b8',
                    strokeWidth: 2,
                    strokeDasharray: hasCondition ? '5 5' : 'none',
                },
                labelStyle: {
                    fill: hasCondition ? '#ef4444' : '#64748b',
                    fontWeight: 600,
                    fontSize: 11,
                    fontFamily: 'Inter, sans-serif',
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, rx: 4 },
                labelBgPadding: [8, 4] as [number, number],
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: hasCondition ? '#ef4444' : '#94a3b8',
                },
            };
        });

        // Compute dagre layout
        const result = computeDagreLayout(rfNodes, rfEdges);
        return { layoutedNodes: result.nodes, layoutedEdges: result.edges };
    }, [inputNodes, inputEdges, activeNodeId, completedNodeIds, rejectedNodeIds, onNodeClick]);

    // fitView only on init – no recurring calls
    const handleInit = useCallback((instance: ReactFlowInstance) => {
        setTimeout(() => instance.fitView({ padding: 0.2 }), 50);
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#FAFAF8] dark:bg-slate-800 rounded-2xl border border-border overflow-hidden relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 px-5 py-3 bg-white/80 dark:bg-slate-800 backdrop-blur-md border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Network size={18} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="font-bold text-txt-primary text-sm tracking-wide">
                        {workflowName}
                    </h3>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đã duyệt
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-warning-500 animate-pulse ring-2 ring-warning-300" /> Đang chờ
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Từ chối
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 dark:border-slate-600" /> Chưa tới
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 w-full h-full pt-14">
                <ReactFlow
                    nodes={layoutedNodes}
                    edges={layoutedEdges}
                    nodeTypes={nodeTypes}
                    onInit={handleInit}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    minZoom={0.3}
                    maxZoom={2}
                    className="bg-bg-subtle"
                >
                    <Background color="#cbd5e1" gap={16} size={1.5} />
                    <Controls className="!mb-6 !mr-6 shadow-sm border-none" showInteractive={false} />
                    <MiniMap 
                        nodeStrokeColor="#94a3b8"
                        nodeColor="#e2e8f0"
                        maskColor="rgba(0,0,0,0.08)"
                        className="!bottom-2 !right-2 !bg-white/90 dark:!bg-slate-50 rounded-lg shadow-lg border border-border"
                        pannable
                        zoomable
                    />
                </ReactFlow>
            </div>
        </div>
    );
};

export default FlowchartViewer;
