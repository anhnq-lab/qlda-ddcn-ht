import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DataTable, EmptyState } from '../../../../components/ui';
import { Column } from '../../../../components/ui/DataTable';
import { DashboardService, DashboardProjectRow } from '../../../../services/DashboardService';
import { formatCurrency, formatShortCurrency } from '../../../../utils/format';
import { supabase } from '../../../../lib/supabase';
import { useSlidePanel } from '../../../../context/SlidePanelContext';
import { TableSkeleton } from '../../../../components/ui';

const ProjectDetail = React.lazy(() => import('../../../projects/ProjectDetail'));

export interface CapitalSlideTableProps {
    boardName: string;
    year: number;
}

const CapitalSlideTable: React.FC<CapitalSlideTableProps> = ({ boardName, year }) => {
    const { openPanel } = useSlidePanel();
    
    const { data: projectRows, isLoading } = useQuery({
        queryKey: ['dashboard', 'projectSummary'],
        queryFn: DashboardService.getProjectSummary,
        staleTime: 5 * 60 * 1000,
    });

    const { data: capitalData, isLoading: capitalLoading } = useQuery({
        queryKey: ['dashboard', 'capitalSlide', year],
        queryFn: async () => {
            const [plansRes, disbursedRes] = await Promise.all([
                supabase.from('capital_plans').select('project_id, amount, disbursed_amount').eq('year', year),
                supabase.from('disbursements').select('project_id, amount').gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
            ]);
            
            const plannedByProject: Record<string, number> = {};
            const disbursedByProject: Record<string, number> = {};

            // Tính tổng kế hoạch vốn
            plansRes.data?.forEach(p => {
                plannedByProject[p.project_id] = (plannedByProject[p.project_id] || 0) + (Number(p.amount) || 0);
            });
            
            // Tính tổng giải ngân từ disbursements (chính xác nhất)
            disbursedRes.data?.forEach(d => {
                disbursedByProject[d.project_id] = (disbursedByProject[d.project_id] || 0) + (Number(d.amount) || 0);
            });

            // Nếu dự án không có trong bảng disbursements, lấy fallback từ bảng capital_plans.disbursed_amount
            plansRes.data?.forEach(p => {
                if (!disbursedByProject[p.project_id] && p.disbursed_amount) {
                    disbursedByProject[p.project_id] = Number(p.disbursed_amount);
                }
            });
            
            return { plannedByProject, disbursedByProject };
        },
        staleTime: 5 * 60 * 1000,
    });

    const filteredProjects = useMemo(() => {
        if (!projectRows || !capitalData) return [];
        
        return projectRows
            .filter(p => p.boardLabel === boardName)
            .map(p => {
                const planned = capitalData.plannedByProject[p.projectId] || 0;
                const disbursed = capitalData.disbursedByProject[p.projectId] || 0;
                return { ...p, planned, disbursed };
            })
            // Chỉ hiển thị các dự án có Kế hoạch vốn hoặc Đã giải ngân trong năm
            .filter(p => p.planned > 0 || p.disbursed > 0)
            // Sắp xếp theo kế hoạch vốn giảm dần
            .sort((a, b) => b.planned - a.planned);
    }, [projectRows, boardName, capitalData]);

    const columns: Column<any>[] = [
        {
            key: 'projectName',
            header: 'Tên dự án',
            width: '35%',
            render: (value) => (
                <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2" title={value}>{value}</p>
            )
        },
        {
            key: 'totalInvestment',
            header: 'Tổng mức ĐT',
            width: '20%',
            align: 'right',
            render: (value) => <span className="text-slate-700 dark:text-slate-300 font-medium">{formatShortCurrency(value)}</span>
        },
        {
            key: 'planned',
            header: 'Kế hoạch vốn',
            width: '20%',
            align: 'right',
            render: (value) => <span className="text-blue-600 dark:text-blue-400 font-bold">{formatShortCurrency(value)}</span>
        },
        {
            key: 'disbursed',
            header: 'Đã giải ngân',
            width: '25%',
            align: 'right',
            render: (value, row: any) => {
                const rate = row.planned > 0 ? ((value / row.planned) * 100).toFixed(1) : 0;
                return (
                    <div className="flex flex-col items-end">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatShortCurrency(value)}</span>
                        {row.planned > 0 && <span className="text-[10px] text-slate-500">({rate}%)</span>}
                    </div>
                );
            }
        }
    ];

    if (isLoading || capitalLoading) {
        return (
            <div className="p-4 h-full flex flex-col justify-center items-center bg-slate-50/50 dark:bg-slate-">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 h-full flex flex-col bg-slate-50/50 dark:bg-slate-">
            <DataTable
                data={filteredProjects}
                columns={columns}
                keyExtractor={(row) => row.projectId}
                emptyMessage={`Không có dữ liệu dự án cho: ${boardName}`}
                onRowClick={(row) => {
                    openPanel({
                        title: `Chi tiết: ${row.projectName}`,
                        component: (
                            <React.Suspense fallback={<TableSkeleton columns={4} rows={10} />}>
                                <ProjectDetail projectId={row.projectId} inPanel={true} initialTab="capital" />
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

export default CapitalSlideTable;
