import React, { useState, useEffect } from 'react';
import { 
    Map, 
    FileText, 
    Home, 
    Users, 
    CreditCard, 
    CheckCircle2, 
    Circle, 
    Clock, 
    AlertCircle,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Pencil,
    Save,
    X,
    Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatNumber } from '@/utils/format';
import { SiteClearance, SiteClearanceMilestone, UpdateSiteClearanceDTO, UpdateClearanceMilestoneDTO } from '@/types';
import { 
    useSiteClearance, 
    useInitializeClearance, 
    useUpdateSiteClearance, 
    useSiteClearanceMilestones, 
    useUpdateClearanceMilestone 
} from '../../hooks/useSiteClearance';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProjectClearanceTabProps {
    projectId: string;
}

export const ProjectClearanceTab: React.FC<ProjectClearanceTabProps> = ({ projectId }) => {
    const { user } = useAuth();
    
    // Robust permission check
    const userRole = (user?.Role || (user as any)?.role || '').toLowerCase();
    const canEdit = ['admin', 'manager', 'director', 'deputy_director', 'super_admin'].includes(userRole);

    const { data: clearance, isLoading: isClearanceLoading } = useSiteClearance(projectId);
    const { data: milestones, isLoading: isMilestonesLoading } = useSiteClearanceMilestones(projectId);
    const initializeClearance = useInitializeClearance();

    const [isEditingGlobal, setIsEditingGlobal] = useState(false);

    if (isClearanceLoading || isMilestonesLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!clearance && !initializeClearance.isPending) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate- rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Map className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Chưa có thông tin Giải phóng mặt bằng</h3>
                <p className="text-slate-500 text-center max-w-md mb-6">
                    Dự án này chưa được khởi tạo dữ liệu quản lý GPMB (16 bước theo hướng dẫn 3254).
                </p>
                {canEdit && (
                    <button 
                        onClick={() => initializeClearance.mutate(projectId)}
                        disabled={initializeClearance.isPending}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                        {initializeClearance.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Khởi tạo Quy trình GPMB
                    </button>
                )}
            </div>
        );
    }

    if (initializeClearance.isPending) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-slate-500">Đang khởi tạo quy trình 16 bước...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Map className="w-5 h-5 text-emerald-500" />
                        Quản lý Giải phóng mặt bằng
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Theo dõi tiến độ thu hồi đất và 16 bước thủ tục GPMB</p>
                </div>
                {canEdit && (
                    <button 
                        onClick={() => setIsEditingGlobal(!isEditingGlobal)}
                        className="px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    >
                        {isEditingGlobal ? (
                            <>Hủy sửa</>
                        ) : (
                            <><Pencil className="w-4 h-4" /> Cập nhật số liệu</>
                        )}
                    </button>
                )}
            </div>

            {/* Dashboard Cards */}
            {isEditingGlobal ? (
                <ClearanceGlobalEditor clearance={clearance!} projectId={projectId} onClose={() => setIsEditingGlobal(false)} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardCard 
                        title="Tiến độ Thu hồi đất" 
                        value={`${clearance?.cleared_area || 0} / ${clearance?.total_area || 0}`}
                        unit="ha"
                        icon={<Map className="w-5 h-5 text-blue-500" />}
                        progress={clearance?.total_area ? ((clearance.cleared_area || 0) / clearance.total_area) * 100 : 0}
                        colorClass="bg-blue-500"
                    />
                    <DashboardCard 
                        title="Hộ dân Tái định cư" 
                        value={`${clearance?.resettled_households || 0} / ${clearance?.total_households || 0}`}
                        unit="hộ"
                        icon={<Home className="w-5 h-5 text-warning-500" />}
                        progress={clearance?.total_households ? ((clearance.resettled_households || 0) / clearance.total_households) * 100 : 0}
                        colorClass="bg-warning-500"
                    />
                    <DashboardCard 
                        title="Giải ngân GPMB" 
                        value={formatNumber(clearance?.disbursed_compensation || 0)}
                        subValue={`/ ${formatNumber(clearance?.compensation_budget || 0)}`}
                        unit="VNĐ"
                        icon={<CreditCard className="w-5 h-5 text-emerald-500" />}
                        progress={clearance?.compensation_budget ? ((clearance.disbursed_compensation || 0) / clearance.compensation_budget) * 100 : 0}
                        colorClass="bg-emerald-500"
                    />
                    <DashboardCard 
                        title="Trạng thái" 
                        value={clearance?.status || 'Chưa bắt đầu'}
                        unit=""
                        icon={<AlertCircle className="w-5 h-5 text-purple-500" />}
                        colorClass="bg-purple-500"
                    />
                </div>
            )}

            {/* 16 Steps Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm mt-6">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        Quy trình thực hiện 16 bước
                    </h3>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                            <tr>
                                <th className="px-3 py-3 w-16 text-center text-slate-500 dark:text-slate-400">Bước</th>
                                <th className="px-4 py-3 text-left min-w-[300px] text-slate-500 dark:text-slate-400">Nội dung công việc</th>
                                <th className="px-4 py-3 text-center w-32 text-slate-500 dark:text-slate-400">Trạng thái</th>
                                <th className="px-4 py-3 text-center w-32 text-slate-500 dark:text-slate-400">Ngày HT</th>
                                {canEdit && <th className="px-4 py-3 text-center w-24 text-slate-500 dark:text-slate-400">Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {milestones?.map((milestone) => (
                                <MilestoneRow 
                                    key={milestone.id} 
                                    milestone={milestone} 
                                    canEdit={canEdit}
                                    projectId={projectId}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Subcomponents ---

const DashboardCard = ({ title, value, subValue, unit, icon, progress, colorClass }: any) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 dark:bg-slate- rounded-lg">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h4>
                    {subValue && <span className="text-sm font-medium text-slate-500">{subValue}</span>}
                    {unit && <span className="text-xs text-slate-500 ml-1">{unit}</span>}
                </div>
                {progress !== undefined && (
                    <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}></div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ClearanceGlobalEditor = ({ clearance, projectId, onClose }: { clearance: SiteClearance, projectId: string, onClose: () => void }) => {
    const updateClearance = useUpdateSiteClearance(projectId);
    const [formData, setFormData] = useState({
        total_area: clearance.total_area || 0,
        cleared_area: clearance.cleared_area || 0,
        total_households: clearance.total_households || 0,
        resettled_households: clearance.resettled_households || 0,
        compensation_budget: clearance.compensation_budget || 0,
        disbursed_compensation: clearance.disbursed_compensation || 0,
        status: clearance.status || 'Chưa bắt đầu'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateClearance.mutateAsync(formData);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate- rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-inner">
            <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">Cập nhật số liệu tổng quan GPMB</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tổng diện tích (ha)</label>
                    <input type="number" step="0.01" value={formData.total_area} onChange={e => setFormData({...formData, total_area: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-700" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Diện tích đã GPMB (ha)</label>
                    <input type="number" step="0.01" value={formData.cleared_area} onChange={e => setFormData({...formData, cleared_area: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-700" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Trạng thái chung</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-700">
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang thực hiện">Đang thực hiện</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tổng số hộ dân</label>
                    <input type="number" value={formData.total_households} onChange={e => setFormData({...formData, total_households: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-700" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Số hộ đã TĐC/Bồi thường</label>
                    <input type="number" value={formData.resettled_households} onChange={e => setFormData({...formData, resettled_households: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-700" />
                </div>
                <div className="hidden lg:block"></div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tổng kinh phí GPMB (VNĐ)</label>
                    <input type="number" value={formData.compensation_budget} onChange={e => setFormData({...formData, compensation_budget: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-700" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Đã giải ngân (VNĐ)</label>
                    <input type="number" value={formData.disbursed_compensation} onChange={e => setFormData({...formData, disbursed_compensation: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-700" />
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border rounded-lg bg-white hover:bg-slate-50">Hủy</button>
                <button type="submit" disabled={updateClearance.isPending} className="px-4 py-2 text-sm font-medium border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                    {updateClearance.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu số liệu
                </button>
            </div>
        </form>
    );
};

const MilestoneRow = ({ milestone, canEdit, projectId }: { milestone: SiteClearanceMilestone, canEdit: boolean, projectId: string }) => {
    const [isEditing, setIsEditing] = useState(false);
    const updateMilestone = useUpdateClearanceMilestone(projectId);
    const [formData, setFormData] = useState({
        status: milestone.status,
        completed_date: milestone.completed_date || '',
        notes: milestone.notes || ''
    });

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
            case 'blocked': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />;
        }
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'completed': return 'Hoàn thành';
            case 'in_progress': return 'Đang thực hiện';
            case 'blocked': return 'Vướng mắc';
            default: return 'Chưa bắt đầu';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateMilestone.mutateAsync({
            milestoneId: milestone.id,
            updates: {
                status: formData.status as any,
                completed_date: formData.completed_date || null,
                notes: formData.notes
            }
        });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                <td className="px-3 py-3.5 text-center font-mono text-xs text-slate-500">{milestone.step_number}</td>
                <td colSpan={canEdit ? 4 : 3} className="px-4 py-3.5">
                    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-center w-full">
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{milestone.step_name}</p>
                            <input 
                                type="text" 
                                value={formData.notes} 
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Nhập ghi chú..."
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                value={formData.status} 
                                onChange={e => setFormData({...formData, status: e.target.value as any})}
                                className="text-xs px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="pending">Chưa bắt đầu</option>
                                <option value="in_progress">Đang thực hiện</option>
                                <option value="completed">Hoàn thành</option>
                                <option value="blocked">Vướng mắc</option>
                            </select>
                            <input 
                                type="date" 
                                value={formData.completed_date} 
                                onChange={e => setFormData({...formData, completed_date: e.target.value})}
                                className="text-xs px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-36" 
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-xs font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                                    Hủy
                                </button>
                                <button type="submit" disabled={updateMilestone.isPending} className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium shadow-sm">
                                    {updateMilestone.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    Lưu
                                </button>
                            </div>
                        </div>
                    </form>
                </td>
            </tr>
        );
    }

    return (
        <tr className="group cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-">
            {/* Bước */}
            <td className="px-3 py-3.5 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">B.{milestone.step_number}</span>
            </td>
            {/* Nội dung */}
            <td className="px-4 py-3.5">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                        {getStatusIcon(milestone.status)}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm group-hover:text-blue-600 transition-colors">{milestone.step_name}</p>
                        {milestone.notes && (
                            <p className="text-xs text-slate-500 mt-1 truncate max-w-[400px]">
                                <span className="font-medium mr-1 text-slate-600 dark:text-slate-400">Ghi chú:</span>{milestone.notes}
                            </p>
                        )}
                    </div>
                </div>
            </td>
            {/* Trạng thái */}
            <td className="px-4 py-3.5 text-center">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap ${
                    milestone.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' :
                    milestone.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20' :
                    milestone.status === 'blocked' ? 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20' :
                    'bg-slate- text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/20'
                }`}>
                    {getStatusText(milestone.status)}
                </span>
            </td>
            {/* Ngày HT */}
            <td className="px-4 py-3.5 text-center">
                {milestone.completed_date ? (
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        {new Date(milestone.completed_date).toLocaleDateString('vi-VN')}
                    </span>
                ) : (
                    <span className="text-xs text-slate-400 italic">-</span>
                )}
            </td>
            {/* Thao tác */}
            {canEdit && (
                <td className="px-4 py-3.5 text-center">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        title="Cập nhật"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                </td>
            )}
        </tr>
    );
}
