/**
 * ContractSummary — Widget KHĐT: Tổng hợp hợp đồng
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, ArrowRight, TrendingUp } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { formatShortCurrency } from '../../../../utils/format';
import { EmptyState } from '../../../../components/ui';

const STALE_5M = 5 * 60 * 1000;

export const ContractSummary: React.FC = () => {
    const navigate = useNavigate();

    const { data: contracts = [] } = useQuery({
        queryKey: ['dashboard-contracts-summary'],
        queryFn: async () => {
            const { data } = await supabase
                .from('contracts')
                .select('contract_id, contract_number, contractor_name, contract_value, contract_type, status, sign_date, project_id')
                .order('sign_date', { ascending: false })
                .limit(8);
            return data || [];
        },
        staleTime: STALE_5M,
    });

    const stats = {
        total: contracts.length,
        totalValue: contracts.reduce((s, c: any) => s + Number(c.contract_value || 0), 0),
        active: contracts.filter((c: any) => c.status === 'Active' || c.status === 'Signed').length,
    };

    return (
        <div className="section-card">
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><FileText className="w-3.5 h-3.5" /></div>
                    <span>Hợp đồng mới nhất</span>
                </div>
                <button onClick={() => navigate('/contracts')} className="text-xs font-bold text-primary-600 dark:text-primary-500 flex items-center gap-1">
                    Xem tất cả <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {/* Value badge */}
            <div className="px-4 pb-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                    <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-primary-600/70 dark:text-primary-500/70">Tổng giá trị HĐ</p>
                        <p className="text-sm font-black text-primary-700 dark:text-primary-400 tabular-nums">{formatShortCurrency(stats.totalValue)}</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">{stats.active} đang thực hiện</span>
                </div>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[250px] overflow-y-auto">
                {contracts.length === 0 ? (
                    <EmptyState icon={<FileText className="w-10 h-10" />} title="Chưa có hợp đồng" className="py-6" />
                ) : contracts.map((c: any) => (
                    <div key={c.contract_id} onClick={() => navigate(`/contracts`)} className="p-3 hover:bg-bg-app dark:hover:bg-slate-700 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-txt-secondary truncate">{c.contract_number || 'Chưa có số'}</p>
                                <p className="text-[10px] text-txt-placeholder mt-0.5 truncate">{c.contractor_name}</p>
                            </div>
                            <span className="text-[10px] font-bold text-txt-muted shrink-0 tabular-nums">
                                {formatShortCurrency(c.contract_value || 0)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContractSummary;
