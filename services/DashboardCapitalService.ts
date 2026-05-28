import { supabase } from '../lib/supabase';
import { ProjectStatus, MANAGEMENT_BOARDS } from '../types';

export interface DashboardProjectRow {
    projectId: string;
    projectName: string;
    managementBoard: number;
    boardLabel: string;
    status: number;
    statusLabel: string;
    currentStatusCode?: number;
    progress: number;
    totalInvestment: number;
    paymentProgress: number;
    startDate: string | null;
    expectedEndDate: string | null;
    locationCode?: string;
    coordinates?: { lat: number; lng: number };
    investorName?: string;
    mainContractorName?: string;
    specialtyType?: string;
}

export const DashboardCapitalService = {
    /** Project summary table — all projects with KPIs */
    getProjectSummary: async (): Promise<DashboardProjectRow[]> => {
        const { data: projects } = await supabase
            .from('projects')
            .select('project_id, project_name, management_board, status, current_status_code, progress, total_investment, payment_progress, start_date, expected_end_date, location_code, coordinates, investor_name, main_contractor_name, specialty_type')
            .order('management_board', { ascending: true });

        const statusLabels: Record<number, string> = {
            [ProjectStatus.Preparation]: 'Chuẩn bị ĐT',
            [ProjectStatus.Execution]: 'Thực hiện',
            [ProjectStatus.Completion]: 'Kết thúc XD',
        };

        return (projects || []).map(p => {
            const board = MANAGEMENT_BOARDS.find(b => b.value === p.management_board);
            return {
                projectId: p.project_id,
                projectName: p.project_name,
                managementBoard: p.management_board,
                boardLabel: board?.label || `Ban ${p.management_board}`,
                status: p.status,
                statusLabel: statusLabels[p.status as number] || 'Không rõ',
                currentStatusCode: p.current_status_code ?? undefined,
                progress: Number(p.progress) || 0,
                totalInvestment: Number(p.total_investment) || 0,
                paymentProgress: Number(p.payment_progress) || 0,
                startDate: p.start_date,
                expectedEndDate: p.expected_end_date,
                locationCode: p.location_code,
                coordinates: p.coordinates as any,
                investorName: p.investor_name,
                mainContractorName: p.main_contractor_name,
                specialtyType: p.specialty_type || '',
            } as DashboardProjectRow;
        });
    },

    /** Capital vs Disbursement — planned vs actual by board for a given year */
    getCapitalVsDisbursement: async (year?: number): Promise<{
        name: string;
        planned: number;
        actual: number;
        rate: number;
        color: string;
    }[]> => {
        const targetYear = year || new Date().getFullYear();

        const [plansRes, disbursedRes, projectsRes] = await Promise.all([
            supabase.from('capital_plans').select('project_id, amount, disbursed_amount').eq('year', targetYear),
            supabase.from('disbursements').select('project_id, amount')
                .gte('date', `${targetYear}-01-01`)
                .lte('date', `${targetYear}-12-31`),
            supabase.from('projects').select('project_id, management_board'),
        ]);

        return MANAGEMENT_BOARDS.map(board => {
            const boardProjectIds = (projectsRes.data || [])
                .filter(p => p.management_board === board.value)
                .map(p => p.project_id);

            const boardPlans = (plansRes.data || []).filter(p => boardProjectIds.includes(p.project_id));
            const boardDisbs = (disbursedRes.data || []).filter(d => boardProjectIds.includes(d.project_id));

            const planned = boardPlans.reduce((s, p) => s + Number(p.amount), 0);

            let actual = 0;
            boardProjectIds.forEach(pid => {
                const projectDisbs = boardDisbs.filter(d => d.project_id === pid);
                if (projectDisbs.length > 0) {
                    actual += projectDisbs.reduce((s, d) => s + Number(d.amount), 0);
                } else {
                    const projectPlans = boardPlans.filter(p => p.project_id === pid);
                    actual += projectPlans.reduce((s, p) => s + Number(p.disbursed_amount || 0), 0);
                }
            });

            return {
                name: board.label,
                planned: Math.round(planned / 1e9 * 10) / 10,
                actual: Math.round(actual / 1e9 * 10) / 10,
                rate: planned > 0 ? Math.round((actual / planned) * 100) : 0,
                color: board.hex,
            };
        });
    },

    /** Yearly capital plans vs disbursements comparison */
    getYearlyCapitalVsDisbursement: async (): Promise<{
        year: number;
        planned: number;
        actual: number;
        rate: number;
    }[]> => {
        const [plansRes, disbursedRes, projectsRes] = await Promise.all([
            supabase.from('capital_plans').select('project_id, year, amount, disbursed_amount'),
            supabase.from('disbursements').select('project_id, amount, date'),
            supabase.from('projects').select('project_id'),
        ]);

        const plans = plansRes.data || [];
        const disbs = disbursedRes.data || [];
        const projects = projectsRes.data || [];
        const projectIds = projects.map(p => p.project_id);

        const yearlyPlans: Record<number, number> = {};
        plans.forEach(p => {
            const y = Number(p.year);
            if (!isNaN(y)) {
                yearlyPlans[y] = (yearlyPlans[y] || 0) + Number(p.amount);
            }
        });

        const allYearsSet = new Set<number>([2024, 2025, 2026]);
        plans.forEach(p => {
            const y = Number(p.year);
            if (!isNaN(y)) allYearsSet.add(y);
        });
        disbs.forEach(d => {
            if (d.date) {
                const y = new Date(d.date).getFullYear();
                if (!isNaN(y)) allYearsSet.add(y);
            }
        });

        const allYears = Array.from(allYearsSet).sort((a, b) => a - b);
        const currentYear = new Date().getFullYear();
        const filteredYears = allYears.filter(y => y >= 2020 && y <= currentYear + 1);

        return filteredYears.map(year => {
            const planned = yearlyPlans[year] || 0;

            let actual = 0;
            const yearStart = `${year}-01-01`;
            const yearEnd = `${year}-12-31`;

            const yearDisbs = disbs.filter(d => d.date && d.date >= yearStart && d.date <= yearEnd);
            const yearPlans = plans.filter(p => Number(p.year) === year);

            projectIds.forEach(pid => {
                const projDisbs = yearDisbs.filter(d => d.project_id === pid);
                if (projDisbs.length > 0) {
                    actual += projDisbs.reduce((s, d) => s + Number(d.amount), 0);
                } else {
                    const projPlans = yearPlans.filter(p => p.project_id === pid);
                    actual += projPlans.reduce((s, p) => s + Number(p.disbursed_amount || 0), 0);
                }
            });

            const plannedBill = Math.round(planned / 1e9 * 10) / 10;
            const actualBill = Math.round(actual / 1e9 * 10) / 10;

            const rate = plannedBill > 0 ? Math.round((actualBill / plannedBill) * 100) : 0;

            return {
                year,
                planned: plannedBill,
                actual: actualBill,
                rate
            };
        });
    }
};
