/**
 * HRSummary — Widget HCTH: Tổng hợp nhân sự & văn bản
 * Phòng Hành chính - Tổng hợp
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, FileText, ArrowRight } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { EmptyState } from '../../../../components/ui';

const STALE_5M = 5 * 60 * 1000;

export const HRSummary: React.FC = () => {
    const navigate = useNavigate();

    // Employee stats
    const { data: empStats } = useQuery({
        queryKey: ['dashboard-hr-stats'],
        queryFn: async () => {
            const { data } = await supabase
                .from('employees')
                .select('employee_id, department, status, position, role');
            const all = data || [];
            const active = all.filter(e => e.status === 1);

            // Group by department
            const deptMap = new Map<string, number>();
            active.forEach(e => {
                const dept = e.department || 'Chưa phân phòng';
                deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
            });

            return {
                total: all.length,
                active: active.length,
                inactive: all.filter(e => e.status === 0).length,
                departments: Array.from(deptMap.entries())
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count),
            };
        },
        staleTime: STALE_5M,
    });

    // Recent documents/văn bản
    const { data: recentDocs = [] } = useQuery({
        queryKey: ['dashboard-recent-docs'],
        queryFn: async () => {
            const { data } = await supabase
                .from('documents')
                .select('document_id, title, document_type, status, created_at')
                .order('created_at', { ascending: false })
                .limit(5);
            return data || [];
        },
        staleTime: STALE_5M,
    });

    return (
        <div className="space-y-4">
            {/* Employee Overview */}
            <div className="section-card">
                <div className="section-card-header">
                    <div className="flex items-center gap-2">
                        <div className="section-icon"><Users className="w-3.5 h-3.5" /></div>
                        <span>Nhân sự toàn cơ quan</span>
                    </div>
                    <button onClick={() => navigate('/personnel')} className="text-xs font-bold text-primary-600 dark:text-primary-500 flex items-center gap-1">
                        Quản lý <ArrowRight className="w-3 h-3" />
                    </button>
                </div>

                {empStats && (
                    <>
                        {/* Quick stats */}
                        <div className="grid grid-cols-3 gap-2 px-4 pb-3">
                            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <p className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">{empStats.total}</p>
                                <p className="text-[9px] font-bold text-blue-600/70 dark:text-blue-500/70">Tổng</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{empStats.active}</p>
                                <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500/70">Đang làm</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-slate-700">
                                <p className="text-lg font-black text-gray-600 dark:text-slate-300 tabular-nums">{empStats.inactive}</p>
                                <p className="text-[9px] font-bold text-gray-500 dark:text-slate-400">Nghỉ việc</p>
                            </div>
                        </div>

                        {/* Department breakdown */}
                        <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[200px] overflow-y-auto">
                            {empStats.departments.map(dept => (
                                <div key={dept.name} className="px-4 py-2 flex items-center justify-between">
                                    <span className="text-xs text-gray-700 dark:text-slate-200 truncate flex-1">{dept.name}</span>
                                    <span className="text-xs font-black text-gray-500 dark:text-slate-400 tabular-nums ml-2">{dept.count}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Recent Docs */}
            <div className="section-card">
                <div className="section-card-header">
                    <div className="flex items-center gap-2">
                        <div className="section-icon"><FileText className="w-3.5 h-3.5" /></div>
                        <span>Văn bản mới nhất</span>
                    </div>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[200px] overflow-y-auto">
                    {recentDocs.length === 0 ? (
                        <EmptyState icon={<FileText className="w-10 h-10" />} title="Chưa có văn bản" className="py-6" />
                    ) : recentDocs.map((doc: any) => (
                        <div key={doc.document_id} className="p-3 hover:bg-bg-app dark:hover:bg-slate-700 cursor-pointer transition-colors">
                            <p className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{doc.title}</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">
                                {new Date(doc.created_at).toLocaleDateString('vi-VN')} · {doc.document_type || 'Khác'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HRSummary;
