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
    const { currentUser: user } = useAuth();
    
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
            <div className="flex flex-col items-center justify-center h-64 bg-bg-muted rounded-2xl border border-dashed border-border">
                <Map className="w-12 h-12 text-txt-muted mb-4" />
                <h3 className="text-lg font-medium text-txt-primary mb-2">Chưa có thông tin Giải phóng mặt bằng</h3>
                <p className="text-txt-muted text-center max-w-md mb-6 text-sm">
                    Dự án này chưa được khởi tạo dữ liệu quản lý GPMB (16 bước theo hướng dẫn 3254).
                </p>
                {canEdit && (
                    <button 
                        onClick={() => initializeClearance.mutate(projectId)}
                        disabled={initializeClearance.isPending}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
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
                    <h2 className="text-lg font-bold text-txt-primary flex items-center gap-2">
                        <Map className="w-5 h-5 text-emerald-500" />
                        Quản lý Giải phóng mặt bằng
                    </h2>
                    <p className="text-xs text-txt-muted mt-1">Theo dõi tiến độ thu hồi đất và 16 bước thủ tục GPMB</p>
                </div>
                {canEdit && (
                    <button 
                        onClick={() => setIsEditingGlobal(!isEditingGlobal)}
                        className="px-3 py-1.5 text-xs font-bold border rounded-xl transition-colors flex items-center gap-2 bg-bg-surface hover:bg-bg-muted border-border text-txt-primary"
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
            <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden shadow-sm mt-6">
                <div className="px-5 py-4 border-b border-border bg-bg-muted/30">
                    <h3 className="font-semibold text-txt-primary flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-txt-muted" />
                        Quy trình thực hiện 16 bước
                    </h3>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10 bg-bg-muted text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm">
                            <tr>
                                <th className="px-3 py-3 w-16 text-center text-txt-muted">Bước</th>
                                <th className="px-4 py-3 text-left min-w-[300px] text-txt-muted">Nội dung công việc</th>
                                <th className="px-4 py-3 text-center w-32 text-txt-muted">Trạng thái</th>
                                <th className="px-4 py-3 text-center w-32 text-txt-muted">Ngày HT</th>
                                {canEdit && <th className="px-4 py-3 text-center w-24 text-txt-muted">Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
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
        <div className="bg-bg-surface rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-bg-muted rounded-xl">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl font-black text-txt-primary">{value}</h4>
                    {subValue && <span className="text-sm font-bold text-txt-secondary">{subValue}</span>}
                    {unit && <span className="text-xs text-txt-muted ml-1">{unit}</span>}
                </div>
                {progress !== undefined && (
                    <div className="mt-3 h-1.5 w-full bg-bg-muted rounded-full overflow-hidden">
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

    const inputCls = "w-full px-3 py-2 border border-border rounded-xl text-sm bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all";
    const labelCls = "block text-xs font-bold text-txt-muted uppercase tracking-wider mb-1";

    return (
        <form onSubmit={handleSubmit} className="bg-bg-muted rounded-2xl border border-border p-5 shadow-inner">
            <h3 className="text-sm font-black mb-4 text-txt-primary">Cập nhật số liệu tổng quan GPMB</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div>
                    <label className={labelCls}>Tổng diện tích (ha)</label>
                    <input type="number" step="0.01" value={formData.total_area} onChange={e => setFormData({...formData, total_area: Number(e.target.value)})} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Diện tích đã GPMB (ha)</label>
                    <input type="number" step="0.01" value={formData.cleared_area} onChange={e => setFormData({...formData, cleared_area: Number(e.target.value)})} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Trạng thái chung</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className={inputCls}>
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang thực hiện">Đang thực hiện</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Tổng số hộ dân</label>
                    <input type="number" value={formData.total_households} onChange={e => setFormData({...formData, total_households: Number(e.target.value)})} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Số hộ đã TĐC/Bồi thường</label>
                    <input type="number" value={formData.resettled_households} onChange={e => setFormData({...formData, resettled_households: Number(e.target.value)})} className={inputCls} />
                </div>
                <div className="hidden lg:block"></div>
                <div>
                    <label className={labelCls}>Tổng kinh phí GPMB (VNĐ)</label>
                    <input type="number" value={formData.compensation_budget} onChange={e => setFormData({...formData, compensation_budget: Number(e.target.value)})} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Đã giải ngân (VNĐ)</label>
                    <input type="number" value={formData.disbursed_compensation} onChange={e => setFormData({...formData, disbursed_compensation: Number(e.target.value)})} className={inputCls} />
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold border border-border rounded-xl bg-bg-surface hover:bg-bg-muted text-txt-primary transition-colors">Hủy</button>
                <button type="submit" disabled={updateClearance.isPending} className="px-4 py-2 text-sm font-bold border border-transparent rounded-xl text-white bg-primary-600 hover:bg-primary-700 flex items-center gap-2 transition-colors">
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
        const inputCls = "text-xs px-3 py-2 border border-border rounded-xl bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all";
        return (
            <tr className="bg-bg-muted/50 border-b border-border">
                <td className="px-3 py-3.5 text-center font-mono text-xs text-txt-muted">{milestone.step_number}</td>
                <td colSpan={canEdit ? 4 : 3} className="px-4 py-3.5">
                    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-center w-full">
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-sm font-bold text-txt-primary mb-2">{milestone.step_name}</p>
                            <input 
                                type="text" 
                                value={formData.notes} 
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                className="w-full text-xs px-3 py-2 border border-border rounded-xl bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" 
                                placeholder="Nhập ghi chú..."
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                value={formData.status} 
                                onChange={e => setFormData({...formData, status: e.target.value as any})}
                                className={inputCls}
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
                                className={`${inputCls} w-36`} 
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-2 bg-bg-surface border border-border text-txt-secondary hover:bg-bg-muted rounded-xl transition-colors text-xs font-bold">
                                    Hủy
                                </button>
                                <button type="submit" disabled={updateMilestone.isPending} className="px-3 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold shadow-sm">
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
        <tr className="group cursor-pointer transition-all hover:bg-bg-muted border-b border-border">
            {/* Bước */}
            <td className="px-3 py-3.5 text-center">
                <span className="text-xs text-txt-secondary font-bold bg-bg-muted px-2.5 py-1 rounded-lg border border-border">B.{milestone.step_number}</span>
            </td>
            {/* Nội dung */}
            <td className="px-4 py-3.5">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                        {getStatusIcon(milestone.status)}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-txt-primary text-sm group-hover:text-primary-500 transition-colors">{milestone.step_name}</p>
                        {milestone.notes && (
                            <p className="text-xs text-txt-muted mt-1 truncate max-w-[400px]">
                                <span className="font-bold mr-1 text-txt-secondary">Ghi chú:</span>{milestone.notes}
                            </p>
                        )}
                    </div>
                </div>
            </td>
            {/* Trạng thái */}
            <td className="px-4 py-3.5 text-center">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl whitespace-nowrap border ${
                    milestone.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    milestone.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    milestone.status === 'blocked' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-bg-muted text-txt-muted border-border'
                }`}>
                    {getStatusText(milestone.status)}
                </span>
            </td>
            {/* Ngày HT */}
            <td className="px-4 py-3.5 text-center">
                {milestone.completed_date ? (
                    <span className="text-xs font-bold text-txt-secondary bg-bg-muted px-2.5 py-1 rounded-lg border border-border">
                        {new Date(milestone.completed_date).toLocaleDateString('vi-VN')}
                    </span>
                ) : (
                    <span className="text-xs text-txt-muted italic">-</span>
                )}
            </td>
            {/* Thao tác */}
            {canEdit && (
                <td className="px-4 py-3.5 text-center">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-txt-muted hover:text-primary-500 hover:bg-bg-muted rounded-xl transition-colors"
                        title="Cập nhật"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                </td>
            )}
        </tr>
    );
}
