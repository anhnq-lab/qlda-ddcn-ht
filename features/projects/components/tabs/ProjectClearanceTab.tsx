import React, { useState } from 'react';
import { 
    Map, 
    Home, 
    CreditCard, 
    AlertCircle,
    RefreshCw,
    Pencil,
    Save,
    Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatNumber } from '@/utils/format';
import { SiteClearance } from '@/types';
import { 
    useSiteClearance, 
    useInitializeClearance, 
    useUpdateSiteClearance
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
    const initializeClearance = useInitializeClearance();

    const [isEditingGlobal, setIsEditingGlobal] = useState(false);

    if (isClearanceLoading) {
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
                    Dự án này chưa được khởi tạo thông tin quản lý Giải phóng mặt bằng.
                </p>
                {canEdit && (
                    <button 
                        onClick={() => initializeClearance.mutate(projectId)}
                        disabled={initializeClearance.isPending}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                    >
                        {initializeClearance.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Khởi tạo Thông tin GPMB
                    </button>
                )}
            </div>
        );
    }

    if (initializeClearance.isPending) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-slate-500">Đang khởi tạo thông tin GPMB...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-bold text-txt-primary flex items-center gap-2">
                        <Map className="w-5 h-5 text-emerald-500" />
                        Ghi nhận Thông tin GPMB
                    </h2>
                    <p className="text-xs text-txt-muted mt-1">Quản lý số liệu bồi thường, tái định cư và tiến độ bàn giao mặt bằng</p>
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
