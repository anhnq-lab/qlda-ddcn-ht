import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSlidePanel } from '../../../../context/SlidePanelContext';
import { TableSkeleton } from '../../../../components/ui';

const ProjectDetail = React.lazy(() => import('../../../projects/ProjectDetail'));
import { DataTable, StatusBadge, EmptyState } from '../../../../components/ui';
import { Column } from '../../../../components/ui/DataTable';
import { ProjectStatus, PROJECT_PHASE_COLORS, MANAGEMENT_BOARDS } from '../../../../types';
import { formatShortCurrency } from '../../../../utils/format';

export interface ProjectSlideTableProps {
    projects: any[]; // ProjectSummary[]
    filterStatus?: ProjectStatus;
    filterBoardValue?: string; // Tên ban hoặc value ban
    filterCurrentStatusCode?: number; // Trạng thái chi tiết 1-10
}

const ProjectSlideTable: React.FC<ProjectSlideTableProps> = ({ projects, filterStatus, filterBoardValue, filterCurrentStatusCode }) => {
    const navigate = useNavigate();
    const { openPanel } = useSlidePanel();

    const filteredProjects = useMemo(() => {
        let list = [...projects];
        if (filterStatus !== undefined) {
            list = list.filter(p => p.status === filterStatus);
        }
        if (filterCurrentStatusCode !== undefined) {
            list = list.filter(p => p.currentStatusCode === filterCurrentStatusCode);
        }
        if (filterBoardValue !== undefined) {
            // Compare string or integer
            list = list.filter(p => p.managementBoard?.toString() === filterBoardValue?.toString() || MANAGEMENT_BOARDS.find(b => b.value.toString() === p.managementBoard?.toString())?.label === filterBoardValue);
        }
        return list;
    }, [projects, filterStatus, filterBoardValue, filterCurrentStatusCode]);

    const columns: Column<any>[] = [
        {
            key: 'projectName',
            header: 'Tên dự án',
            width: '40%',
            render: (value, row) => (
                <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2" title={value}>{value}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{row.projectId}</p>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Trạng thái',
            width: '20%',
            render: (value) => {
                const phase = PROJECT_PHASE_COLORS[value as ProjectStatus];
                if (!phase) return '—';
                return (
                    <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: `${phase.hex}15`, color: phase.hex, border: `1px solid ${phase.hex}30` }}
                    >
                        {phase.label}
                    </span>
                );
            }
        },
        {
            key: 'totalInvestment',
            header: 'Tổng mức ĐT',
            width: '20%',
            align: 'right',
            render: (value) => (
                <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatShortCurrency(value)}
                </span>
            )
        },
        {
            key: 'managementBoard',
            header: 'Phòng ban',
            width: '20%',
            render: (value) => {
                const board = MANAGEMENT_BOARDS.find(b => b.value.toString() === value?.toString());
                return <span className="text-xs text-slate-600 dark:text-slate-400">{board?.label || '—'}</span>;
            }
        }
    ];

    return (
        <div className="p-4 h-full flex flex-col bg-slate-50/50 dark:bg-slate-">
            <DataTable
                data={filteredProjects}
                columns={columns}
                keyExtractor={(row) => row.projectId}
                emptyMessage="Không có dự án nào thỏa mãn bộ lọc"
                onRowClick={(row) => {
                    openPanel({
                        title: `Chi tiết: ${row.projectName}`,
                        component: (
                            <React.Suspense fallback={<TableSkeleton columns={4} rows={10} />}>
                                <ProjectDetail projectId={row.projectId} inPanel={true} />
                            </React.Suspense>
                        ),
                        width: '80vw'
                    });
                }}
                compact
                className="flex-1"
                wrapperClassName="h-full flex flex-col"
                maxHeight="calc(100vh - 120px)"
            />
        </div>
    );
};

export default ProjectSlideTable;
